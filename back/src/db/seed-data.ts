/**
 * Demo venues (Paris, around Saint-Michel) inserted when the venues table is empty.
 * Same venues as the frontend sandbox (fronte/src/data/venues.js).
 * `history` = typical crowd score for each hour 0–23, used for every weekday.
 */
export interface SeedVenue {
  name: string;
  category: string;
  lat: number;
  lon: number;
  description: string;
  address: string;
  capacity: number;
  google_place_id: string;
  lambda: number;
  hours: string;
  website: string;
  image: string;
  history: number[];
}

export const SEED_VENUES: SeedVenue[] = [
  {
    name: 'Velvet Roast Cafe',
    category: 'cafe',
    lat: 48.854275,
    lon: 2.34777,
    description:
      'Artisanal espresso, fresh pastries, and home-roasted beans in a cozy, plant-filled space. Popular with remote workers.',
    address: '402 Spruce Ave, Paris',
    capacity: 45,
    google_place_id: 'seed:velvet-roast',
    lambda: 0.05,
    hours: '07:00 AM - 08:00 PM',
    website: 'https://velvetroastcafe.com',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
    history: [
      5, 5, 5, 5, 10, 25, 55, 75, 80, 70, 60, 65, 75, 70, 50, 45, 50, 40, 30,
      20, 15, 10, 5, 5,
    ],
  },
  {
    name: 'Pulse Fitness Gym',
    category: 'gym',
    lat: 48.852673,
    lon: 2.346911,
    description:
      'Sleek modern gym with cardio decks, Olympic lifting platforms, and dynamic HIIT classes.',
    address: '110 Broad Street, Paris',
    capacity: 120,
    google_place_id: 'seed:pulse-fitness',
    lambda: 0.012,
    hours: '05:00 AM - 11:00 PM',
    website: 'https://pulsefitness.com',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    history: [
      5, 5, 5, 15, 45, 75, 80, 60, 40, 30, 35, 40, 45, 40, 35, 50, 75, 85, 80,
      55, 30, 15, 5, 5,
    ],
  },
  {
    name: 'Summit Green Park',
    category: 'park',
    lat: 48.853922,
    lon: 2.350313,
    description:
      'Spacious community park featuring walking trails, a dog park, and a scenic central pond.',
    address: '800 Parkside Blvd, Paris',
    capacity: 500,
    google_place_id: 'seed:summit-green',
    lambda: 0.008,
    hours: '06:00 AM - 10:00 PM',
    website: 'https://cityparks.gov/summit-green',
    image:
      'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=600&q=80',
    history: [
      0, 0, 0, 0, 0, 10, 20, 30, 35, 40, 45, 55, 60, 58, 50, 48, 55, 50, 35, 20,
      10, 5, 0, 0,
    ],
  },
  {
    name: 'Neon Rhythm Club',
    category: 'nightclub',
    lat: 48.852116,
    lon: 2.347856,
    description:
      'Electrifying underground nightclub featuring state-of-the-art surround sound, laser shows, and guest DJs.',
    address: '205 Commercial Way, Paris',
    capacity: 250,
    google_place_id: 'seed:neon-rhythm',
    lambda: 0.015,
    hours: '09:00 PM - 04:00 AM',
    website: 'https://neonrhythm.club',
    image:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=600&q=80',
    history: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 30, 50, 75, 95, 90,
      80, 50,
    ],
  },
  {
    name: 'The Daily Grind',
    category: 'cafe',
    lat: 48.851634,
    lon: 2.349713,
    description:
      'Popular student cafe with high-speed internet, study booths, and endless filter coffee refills.',
    address: '88 University Dr, Paris',
    capacity: 60,
    google_place_id: 'seed:daily-grind',
    lambda: 0.05,
    hours: '06:30 AM - 11:00 PM',
    website: 'https://dailygrind.edu',
    image:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    history: [
      5, 5, 5, 5, 10, 15, 35, 55, 65, 75, 80, 85, 90, 85, 70, 65, 60, 50, 35,
      20, 15, 10, 5, 5,
    ],
  },
  {
    name: 'Gusto Bistro & Trattoria',
    category: 'restaurant',
    lat: 48.852435,
    lon: 2.35117,
    description:
      'Charming modern Italian ristorante specializing in seasonal farm-to-table cuisine and curated wines.',
    address: '15 Design District, Paris',
    capacity: 80,
    google_place_id: 'seed:gusto-bistro',
    lambda: 0.02,
    hours: '12:00 PM - 11:00 PM',
    website: 'https://gustobistro.com',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    history: [
      0, 0, 0, 0, 0, 0, 0, 5, 15, 25, 45, 75, 80, 60, 45, 40, 55, 80, 90, 85,
      60, 30, 10, 0,
    ],
  },
  {
    name: 'Eclipse Rooftop Lounge',
    category: 'nightclub',
    lat: 48.854593,
    lon: 2.351685,
    description:
      'Sleek neon rooftop lounge offering signature cocktails, deep house sets, and skyline panoramic views.',
    address: '33 Industrial Ave, Paris',
    capacity: 150,
    google_place_id: 'seed:eclipse-lounge',
    lambda: 0.012,
    hours: '10:00 PM - 05:00 AM',
    website: 'https://eclipselounge.club',
    image:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    history: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 35, 55, 80, 95, 90,
      85, 60,
    ],
  },
  {
    name: 'La Bella Italia',
    category: 'restaurant',
    lat: 48.854673,
    lon: 2.346395,
    description:
      'Cozy authentic family restaurant serving classic wood-fired pizzas, fresh pastas, and local gelato.',
    address: '10 Canal Road, Paris',
    capacity: 90,
    google_place_id: 'seed:la-bella-italia',
    lambda: 0.02,
    hours: '11:30 AM - 10:00 PM',
    website: 'https://labellaitalia.com',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    history: [
      0, 0, 0, 0, 0, 0, 0, 10, 20, 30, 50, 75, 80, 65, 45, 40, 50, 75, 85, 80,
      60, 35, 15, 5,
    ],
  },
];
