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
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_id          TEXT UNIQUE NOT NULL,
        reputation_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        report_count     INT NOT NULL DEFAULT 0,
        created_at       TIMESTAMPTZ DEFAULT now()
      );
    `);

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
      await this.seedDatabase();
    }
  }

  private async seedDatabase() {
    const seedVenues = [
      {
        name: 'Velvet Roast Cafe',
        category: 'cafe',
        x: 280,
        y: 190,
        description: 'Artisanal espresso, fresh pastries, and home-roasted beans in a cozy, plant-filled space.',
        address: '402 Spruce Ave',
        capacity: 45,
        google_place_id: 'ChIJ-velvet-roast',
        lambda: 0.05,
        hours: '07:00 AM - 08:00 PM',
        website: 'https://velvetroastcafe.com',
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
        history: [5, 5, 5, 5, 10, 25, 55, 75, 80, 70, 60, 65, 75, 70, 50, 45, 50, 40, 30, 20, 15, 10, 5, 5]
      },
      {
        name: 'Pulse Fitness Gym',
        category: 'gym',
        x: 180,
        y: 350,
        description: 'Sleek modern gym with cardio decks, Olympic lifting platforms, and dynamic HIIT classes.',
        address: '110 Broad Street',
        capacity: 120,
        google_place_id: 'ChIJ-pulse-fitness',
        lambda: 0.012,
        hours: '05:00 AM - 11:00 PM',
        website: 'https://pulsefitness.com',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
        history: [5, 5, 5, 15, 45, 75, 80, 60, 40, 30, 35, 40, 45, 40, 35, 50, 75, 85, 80, 55, 30, 15, 5, 5]
      },
      {
        name: 'Summit Green Park',
        category: 'park',
        x: 520,
        y: 220,
        description: 'Spacious community park featuring walking trails, a dog park, and a scenic central pond.',
        address: '800 Parkside Blvd',
        capacity: 500,
        google_place_id: 'ChIJ-summit-green',
        lambda: 0.008,
        hours: '06:00 AM - 10:00 PM',
        website: 'https://cityparks.gov/summit-green',
        image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
        history: [0, 0, 0, 0, 0, 10, 20, 30, 35, 40, 45, 55, 60, 58, 50, 48, 55, 50, 35, 20, 10, 5, 0, 0]
      },
      {
        name: 'Neon Rhythm Club',
        category: 'nightclub',
        x: 290,
        y: 420,
        description: 'Electrifying underground nightclub featuring state-of-the-art surround sound, laser shows, and guest DJs.',
        address: '205 Commercial Way',
        capacity: 250,
        google_place_id: 'ChIJ-neon-rhythm',
        lambda: 0.015,
        hours: '09:00 PM - 04:00 AM',
        website: 'https://neonrhythm.club',
        image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
        history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 30, 50, 75, 95, 90, 80, 50]
      },
      {
        name: 'The Daily Grind',
        category: 'cafe',
        x: 450,
        y: 480,
        description: 'Popular student cafe with high-speed internet, study booths, and endless filter coffee refills.',
        address: '88 University Dr',
        capacity: 60,
        google_place_id: 'ChIJ-daily-grind',
        lambda: 0.05,
        hours: '06:30 AM - 11:00 PM',
        website: 'https://dailygrind.edu',
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
        history: [5, 5, 5, 5, 10, 15, 35, 55, 65, 75, 80, 85, 90, 85, 70, 65, 60, 50, 35, 20, 15, 10, 5, 5]
      },
      {
        name: 'Gusto Bistro & Trattoria',
        category: 'restaurant',
        x: 620,
        y: 380,
        description: 'Charming modern Italian ristorante specializing in seasonal farm-to-table cuisine and curated wines.',
        address: '15 Design District',
        capacity: 80,
        google_place_id: 'ChIJ-gusto-bistro',
        lambda: 0.02,
        hours: '12:00 PM - 11:00 PM',
        website: 'https://gustobistro.com',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
        history: [0, 0, 0, 0, 0, 0, 0, 5, 15, 25, 45, 75, 80, 60, 45, 40, 55, 80, 90, 85, 60, 30, 10, 0]
      },
      {
        name: 'Eclipse Rooftop Lounge',
        category: 'nightclub',
        x: 680,
        y: 150,
        description: 'Sleek neon rooftop lounge offering signature cocktails, deep house sets, and skyline panoramic views.',
        address: '33 Industrial Ave',
        capacity: 150,
        google_place_id: 'ChIJ-eclipse-lounge',
        lambda: 0.012,
        hours: '10:00 PM - 05:00 AM',
        website: 'https://eclipselounge.club',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
        history: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 35, 55, 80, 95, 90, 85, 60]
      },
      {
        name: 'La Bella Italia',
        category: 'restaurant',
        x: 120,
        y: 140,
        description: 'Cozy authentic family restaurant serving classic wood-fired pizzas, fresh pastas, and local gelato.',
        address: '10 Canal Road',
        capacity: 90,
        google_place_id: 'ChIJ-la-bella-italia',
        lambda: 0.02,
        hours: '11:30 AM - 10:00 PM',
        website: 'https://labellaitalia.com',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        history: [0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 50, 75, 80, 65, 45, 40, 50, 75, 85, 80, 60, 35, 15, 5]
      }
    ];

    for (const v of seedVenues) {
      // Coordinate conversions (from SVG 800x600 grid to WGS84 coordinates)
      const lon = -74.0060 + v.x * 0.000017828;
      const lat = 40.7128 - v.y * 0.000013513;

      const res = await this.pool.query(`
        INSERT INTO venues 
          (name, category, location, capacity, google_place_id, address, description, hours, website, image, lambda)
        VALUES 
          ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id;
      `, [v.name, v.category, lon, lat, v.capacity, v.google_place_id, v.address, v.description, v.hours, v.website, v.image, v.lambda]);

      const venueId = res.rows[0].id;

      // Seed historical patterns for 7 days (0=Mon to 6=Sun)
      for (let day = 0; day <= 6; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const avgScore = v.history[hour];
          await this.pool.query(`
            INSERT INTO historical_patterns (venue_id, day_of_week, hour, avg_score)
            VALUES ($1, $2, $3, $4);
          `, [venueId, day, hour, avgScore]);
        }
      }

      // Seed initial crowd score based on hour 12 (Noon)
      const initialScore = v.history[12];
      let label = 'Moderate';
      if (initialScore <= 20) label = 'Empty';
      else if (initialScore <= 40) label = 'Quiet';
      else if (initialScore <= 80) label = 'Busy';
      else if (initialScore > 80) label = 'Packed';

      await this.pool.query(`
        INSERT INTO crowd_scores (venue_id, current_score, label)
        VALUES ($1, $2, $3);
      `, [venueId, initialScore, label]);
    }
  }
}
