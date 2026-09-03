import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { CacheModule } from './cache/cache.module';
import { VenuesModule } from './venues/venues.module';
import { ReportsModule } from './reports/reports.module';
import { LiveModule } from './live/live.module';
import { ClaimsModule } from './claims/claims.module';
import { HighlightsModule } from './highlights/highlights.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    CacheModule,
    VenuesModule,
    ReportsModule,
    LiveModule,
    ClaimsModule,
    HighlightsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

