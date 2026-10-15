import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DbService.name);

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL') || 
      'postgresql://postgres:postgres@localhost:5432/crowdsense';
    
    this.pool = new Pool({
      connectionString,
    });
  }

  async onModuleInit() {
    try {
      await this.initializeDatabase();
      this.logger.log('Database initialized successfully.');
    } catch (err: any) {
      this.logger.error('Failed to initialize database: ' + err.message);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  private async initializeDatabase() {
    // 1. Create PostGIS extension
    await this.pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // 2. Create Venues Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            TEXT NOT NULL,
        category        TEXT NOT NULL,
        location        GEOGRAPHY(POINT, 4326) NOT NULL,
        capacity        INT,
        google_place_id TEXT UNIQUE,
        address         TEXT,
        description     TEXT,
        hours           TEXT,
        website         TEXT,
        image           TEXT,
        lambda          DOUBLE PRECISION DEFAULT 0.02,
        created_at      TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 3. Create Spatial Index
    await this.pool.query('CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST(location);');

    // 4. Create Crowd Reports Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS crowd_reports (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
        user_id     TEXT NOT NULL,
        score       INT NOT NULL CHECK (score BETWEEN 0 AND 100),
        source_type TEXT NOT NULL DEFAULT 'manual',
        created_at  TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 5. Create Crowd Scores Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS crowd_scores (
        venue_id      UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
        current_score INT NOT NULL DEFAULT 0,
        label         TEXT NOT NULL DEFAULT 'Unknown',
        updated_at    TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 6. Create Users Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_id             TEXT UNIQUE NOT NULL,
        reputation_score    DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        report_count        INT NOT NULL DEFAULT 0,
        role                TEXT NOT NULL DEFAULT 'user',
        tier                TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id  TEXT,
        subscription_status TEXT,
        created_at          TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Alter Users Table in case it already exists
    await this.pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
    `);

    // 6a. Create Venue Claims Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS venue_claims (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
        status      TEXT NOT NULL DEFAULT 'pending',
        documents   TEXT,
        created_at  TIMESTAMPTZ DEFAULT now(),
        updated_at  TIMESTAMPTZ DEFAULT now(),
        UNIQUE (user_id, venue_id)
      );
    `);

    // 6b. Create Venue Sponsorships Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS venue_sponsorships (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id     UUID REFERENCES venues(id) ON DELETE CASCADE,
        bid_amount   INT NOT NULL DEFAULT 0,
        active_until TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT now()
      );
    `);

    // 6c. Create Highlights Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS highlights (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
        media_url   TEXT NOT NULL,
        media_type  TEXT NOT NULL DEFAULT 'image',
        uploaded_at TIMESTAMPTZ DEFAULT now()
      );
    `);
    await this.pool.query('CREATE INDEX IF NOT EXISTS idx_highlights_venue_time ON highlights (venue_id, uploaded_at DESC);');

    // 7. Create Historical Patterns Table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS historical_patterns (
        venue_id    UUID REFERENCES venues(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        hour        INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
        avg_score   INT NOT NULL,
        PRIMARY KEY (venue_id, day_of_week, hour)
      );
    `);

    // Seed Venues & Curves if empty
    const { rows } = await this.pool.query('SELECT COUNT(*) FROM venues;');
    if (parseInt(rows[0].count, 10) === 0) {
      this.logger.log('Seeding initial mock venues and historical curves...');
      
    }
  }

 
}
