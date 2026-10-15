import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';

import { BestTimeModule } from '../integration/besttime.module';

@Module({
  imports: [BestTimeModule, HttpModule],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
