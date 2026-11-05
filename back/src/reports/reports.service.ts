import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CacheService } from '../cache/cache.service';
import { LiveGateway } from '../live/live.gateway';
import { BestTimeService } from '../integration/besttime.service';
import { classifyScore, computeCrowdScore } from '../common/scoring';
import { getLocalDowHour } from '../common/time';

interface VenueRow {
  name: string;
  address: string;
  category: string;
  lambda: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private dbService: DbService,
    private cacheService: CacheService,
    private liveGateway: LiveGateway,
    private bestTimeService: BestTimeService,
  ) {}

  async submitReport(
    venueId: string,
    score: number,
    userId: string,
    sourceType = 'manual',
  ) {
    // 1. DTO validation check
    if (score < 0 || score > 100) {
      throw new BadRequestException('Crowd score must be between 0 and 100.');
    }

    // 2. Fetch Venue Details (decay constant lambda + name/address for BestTime)
    const venueRes = await this.dbService.query<VenueRow>(
      'SELECT name, address, category, lambda FROM venues WHERE id = $1;',
      [venueId],
    );
    if (venueRes.rows.length === 0) {
      throw new BadRequestException('Invalid venue ID.');
    }
    const venue = venueRes.rows[0];

    // 3. Make sure the reporter exists (new users start at reputation 0.5)
    await this.dbService.query(
      'INSERT INTO users (auth_id, reputation_score) VALUES ($1, 0.5) ON CONFLICT (auth_id) DO NOTHING;',
      [userId],
    );

    // 4. Enforce Rate Limiting: Max 3 reports per user per venue per hour
    const rateLimitRes = await this.dbService.query<{ count: string }>(
      `SELECT COUNT(*) FROM crowd_reports
       WHERE user_id = $1 AND venue_id = $2 AND created_at > now() - INTERVAL '1 hour';`,
      [userId, venueId],
    );
    if (parseInt(rateLimitRes.rows[0].count, 10) >= 3) {
      throw new BadRequestException(
        'Rate limit exceeded: Max 3 submissions per venue per hour.',
      );
    }

    // 5. Z-Score anomaly check against recent reports (last 20 within 4h)
    const recentReportsRes = await this.dbService.query<{ score: number }>(
      `SELECT score FROM crowd_reports
       WHERE venue_id = $1 AND created_at > now() - INTERVAL '4 hours'
       ORDER BY created_at DESC
       LIMIT 20;`,
      [venueId],
    );
    const recentScores = recentReportsRes.rows.map((r) => r.score);

    const anomalyStatus = this.checkAnomaly(score, recentScores);
    if (anomalyStatus === 'discard') {
      this.logger.warn(
        `Anomaly Discard: Score ${score} from User ${userId} at Venue ${venueId} blocked by Z-Score check.`,
      );
      return {
        status: 'discarded',
        message: 'Report blocked by anomaly detection.',
      };
    }
    if (anomalyStatus === 'flag') {
      this.logger.warn(
        `Anomaly Warning: Score ${score} from User ${userId} at Venue ${venueId} flagged (Z > 2.5).`,
      );
    }

    // 6. Save new report
    await this.dbService.query(
      'INSERT INTO crowd_reports (venue_id, user_id, score, source_type) VALUES ($1, $2, $3, $4);',
      [venueId, userId, score, sourceType],
    );
    await this.dbService.query(
      'UPDATE users SET report_count = report_count + 1 WHERE auth_id = $1;',
      [userId],
    );

    // 7. Core Recalculation Pipeline
    await this.recalculateScore(venueId, venue);

    return { status: 'success', message: 'Report processed successfully.' };
  }

  private checkAnomaly(
    newScore: number,
    recentScores: number[],
  ): 'accept' | 'flag' | 'discard' {
    if (recentScores.length < 5) return 'accept';

    const mean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const variance =
      recentScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      recentScores.length;
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

  private async recalculateScore(venueId: string, venue: VenueRow) {
    const now = new Date();
    const { dow, hour } = getLocalDowHour(now);

    // 1. Baseline — BestTime live busyness first, then local historical pattern
    let baselineScore = 50;
    let baselineSource = 'Default';

    const live = await this.bestTimeService.getLiveScoreForVenue(
      venueId,
      venue.name,
      venue.address,
    );
    if (live !== null) {
      baselineScore = live;
      baselineSource = 'BestTime';
    } else {
      const baselineRes = await this.dbService.query<{ avg_score: number }>(
        `SELECT avg_score FROM historical_patterns
         WHERE venue_id = $1 AND day_of_week = $2 AND hour = $3;`,
        [venueId, dow, hour],
      );
      if (baselineRes.rows.length > 0) {
        baselineScore = baselineRes.rows[0].avg_score;
        baselineSource = 'Historical';
      }
    }

    this.logger.log(
      `Baseline for venue ${venueId}: ${baselineScore} (source: ${baselineSource})`,
    );

    // 2. Reports inside the decay window (4 hours), with reporter reputation
    const activeRes = await this.dbService.query<{
      score: number;
      created_at: Date;
      reputation_score: number | null;
    }>(
      `SELECT cr.score, cr.created_at, u.reputation_score
       FROM crowd_reports cr
       LEFT JOIN users u ON u.auth_id = cr.user_id
       WHERE cr.venue_id = $1 AND cr.created_at > now() - INTERVAL '4 hours'
       ORDER BY cr.created_at DESC
       LIMIT 20;`,
      [venueId],
    );

    const result = computeCrowdScore(
      baselineScore,
      activeRes.rows.map((r) => ({
        score: r.score,
        createdAt: new Date(r.created_at),
        reputation: r.reputation_score,
      })),
      venue.lambda,
      now,
    );
    const finalScore = result.score;
    const source = result.usedReports > 0 ? 'Verified Live' : baselineSource;
    const classification = classifyScore(finalScore);

    // 3. Persist (read endpoints only trust crowd_scores for 4 hours)
    await this.dbService.query(
      `INSERT INTO crowd_scores (venue_id, current_score, label, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (venue_id)
       DO UPDATE SET current_score = EXCLUDED.current_score, label = EXCLUDED.label, updated_at = now();`,
      [venueId, finalScore, classification.label],
    );

    // 4. Short-lived cache for the read endpoints
    await this.cacheService.set(
      `score:${venueId}`,
      JSON.stringify({
        current_score: finalScore,
        label: classification.label,
        color: classification.color,
        source,
        updated_at: now.toISOString(),
      }),
      60,
    );

    // 5. Broadcast to Socket.io room subscribers
    this.liveGateway.emitScoreUpdate(venueId, {
      score: finalScore,
      label: classification.label,
      color: classification.color,
      source,
    });
  }
}
