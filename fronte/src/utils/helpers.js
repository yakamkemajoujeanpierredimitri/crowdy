const NO_DATA = { label: 'No data', color: '#737373', bg: 'rgba(115, 115, 115, 0.1)', border: 'rgba(115, 115, 115, 0.3)' };

export function classifyScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return NO_DATA;
  const s = score;
  if (s <= 20) return { label: 'Empty', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' };
  if (s <= 40) return { label: 'Quiet', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' };
  if (s <= 60) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' };
  if (s <= 80) return { label: 'Busy', color: '#EF6C00', bg: 'rgba(239, 108, 0, 0.1)', border: 'rgba(239, 108, 0, 0.3)' };
  return { label: 'Packed', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' };
}

/**
 * Crowd score — same formula as the backend (back/src/common/scoring.ts).
 * Each report's weight = reputation × e^(−λ·Δt); the user score is the weighted
 * AVERAGE of what people reported, so decay/reputation never change the value itself.
 * The user share (0.45, or 0.65 with 3+ reports in the last hour) shrinks as reports age.
 * @param {number} baseline
 * @param {{score:number, createdAt:Date, reputation?:number}[]} reports
 * @param {number} lambda
 * @param {Date} now
 */
export function computeCrowdScore(baseline, reports, lambda, now = new Date()) {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const base = clamp(Number.isFinite(baseline) ? baseline : 50, 0, 100);
  let weightedSum = 0;
  let weightTotal = 0;
  let freshness = 0;
  let lastHour = 0;
  let used = 0;

  for (const r of reports) {
    const deltaMinutes = (now.getTime() - r.createdAt.getTime()) / 60000;
    if (deltaMinutes < 0 || deltaMinutes > 240) continue;
    const decay = Math.exp(-lambda * deltaMinutes);
    const weight = decay * clamp(r.reputation ?? 0.5, 0.1, 2.0);
    weightedSum += r.score * weight;
    weightTotal += weight;
    freshness += decay;
    used++;
    if (deltaMinutes <= 60) lastHour++;
  }

  if (used === 0 || weightTotal === 0) return { score: Math.round(base), usedReports: 0 };

  const userScore = weightedSum / weightTotal;
  const userShare = (lastHour >= 3 ? 0.65 : 0.45) * Math.min(1, freshness);
  const raw = (1 - userShare) * base + userShare * userScore;
  return { score: Math.round(clamp(raw, 0, 100)), usedReports: used };
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

/** Distance in metres between two GPS points (haversine). */
export function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function getCategoryLabel(cat) {
  switch (cat) {
    case 'cafe': return 'Cafe';
    case 'restaurant': return 'Restaurant';
    case 'nightclub': return 'Nightclub';
    default: return cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Venue';
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

/** Nest validation errors return `message` as an array — turn any error body into one sentence. */
export function errorMessage(body, fallback = 'Request failed.') {
  const m = body && body.message;
  if (Array.isArray(m)) return m.join('. ');
  if (typeof m === 'string' && m) return m;
  return fallback;
}
