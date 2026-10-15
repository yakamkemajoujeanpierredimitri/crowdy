export function classifyScore(score) {
  const s = typeof score === 'number' && !isNaN(score) ? score : 0;
  if (s <= 20) return { label: 'Empty', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' };
  if (s <= 40) return { label: 'Quiet', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' };
  if (s <= 60) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' };
  if (s <= 80) return { label: 'Busy', color: '#EF6C00', bg: 'rgba(239, 108, 0, 0.1)', border: 'rgba(239, 108, 0, 0.3)' };
  return { label: 'Packed', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
}

// Z-Score Anomaly check
export function checkAnomaly(newScore, recentReports) {
  if (recentReports.length < 5) return { result: 'accept', zScore: 0 };
  
  const scores = recentReports.map(r => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) {
    const diff = Math.abs(newScore - mean);
    if (diff > 35) return { result: 'discard', zScore: 9.9 };
    return { result: 'accept', zScore: 0 };
  }
  
  const z = Math.abs((newScore - mean) / stdDev);
  
  if (z > 3.5) return { result: 'discard', zScore: Number(z.toFixed(2)) };
  if (z > 2.5) return { result: 'flag', zScore: Number(z.toFixed(2)) };
  return { result: 'accept', zScore: Number(z.toFixed(2)) };
}

export function getDistance(vX, vY, uX, uY) {
  const x1 = typeof vX === 'number' && !isNaN(vX) ? vX : 0;
  const y1 = typeof vY === 'number' && !isNaN(vY) ? vY : 0;
  const x2 = typeof uX === 'number' && !isNaN(uX) ? uX : 0;
  const y2 = typeof uY === 'number' && !isNaN(uY) ? uY : 0;
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 1.5);
}

export function getCategoryLabel(cat) {
  switch (cat) {
    case 'cafe': return 'Caffe';
    case 'restaurant': return 'Ristorante';
    case 'nightclub': return 'Nightclub';
    default: return cat.charAt(0).toUpperCase() + cat.slice(1);
  }
}

export const reportOptions = [
  { label: 'Empty', value: 10, color: '#10B981' },
  { label: 'Quiet', value: 30, color: '#34D399' },
  { label: 'Moderate', value: 50, color: '#F59E0B' },
  { label: 'Busy', value: 70, color: '#EF6C00' },
  { label: 'Packed', value: 90, color: '#EF4444' }
];

// --- Backend Validation Matching Rules ---

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const USERNAME_REGEX = /^[a-zA-Z0-9_\-\.]{3,30}$/;

export function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Validates a street name or address before passing to backend or filtering
 * @param {string} address
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address or street name is required.' };
  }
  const trimmed = address.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Address must be at least 3 characters long.' };
  }
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Address cannot exceed 200 characters.' };
  }
  // Check for minimum meaningful alphanumeric content (not just punctuation)
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Address must contain alphanumeric characters.' };
  }
  return { isValid: true };
}

/**
 * Validates a report payload before submitting to backend POST /reports
 * Backend DTO: venueId (UUID), score (int 0-100), userId (string), sourceType (optional string)
 */
export function validateReport({ venueId, score, userId, isLiveBackend = false }) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { isValid: false, error: 'Invalid user identity. Please set a username in your profile.' };
  }
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
    return { isValid: false, error: 'Reported crowd score must be an integer between 0 and 100.' };
  }
  if (!venueId || typeof venueId !== 'string' || venueId.trim().length === 0) {
    return { isValid: false, error: 'Venue ID is missing.' };
  }
  if (isLiveBackend && !isValidUUID(venueId)) {
    return { isValid: false, error: `Invalid Venue ID format: "${venueId}" is not a valid UUID.` };
  }
  return { isValid: true };
}

/**
 * Validates business venue claim parameters before POST /claims
 */
export function validateClaim({ venueId, documents, userId, isLiveBackend = false }) {
  if (!venueId || typeof venueId !== 'string' || venueId.trim().length === 0) {
    return { isValid: false, error: 'Please select a valid venue or enter a venue ID.' };
  }
  if (isLiveBackend && !isValidUUID(venueId)) {
    return { isValid: false, error: 'Venue ID must be a valid UUID for live submission.' };
  }
  if (!documents || typeof documents !== 'string' || documents.trim().length < 10) {
    return { isValid: false, error: 'Verification documents or description must be at least 10 characters.' };
  }
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { isValid: false, error: 'User ID is required to claim a venue.' };
  }
  return { isValid: true };
}

/**
 * Validates reporter username
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required.' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters.' };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters.' };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Only letters, numbers, hyphens, dots, and underscores allowed.' };
  }
  return { isValid: true };
}

/**
 * Projects real GPS coordinates (lat, lon) anywhere in the world to the 800x600 SVG grid.
 * Dynamically computes bounding box and scales smoothly regardless of city or sector.
 */
export function projectVenuesToGrid(venues) {
  if (!venues || !Array.isArray(venues) || venues.length === 0) return [];

  const hasGps = venues.some(v => typeof v.lat === 'number' && typeof v.lon === 'number');
  if (!hasGps) return venues;

  const validGpsVenues = venues.filter(v => typeof v.lat === 'number' && typeof v.lon === 'number');
  if (validGpsVenues.length === 0) return venues;

  const lats = validGpsVenues.map(v => v.lat);
  const lons = validGpsVenues.map(v => v.lon);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Adaptive scale to fit comfortably on 800x600 screen
  const spanLat = Math.max(0.0035, (maxLat - minLat) * 1.3);
  const spanLon = Math.max(0.0055, (maxLon - minLon) * 1.3);

  const scaleX = 640 / spanLon;
  const scaleY = 440 / spanLat;

  return venues.map(v => {
    if (typeof v.lat !== 'number' || typeof v.lon !== 'number') {
      return v;
    }
    const rawX = 400 + Math.round((v.lon - centerLon) * scaleX);
    const rawY = 300 - Math.round((v.lat - centerLat) * scaleY);

    // Keep clamped inside viewport margins
    const clampedX = Math.min(740, Math.max(60, rawX));
    const clampedY = Math.min(540, Math.max(60, rawY));

    return {
      ...v,
      x: clampedX,
      y: clampedY,
      activeReports: v.activeReports || []
    };
  });
}

/**
 * Extracts distinct street names and common city/sector name from venue addresses
 */
export function extractAreaDetails(venues) {
  if (!venues || venues.length === 0) {
    return { sector: 'Downtown', streets: ['Broadway St', 'Spruce Ave', 'Parkside Blvd', 'University Dr'] };
  }

  const streets = [];
  let sector = '';

  for (const v of venues) {
    if (v.address) {
      const parts = v.address.split(',').map(s => s.trim());
      if (parts[0] && !streets.includes(parts[0])) {
        // Strip house number to get street name
        const streetOnly = parts[0].replace(/^[0-9\-\/]+\s*/, '');
        if (streetOnly && !streets.includes(streetOnly)) {
          streets.push(streetOnly);
        }
      }
      if (parts[1] && !sector) {
        sector = parts[1];
      }
    }
  }

  return {
    sector: sector || 'Active Sector',
    streets: streets.length >= 2 ? streets.slice(0, 6) : ['Main St', 'Central Ave', 'Market St', 'Park Road']
  };
}


