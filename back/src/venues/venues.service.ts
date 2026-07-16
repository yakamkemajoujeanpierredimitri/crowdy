import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class VenuesService {
  constructor(
    private dbService: DbService,
    private cacheService: CacheService
  ) {}

  async findNearby(lat: number, lon: number, radiusMeters: number) {
    const queryText = `
      SELECT
        v.id,
        v.name,
        v.category,
        ST_X(v.location::geometry) as lon,
        ST_Y(v.location::geometry) as lat,
        v.address,
        v.description,
        v.hours,
        v.website,
        v.image,
        v.lambda,
        ROUND(ST_Distance(v.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)) AS distance,
        cs.current_score,
        cs.label
      FROM venues v
      LEFT JOIN crowd_scores cs ON cs.venue_id = v.id
      WHERE ST_DWithin(
        v.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance ASC
      LIMIT 50;
    `;
    
    const { rows } = await this.dbService.query(queryText, [lon, lat, radiusMeters]);

    // Check cached scores for real-time accuracy override
    for (const row of rows) {
      const cached = await this.cacheService.get(`score:${row.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          row.current_score = parsed.current_score;
          row.label = parsed.label;
          row.source = 'Cache';
        } catch (e) {}
      }
    }

    return rows;
  }

  async findOne(id: string, dayOfWeek: number) {
    // 1. Get Venue Core & Live Score
    const venueQuery = `
      SELECT 
        v.id, v.name, v.category, ST_X(v.location::geometry) as lon, ST_Y(v.location::geometry) as lat,
        v.address, v.description, v.hours, v.website, v.image, v.lambda,
        cs.current_score, cs.label
      FROM venues v
      LEFT JOIN crowd_scores cs ON cs.venue_id = v.id
      WHERE v.id = $1;
    `;
    const venueRes = await this.dbService.query(venueQuery, [id]);
    if (venueRes.rows.length === 0) {
      throw new NotFoundException(`Venue with ID ${id} not found.`);
    }
    const venue = venueRes.rows[0];

    // Check Cache Override
    const cachedScore = await this.cacheService.get(`score:${id}`);
    if (cachedScore) {
      try {
        const parsed = JSON.parse(cachedScore);
        venue.current_score = parsed.current_score;
        venue.label = parsed.label;
      } catch (e) {}
    }

    // 2. Get 24h baseline pattern (day of week: 0=Mon to 6=Sun)
    const historyQuery = `
      SELECT hour, avg_score
      FROM historical_patterns
      WHERE venue_id = $1 AND day_of_week = $2
      ORDER BY hour ASC;
    `;
    const historyRes = await this.dbService.query(historyQuery, [id, dayOfWeek]);
    const history = historyRes.rows.map((row) => row.avg_score);

    // If dayOfWeek patterns don't exist, fill with standard 24 elements of 0
    const historyCurve = history.length === 24 ? history : Array(24).fill(0);

    // 3. Get recent reports (last 10)
    const reportsQuery = `
      SELECT id, score, created_at, user_id, source_type
      FROM crowd_reports
      WHERE venue_id = $1
      ORDER BY created_at DESC
      LIMIT 10;
    `;
    const reportsRes = await this.dbService.query(reportsQuery, [id]);

    return {
      ...venue,
      history: historyCurve,
      recentReports: reportsRes.rows
    };
  }

  async search(query: string) {
    const queryText = `
      SELECT 
        v.id, v.name, v.category, v.address, v.description, v.hours, v.website, v.image, v.lambda,
        cs.current_score, cs.label
      FROM venues v
      LEFT JOIN crowd_scores cs ON cs.venue_id = v.id
      WHERE v.name ILIKE $1 OR v.address ILIKE $1 OR v.category ILIKE $1
      ORDER BY v.name ASC;
    `;
    const { rows } = await this.dbService.query(queryText, [`%${query}%`]);

    for (const row of rows) {
      const cached = await this.cacheService.get(`score:${row.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          row.current_score = parsed.current_score;
          row.label = parsed.label;
        } catch (e) {}
      }
    }

    return rows;
  }
}
