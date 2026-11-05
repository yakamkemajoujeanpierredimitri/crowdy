import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DbService } from '../db/db.service';
import { CacheService } from '../cache/cache.service';
import { BestTimeService } from '../integration/besttime.service';
import { classifyScore } from '../common/scoring';
import { getLocalDowHour } from '../common/time';

/**
 * current_score shown to users:
 *  - the last report-based score if it is less than 4 hours old (same window as the decay model),
 *  - otherwise the historical baseline for the current local day/hour.
 * Without the 4h limit a score from one report stayed on the venue forever.
 */
const SCORE_COLUMNS = `
  CASE WHEN cs.updated_at > now() - INTERVAL '4 hours' THEN cs.current_score ELSE hp.avg_score END AS current_score,
  CASE WHEN cs.updated_at > now() - INTERVAL '4 hours' THEN 'Verified Live'
       WHEN hp.avg_score IS NOT NULL AND v.google_place_id LIKE 'osm:%' THEN 'Estimated'
       WHEN hp.avg_score IS NOT NULL THEN 'Historical' END AS source`;

const scoreJoins = (dowParam: string, hourParam: string) => `
  LEFT JOIN crowd_scores cs ON cs.venue_id = v.id
  LEFT JOIN historical_patterns hp
    ON hp.venue_id = v.id AND hp.day_of_week = ${dowParam} AND hp.hour = ${hourParam}`;

const VENUE_COLUMNS = `
  v.id, v.name, v.category,
  ST_X(v.location::geometry) AS lon,
  ST_Y(v.location::geometry) AS lat,
  v.address, v.description, v.hours, v.website, v.image, v.lambda`;

const CATEGORY_LAMBDA: Record<string, number> = {
  cafe: 0.05,
  restaurant: 0.02,
  gym: 0.012,
  park: 0.008,
  nightclub: 0.015,
};

const CATEGORY_BASE_SCORE: Record<string, number> = {
  cafe: 55,
  restaurant: 45,
  gym: 60,
  park: 25,
  nightclub: 70,
};

