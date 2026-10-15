import { Controller, Get, Query, Param, ParseIntPipe, ParseFloatPipe, DefaultValuePipe } from '@nestjs/common';
import { VenuesService } from './venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get('nearby')
  async getNearby(
    @Query('lat', new DefaultValuePipe(40.7128), ParseFloatPipe) lat: number,
    @Query('lon', new DefaultValuePipe(-74.0060), ParseFloatPipe) lon: number,
    @Query('radius', new DefaultValuePipe(1500), ParseIntPipe) radius: number
  ) {
    return this.venuesService.findNearby(lat, lon, radius);
  }

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('lat') lat?: string,
    @Query('lon') lon?: string
  ) {
    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLon = lon ? parseFloat(lon) : undefined;
    return this.venuesService.search(q || '', parsedLat, parsedLon);
  }

  @Get(':id/crowd')
  async getCrowdDetails(
    @Param('id') id: string,
    @Query('dow') dowString?: string
  ) {
    // If Day of Week is omitted, calculate current day: 0=Mon, 6=Sun
    let dow: number;
    if (dowString !== undefined) {
      dow = parseInt(dowString, 10);
    } else {
      // Date.getDay() returns: 0=Sun, 1=Mon, ..., 6=Sat
      // Translate to our schema: 0=Mon, 1=Tue, ..., 6=Sun
      const day = new Date().getDay();
      dow = day === 0 ? 6 : day - 1;
    }
    return this.venuesService.findOne(id, dow);
  }
}
