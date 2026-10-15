import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BestTimeService } from './besttime.service';

@Module({
  imports: [HttpModule],
  providers: [BestTimeService],
  exports: [BestTimeService],
})
export class BestTimeModule {}
