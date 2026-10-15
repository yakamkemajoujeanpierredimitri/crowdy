import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BestTimeService {
  private readonly logger = new Logger(BestTimeService.name);
  private readonly apiKey = process.env.BESTTIME_API_KEY;
  private readonly baseUrl = 'https://besttime.app/api/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetches live busyness forecast for a specific venue by its BestTime venue_id
   */
  async getLiveBusyness(venueId: string): Promise<number | null> {
    if (!this.apiKey) {
      this.logger.warn('BESTTIME_API_KEY is not set. Returning null for live busyness.');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/forecasts/live`, {
          params: {
            api_key_private: this.apiKey,
            venue_id: venueId,
          },
        })
      );

      const data = response.data;
      if (data.status === 'OK' && data.analysis && data.analysis.venue_live_busyness_available) {
        // Returns a score from 0 to 100
        return data.analysis.venue_live_busyness;
      }
      
      this.logger.debug(`Live busyness not available for venue ${venueId}`);
      return null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.debug(`Live forecast not indexed in BestTime for venue ${venueId} (404)`);
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
        })
      );

      return response.data?.venue_info?.venue_id || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        this.logger.debug(`Venue "${name}" not indexed in BestTime database (404). Falling back to platform curves.`);
      } else {
        this.logger.warn(`BestTime venue search for "${name}": ${error?.message}`);
      }
      return null;
    }
  }
}
