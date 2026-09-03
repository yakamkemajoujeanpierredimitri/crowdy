import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { HighlightsService } from './highlights.service';

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get('venue/:venueId')
  async getHighlights(@Param('venueId') venueId: string) {
    return this.highlightsService.getHighlightsByVenue(venueId);
  }

  @Post('venue/:venueId')
  async uploadHighlight(
    @Param('venueId') venueId: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('mediaType') mediaType: string,
  ) {
    return this.highlightsService.uploadHighlight(venueId, mediaUrl, mediaType);
  }
}
