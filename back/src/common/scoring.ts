/**
 * Crowd score calculation (see algorithm.md).
 *
 * Each report gets a weight = reputation × e^(−λ·Δt).
 * The user score is the weighted AVERAGE of the report scores, so decay and
 * reputation change how much a report counts, never the value it reported.
 * (Before: score × decay × reputation, which pulled every venue toward 0 —
 * a fresh "Busy 70" from a new user counted as 35.)
 *
 * The user share w2 is 0.45 (0.65 with 3+ reports in the last hour) and is
 * scaled down as reports age, so stale reports fade back to the baseline.
 */
export interface ScoringReport {
  score: number;
  createdAt: Date;
  reputation?: number | null;
}

export interface CrowdScoreResult {
  score: number;
  userScore: number | null;
  userShare: number;
  usedReports: number;
}

export const DECAY_WINDOW_MINUTES = 240;
const DEFAULT_REPUTATION = 0.5;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function computeCrowdScore(
  baseline: number,
  reports: ScoringReport[],
  lambda: number,
  now: Date = new Date(),
): CrowdScoreResult {
  const base = clamp(Number.isFinite(baseline) ? baseline : 50, 0, 100);
  let weightedSum = 0;
  let weightTotal = 0;
  let freshness = 0;
  let lastHour = 0;
  let used = 0;

  for (const r of reports) {
    const deltaMinutes = (now.getTime() - r.createdAt.getTime()) / 60000;
    if (deltaMinutes < 0 || deltaMinutes > DECAY_WINDOW_MINUTES) continue;
    const decay = Math.exp(-lambda * deltaMinutes);
    const reputation = clamp(r.reputation ?? DEFAULT_REPUTATION, 0.1, 2.0);
    const weight = decay * reputation;
    weightedSum += r.score * weight;
    weightTotal += weight;
    freshness += decay;
    used++;
    if (deltaMinutes <= 60) lastHour++;
  }

  if (used === 0 || weightTotal === 0) {
    return {
      score: Math.round(base),
      userScore: null,
      userShare: 0,
      usedReports: 0,
    };
  }

  const userScore = weightedSum / weightTotal;
  const maxShare = lastHour >= 3 ? 0.65 : 0.45;
  const userShare = maxShare * Math.min(1, freshness);
  const raw = (1 - userShare) * base + userShare * userScore;

  return {
    score: Math.round(clamp(raw, 0, 100)),
    userScore,
    userShare,
    usedReports: used,
  };
}

export function classifyScore(score: number) {
  if (score <= 20) return { label: 'Empty', color: '#10B981' };
  if (score <= 40) return { label: 'Quiet', color: '#34D399' };
  if (score <= 60) return { label: 'Moderate', color: '#F59E0B' };
  if (score <= 80) return { label: 'Busy', color: '#EF6C00' };
  return { label: 'Packed', color: '#EF4444' };
}
