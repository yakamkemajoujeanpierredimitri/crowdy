// Central place for environment-dependent settings.
// Set these in .env.local (and in Vercel's project settings for production).

export const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Demo area (Paris, Saint-Michel). Used as the map centre and for /venues/nearby.
export const DEFAULT_CENTER = { lat: 48.8534, lon: 2.3488 };

// Where the draggable "YOU" pin starts.
export const DEFAULT_USER_LOCATION = { lat: 48.853559, lon: 2.348628 };

export const NEARBY_RADIUS_M = 2000;

// Reports from further away than this get the "remote" penalty.
export const ON_SITE_RADIUS_M = 250;
