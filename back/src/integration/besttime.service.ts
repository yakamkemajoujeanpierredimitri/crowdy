import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache/cache.service';

const NOT_INDEXED = 'NOT_INDEXED';
const ID_TTL_SECONDS = 86400; // remember BestTime venue ids (and misses) for 1 day
const LIVE_TTL_SECONDS = 900; // live busyness cached 15 min

@Injectable()
export class BestTimeService {
  private readonly logger = new Logger(BestTimeService.name);
  private readonly apiKey = process.env.BESTTIME_API_KEY;
  private readonly baseUrl = 'https://besttime.app/api/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Live busyness (0–100) for one of OUR venues, or null.
   * Caches the BestTime venue id — and the fact that a venue is not indexed —
   * so unknown venues don't trigger a new (credit-consuming) BestTime lookup
   * on every request.
   */
  async getLiveScoreForVenue(
    venueId: string,
    name: string,
    address: string,
  ): Promise<number | null> {
    if (!this.apiKey) return null;

    const cachedLive = await this.cacheService.get(`bt_live:${venueId}`);
    if (cachedLive !== null) {
      const parsed = parseFloat(cachedLive);
      return Number.isFinite(parsed) ? parsed : null;
    }

    let btId = await this.cacheService.get(`bt_id:${venueId}`);
    if (!btId) {
      btId = (await this.searchVenueId(name, address)) ?? NOT_INDEXED;
      await this.cacheService.set(`bt_id:${venueId}`, btId, ID_TTL_SECONDS);
    }
    if (btId === NOT_INDEXED) return null;

    const live = await this.getLiveBusyness(btId);
    if (live !== null) {
      await this.cacheService.set(
        `bt_live:${venueId}`,
        String(live),
        LIVE_TTL_SECONDS,
      );
    }
    return live;
  }

  /**
   * Fetches live busyness forecast for a specific venue by its BestTime venue_id
   */
  async getLiveBusyness(btVenueId: string): Promise<number | null> {
    if (!this.apiKey) {
      this.logger.warn(
        'BESTTIME_API_KEY is not set. Returning null for live busyness.',
      );
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/forecasts/live`, {
          params: {
            api_key_private: this.apiKey,
            venue_id: btVenueId,
          },
        }),
      );

      const data = response.data;
      if (
        data.status === 'OK' &&
        data.analysis &&
        data.analysis.venue_live_busyness_available
      ) {
        // Returns a score from 0 to 100
        return data.analysis.venue_live_busyness;
      }

      this.logger.debug(`Live busyness not available for venue ${btVenueId}`);
      return null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.debug(
          `Live forecast not indexed in BestTime for venue ${btVenueId} (404)`,
        );
      } else {
        this.logger.warn(`BestTime live forecast check: ${error?.message}`);
      }
      return null;
    }
  }

  /**
   * Searches for a venue to get its BestTime venue_id
   */
  async searchVenueId(name: string, address: string): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/forecasts`, null, {
          params: {
            api_key_private: this.apiKey,
            venue_name: name,
            venue_address: address,
          },
        }),
      );

      return response.data?.venue_info?.venue_id || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.debug(
          `Venue "${name}" not indexed in BestTime database (404). Falling back to platform curves.`,
        );
      } else {
        this.logger.warn(
          `BestTime venue search for "${name}": ${error?.message}`,
        );
      }
      return null;
    }
  }
}
