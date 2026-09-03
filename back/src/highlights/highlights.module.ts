import { Module } from '@nestjs/common';
import { HighlightsController } from './highlights.controller';
import { HighlightsService } from './highlights.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [HighlightsController],
  providers: [HighlightsService]
})
export class HighlightsModule {}