interface NominatimItem {
  osm_type?: string;
  osm_id?: number;
  class?: string;
  type?: string;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);
  // Nominatim usage policy: max 1 request per second.
  private nominatimQueue: Promise<unknown> = Promise.resolve();
  private lastNominatimCall = 0;

  constructor(
    private dbService: DbService,
    private cacheService: CacheService,
    private bestTimeService: BestTimeService,
    private httpService: HttpService,
  ) {}

  async findNearby(lat: number, lon: number, radiusMeters: number) {
    const { dow, hour } = getLocalDowHour();
    const { rows } = await this.dbService.query(
      `SELECT ${VENUE_COLUMNS},
         ROUND(ST_Distance(v.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)) AS distance,
         ${SCORE_COLUMNS}
       FROM venues v
       ${scoreJoins('$4', '$5')}
       WHERE ST_DWithin(v.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
       ORDER BY distance ASC
       LIMIT 50;`,
      [lon, lat, radiusMeters, dow, hour],
    );

    for (const row of rows) await this.applyScoreOverrides(row);
    return rows;
  }

  async findOne(id: string, dayOfWeek?: number) {
    const { dow, hour } = getLocalDowHour();

    // 1. Venue core + current score
    const venueRes = await this.dbService.query(
      `SELECT ${VENUE_COLUMNS}, ${SCORE_COLUMNS}
       FROM venues v
       ${scoreJoins('$2', '$3')}
       WHERE v.id = $1;`,
      [id, dow, hour],
    );
    if (venueRes.rows.length === 0) {
      throw new NotFoundException(`Venue with ID ${id} not found.`);
    }
    const venue = venueRes.rows[0];

    const usedCache = await this.applyScoreOverrides(venue);

    // BestTime live busyness (cached 15 min; unknown venues remembered for 1 day)
    if (!usedCache) {
      const live = await this.bestTimeService.getLiveScoreForVenue(
        id,
        venue.name,
        venue.address,
      );
      if (live !== null) {
        venue.current_score = live;
        venue.source = 'BestTime';
        venue.label = classifyScore(live).label;
      }
    }

    // 2. 24h baseline pattern (day of week: 0=Mon to 6=Sun)
    const historyRes = await this.dbService.query<{ avg_score: number }>(
      `SELECT hour, avg_score FROM historical_patterns
       WHERE venue_id = $1 AND day_of_week = $2
       ORDER BY hour ASC;`,
      [id, dayOfWeek ?? dow],
    );
    const history = historyRes.rows.map((row) => row.avg_score);
    const historyCurve = history.length === 24 ? history : Array(24).fill(0);

    // 3. Recent reports (last 10)
    const reportsRes = await this.dbService.query(
      `SELECT id, score, created_at, user_id, source_type
       FROM crowd_reports
       WHERE venue_id = $1
       ORDER BY created_at DESC
       LIMIT 10;`,
      [id],
    );

    return {
      ...venue,
      history: historyCurve,
      recentReports: reportsRes.rows,
    };
  }

  async search(query: string, userLat?: number, userLon?: number) {
    const trimmed = (query || '').trim().slice(0, 100);
    if (trimmed.length < 2) return [];

    const rows = await this.searchDatabase(trimmed, userLat, userLon);

    // On-demand discovery of REAL places from OpenStreetMap when nothing matches.
    if (rows.length === 0 && trimmed.length >= 3) {
      return this.discoverFromOpenStreetMap(trimmed);
    }
    return rows;
  }

  private async searchDatabase(q: string, userLat?: number, userLon?: number) {
    const { dow, hour } = getLocalDowHour();
    const hasPoint = Number.isFinite(userLat) && Number.isFinite(userLon);
    const distanceColumn = hasPoint
      ? `, ROUND(ST_Distance(v.location, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography)) AS distance`
      : '';
    const { rows } = await this.dbService.query(
      `SELECT ${VENUE_COLUMNS}, ${SCORE_COLUMNS}${distanceColumn}
       FROM venues v
       ${scoreJoins('$2', '$3')}
       WHERE v.name ILIKE $1 OR v.address ILIKE $1 OR v.category ILIKE $1
       ORDER BY ${hasPoint ? 'distance ASC' : 'v.name ASC'}
       LIMIT 50;`,
      hasPoint
        ? [`%${q}%`, dow, hour, userLon, userLat]
        : [`%${q}%`, dow, hour],
    );
    for (const row of rows) await this.applyScoreOverrides(row);
    return rows;
  }

  /**
   * Fresher scores than the database: the 60s cache written after each report,
   * then the 15-min BestTime cache. Also fills label/color. Returns true if a
   * cached score was used.
   */
  private async applyScoreOverrides(row: any): Promise<boolean> {
    let used = false;
    const cached = await this.cacheService.get(`score:${row.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        row.current_score = parsed.current_score;
        row.source = parsed.source || 'Cache';
        used = true;
      } catch {
        // ignore malformed cache entry
      }
    }
    if (!used) {
      const btLive = await this.cacheService.get(`bt_live:${row.id}`);
      if (btLive !== null && Number.isFinite(parseFloat(btLive))) {
        row.current_score = Math.round(parseFloat(btLive));
        row.source = 'BestTime';
        used = true;
      }
    }
    if (typeof row.current_score === 'number') {
      const c = classifyScore(row.current_score);
      row.label = c.label;
      row.color = c.color;
    } else {
      row.current_score = null;
      row.label = null;
    }
    return used;
  }

  /**
   * Looks the query up on OpenStreetMap (Nominatim).
   *  - Real venues (cafes, restaurants, gyms, parks, nightclubs) are saved and returned.
   *  - If the query is an area/street, returns the venues we already have around it.
   * Nothing is invented. Results are cached for 24h per query.
   */
  private async discoverFromOpenStreetMap(query: string) {
    const cacheKey = `osm_search:${query.toLowerCase()}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      try {
        const ids = JSON.parse(cached) as string[];
        return ids.length ? this.findByIds(ids) : [];
      } catch {
        // fall through and query again
      }
    }

    let items: NominatimItem[] = [];
    try {
      items = await this.nominatimSearch(query);
    } catch (err: any) {
      this.logger.warn(
        `OpenStreetMap lookup failed for "${query}": ${err?.message}`,
      );
      return []; // don't cache failures
    }

    const venueIds: string[] = [];
    for (const item of items) {
      const category = this.mapCategory(item.class, item.type);
      if (!category) continue;
      const id = await this.persistDiscoveredVenue(item, category);
      if (id && !venueIds.includes(id)) venueIds.push(id);
    }

    if (venueIds.length > 0) {
      await this.cacheService.set(cacheKey, JSON.stringify(venueIds), 86400);
      return this.findByIds(venueIds);
    }

    // The query is an area / street / city: show what we have around it.
    const primary = items[0];
    if (primary) {
      const lat = parseFloat(primary.lat);
      const lon = parseFloat(primary.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        const around = await this.findNearby(lat, lon, 2000);
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(around.map((v: { id: string }) => v.id)),
          3600,
        );
        return around;
      }
    }

    await this.cacheService.set(cacheKey, '[]', 3600);
    return [];
  }

  private nominatimSearch(query: string): Promise<NominatimItem[]> {
    const run = async () => {
      const wait = 1100 - (Date.now() - this.lastNominatimCall);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.lastNominatimCall = Date.now();
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8`;
      const response = await firstValueFrom(
        this.httpService.get<NominatimItem[]>(url, {
          headers: {
            'User-Agent':
              process.env.NOMINATIM_USER_AGENT || 'CrowdSense-Platform/1.0',
          },
          timeout: 4000,
        }),
      );
      return Array.isArray(response.data) ? response.data : [];
    };
    const result = this.nominatimQueue.then(run, run);
    this.nominatimQueue = result.catch(() => undefined);
    return result;
  }

  private async findByIds(ids: string[]) {
    const { dow, hour } = getLocalDowHour();
    const { rows } = await this.dbService.query(
      `SELECT ${VENUE_COLUMNS}, ${SCORE_COLUMNS}
       FROM venues v
       ${scoreJoins('$2', '$3')}
       WHERE v.id = ANY($1::uuid[])
       ORDER BY v.name ASC;`,
      [ids, dow, hour],
    );
    for (const row of rows) await this.applyScoreOverrides(row);
    return rows;
  }

  /** Saves a real OSM place once (keyed by its OSM id) and returns our venue id. */
  private async persistDiscoveredVenue(
    item: NominatimItem,
    category: string,
  ): Promise<string | null> {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const externalId =
      item.osm_type && item.osm_id
        ? `osm:${item.osm_type}/${item.osm_id}`
        : `osm:${lat.toFixed(6)},${lon.toFixed(6)}`;
    const name = this.cleanVenueName(item.name || item.display_name);
    const address = item.display_name.split(',').slice(0, 3).join(', ').trim();

    try {
      const inserted = await this.dbService.query<{ id: string }>(
        `INSERT INTO venues (name, category, location, address, description, lambda, capacity, google_place_id)
         VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, 100, $8)
         ON CONFLICT (google_place_id) DO NOTHING
         RETURNING id;`,
        [
          name,
          category,
          lon,
          lat,
          address,
          `${category[0].toUpperCase()}${category.slice(1)} discovered via OpenStreetMap. Crowd levels are estimated until people report.`,
          CATEGORY_LAMBDA[category] ?? 0.02,
          externalId,
        ],
      );

      const venueId = inserted.rows[0]?.id;
      if (!venueId) {
        const existing = await this.dbService.query<{ id: string }>(
          'SELECT id FROM venues WHERE google_place_id = $1;',
          [externalId],
        );
        return existing.rows[0]?.id ?? null;
      }

      // Estimated 24h curve (one query instead of 168 inserts)
      const base = CATEGORY_BASE_SCORE[category] ?? 40;
      const curve = Array.from({ length: 24 }, (_, h) =>
        h >= 7 && h <= 22
          ? Math.max(0, Math.round(base * Math.sin(((h - 6) / 16) * Math.PI)))
          : 0,
      );
      await this.dbService.query(
        `INSERT INTO historical_patterns (venue_id, day_of_week, hour, avg_score)
         SELECT $1, d, h, ($2::int[])[h + 1]
         FROM generate_series(0, 6) AS d, generate_series(0, 23) AS h
         ON CONFLICT DO NOTHING;`,
        [venueId, curve],
      );
      return venueId;
    } catch (err: any) {
      this.logger.error(`Failed to persist venue "${name}": ${err?.message}`);
      return null;
    }
  }

  private cleanVenueName(raw: string): string {
    const cleaned = raw.split(',')[0].trim();
    return cleaned.length > 40 ? cleaned.slice(0, 37) + '...' : cleaned;
  }

  /** Maps an OSM class/type to one of our categories, or null if we don't track it. */
  private mapCategory(osmClass?: string, osmType?: string): string | null {
    if (!osmClass || !['amenity', 'leisure', 'shop'].includes(osmClass)) {
      return null;
    }
    switch (osmType) {
      case 'cafe':
      case 'coffee_shop':
      case 'fast_food':
        return 'cafe';
      case 'restaurant':
      case 'bar':
      case 'pub':
      case 'bistro':
        return 'restaurant';
      case 'nightclub':
        return 'nightclub';
      case 'fitness_centre':
      case 'sports_centre':
      case 'gym':
        return 'gym';
      case 'park':
      case 'garden':
      case 'nature_reserve':
        return 'park';
      default:
        return null;
    }
  }
}
