import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CacheService } from '../cache/cache.service';
import { LiveGateway } from '../live/live.gateway';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private dbService: DbService,
    private cacheService: CacheService,
    private liveGateway: LiveGateway
  ) {}

  async submitReport(venueId: string, score: number, userId: string, sourceType = 'manual') {
    // 1. DTO validation check
    if (score < 0 || score > 100) {
      throw new BadRequestException('Crowd score must be between 0 and 100.');
    }

    // 2. Fetch or create User and get reputation weight
    let reputation = 0.5;
    const userSelectQuery = 'SELECT reputation_score FROM users WHERE auth_id = $1;';
    const userRes = await this.dbService.query(userSelectQuery, [userId]);
    
    if (userRes.rows.length > 0) {
      reputation = userRes.rows[0].reputation_score;
    } else {
      // Create user
      await this.dbService.query(
        'INSERT INTO users (auth_id, reputation_score) VALUES ($1, 0.5) ON CONFLICT DO NOTHING;',
        [userId]
      );
    }

    // 3. Enforce Rate Limiting: Max 3 reports per user per venue per hour
    const rateLimitQuery = `
      SELECT COUNT(*) 
      FROM crowd_reports 
      WHERE user_id = $1 AND venue_id = $2 AND created_at > now() - INTERVAL '1 hour';
    `;
    const rateLimitRes = await this.dbService.query(rateLimitQuery, [userId, venueId]);
    if (parseInt(rateLimitRes.rows[0].count, 10) >= 3) {
      throw new BadRequestException('Rate limit exceeded: Max 3 submissions per venue per hour.');
    }

    // 4. Fetch Venue Details to get decay constant (lambda)
    const venueQuery = 'SELECT category, lambda FROM venues WHERE id = $1;';
    const venueRes = await this.dbService.query(venueQuery, [venueId]);
    if (venueRes.rows.length === 0) {
      throw new BadRequestException('Invalid venue ID.');
    }
    const venue = venueRes.rows[0];

    // 5. Fetch Recent Reports for Z-score Anomaly check (last 20)
    const recentReportsQuery = `
      SELECT score FROM crowd_reports 
      WHERE venue_id = $1 AND created_at > now() - INTERVAL '4 hours'
      ORDER BY created_at DESC 
      LIMIT 20;
    `;
    const recentReportsRes = await this.dbService.query(recentReportsQuery, [venueId]);
    const recentScores: number[] = recentReportsRes.rows.map((r) => r.score);

    // Z-Score Check
    const anomalyStatus = this.checkAnomaly(score, recentScores);
    if (anomalyStatus === 'discard') {
      this.logger.warn(`Anomaly Discard: Score ${score} from User ${userId} at Venue ${venueId} blocked by Z-Score check.`);
      return { status: 'discarded', message: 'Report blocked by anomaly detection.' };
    }

    if (anomalyStatus === 'flag') {
      this.logger.warn(`Anomaly Warning: Score ${score} from User ${userId} at Venue ${venueId} flagged (Z > 2.5).`);
    }

    // 6. Save new report to Database
    await this.dbService.query(
      'INSERT INTO crowd_reports (venue_id, user_id, score, source_type) VALUES ($1, $2, $3, $4);',
      [venueId, userId, score, sourceType]
    );

    // Update user reports count
    await this.dbService.query(
      'UPDATE users SET report_count = report_count + 1 WHERE auth_id = $1;',
      [userId]
    );

    // 7. Core Recalculation Pipeline
    await this.recalculateScore(venueId, venue.category, venue.lambda);

    return { status: 'success', message: 'Report processed successfully.' };
  }

  private checkAnomaly(newScore: number, recentScores: number[]): 'accept' | 'flag' | 'discard' {
    if (recentScores.length < 5) return 'accept';

    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance = recentScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / recentScores.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      const diff = Math.abs(newScore - mean);
      return diff > 35 ? 'discard' : 'accept';
    }

    const z = Math.abs((newScore - mean) / stdDev);
    
    if (z > 3.5) return 'discard';
    if (z > 2.5) return 'flag';
    return 'accept';
  }

  private async recalculateScore(venueId: string, category: string, lambda: number) {
    const now = new Date();
    // Day of week: 0=Mon to 6=Sun
    const day = now.getDay();
    const dow = day === 0 ? 6 : day - 1;
    const hour = now.getHours();

    // 1. Fetch current Google Historical Baseline
    const baselineQuery = `
      SELECT avg_score FROM historical_patterns 
      WHERE venue_id = $1 AND day_of_week = $2 AND hour = $3;
    `;
    const baselineRes = await this.dbService.query(baselineQuery, [venueId, dow, hour]);
    const googleScore = baselineRes.rows.length > 0 ? baselineRes.rows[0].avg_score : 50;

    // 2. Fetch last 10 user reports inside decay window (4 hours)
    const activeReportsQuery = `
      SELECT cr.score, cr.created_at, u.reputation_score
      FROM crowd_reports cr
      LEFT JOIN users u ON u.auth_id = cr.user_id
      WHERE cr.venue_id = $1 AND cr.created_at > now() - INTERVAL '4 hours'
      ORDER BY cr.created_at DESC
      LIMIT 10;
    `;
    const activeRes = await this.dbService.query(activeReportsQuery, [venueId]);
    const reports = activeRes.rows;

    const activeDecayedReports: number[] = [];
    const reportsInLastHour: any[] = [];
    const nowMs = now.getTime();

    reports.forEach((report: any) => {
      const deltaMinutes = (nowMs - new Date(report.created_at).getTime()) / 60000;
      if (deltaMinutes < 0) return;

      // Temporal Decay calculation
      const decayedScore = report.score * Math.exp(-lambda * deltaMinutes);
      const repWeight = report.reputation_score || 0.5;
      const weightedDecayed = decayedScore * repWeight;

      activeDecayedReports.push(weightedDecayed);

      if (deltaMinutes <= 60) {
        reportsInLastHour.push(report);
      }
    });

    // 3. Dynamic Weight Boost
    const w2 = reportsInLastHour.length >= 3 ? 0.65 : 0.45;
    const w1 = 1 - w2;

    let finalScore: number;
    let source = 'Google Times';

    if (activeDecayedReports.length > 0) {
      const userScoreAvg = activeDecayedReports.reduce((a, b) => a + b, 0) / activeDecayedReports.length;
      const raw = (w1 * googleScore) + (w2 * userScoreAvg);
      finalScore = Math.round(Math.min(100, Math.max(0, raw)));
      source = `Verified Live`;
    } else {
      finalScore = googleScore;
    }

    // 4. Classify Score (Label & Color)
    const classification = this.classifyScore(finalScore);

    // 5. Update crowd_scores Table in DB
    const updateScoreQuery = `
      INSERT INTO crowd_scores (venue_id, current_score, label, updated_at)
      VALUES ($1, $2, $3, now())
      ON CONFLICT (venue_id)
      DO UPDATE SET current_score = EXCLUDED.current_score, label = EXCLUDED.label, updated_at = now();
    `;
    await this.dbService.query(updateScoreQuery, [venueId, finalScore, classification.label]);

    // 6. Update Redis cache key with 60 second TTL
    const cachePayload = JSON.stringify({
      current_score: finalScore,
      label: classification.label,
      color: classification.color,
      source,
      updated_at: now.toISOString()
    });
    
    await this.cacheService.set(`score:${venueId}`, cachePayload, 60);

    // 7. Broadcast update to WS Socket.io room subscribers
    this.liveGateway.emitScoreUpdate(venueId, {
      score: finalScore,
      label: classification.label,
      color: classification.color,
      source
    });
  }

  private classifyScore(score: number) {
    if (score <= 20) return { label: 'Empty', color: '#10B981' };
    if (score <= 40) return { label: 'Quiet', color: '#34D399' };
    if (score <= 60) return { label: 'Moderate', color: '#F59E0B' };
    if (score <= 80) return { label: 'Busy', color: '#EF6C00' };
    return { label: 'Packed', color: '#EF4444' };
  }
}
