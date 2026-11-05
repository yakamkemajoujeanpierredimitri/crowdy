import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsIn, IsOptional, IsUrl } from 'class-validator';
import { HighlightsService } from './highlights.service';

export class UploadHighlightDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  mediaUrl!: string;

  @IsOptional()
  @IsIn(['image', 'video'])
  mediaType?: string;
}

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Get('venue/:venueId')
  async getHighlights(@Param('venueId', new ParseUUIDPipe()) venueId: string) {
    return this.highlightsService.getHighlightsByVenue(venueId);
  }

  @Post('venue/:venueId')
  async uploadHighlight(
    @Param('venueId', new ParseUUIDPipe()) venueId: string,
    @Body() body: UploadHighlightDto,
  ) {
    return this.highlightsService.uploadHighlight(
      venueId,
      body.mediaUrl,
      body.mediaType ?? 'image',
    );
  }
}
