import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseFloatPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { VenuesService } from './venues.service';

// Default search centre when the client sends no coordinates: Paris (demo area).
const DEFAULT_LAT = 48.8534;
const DEFAULT_LON = 2.3488;

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('nearby')
  async getNearby(
    @Query('lat', new DefaultValuePipe(DEFAULT_LAT), ParseFloatPipe)
    lat: number,
    @Query('lon', new DefaultValuePipe(DEFAULT_LON), ParseFloatPipe)
    lon: number,
    @Query('radius', new DefaultValuePipe(1500), ParseIntPipe) radius: number,
  ) {
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new BadRequestException('lat/lon out of range.');
    }
    const safeRadius = Math.min(Math.max(radius, 50), 20000);
    return this.venuesService.findNearby(lat, lon, safeRadius);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
  ) {
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLon = lon ? parseFloat(lon) : undefined;
    return this.venuesService.search(q || '', parsedLat, parsedLon);
  }

  @Get(':id/crowd')
  async getCrowdDetails(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('dow', new ParseIntPipe({ optional: true })) dow?: number,
  ) {
    // Day of week for the 24h history: 0 = Mon … 6 = Sun (defaults to today, local time)
    if (dow !== undefined && (dow < 0 || dow > 6)) {
      throw new BadRequestException('dow must be between 0 (Mon) and 6 (Sun).');
    }
    return this.venuesService.findOne(id, dow);
  }
}
