export function classifyScore(score) {
  if (score <= 20) return { label: 'Empty', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)' };
  if (score <= 40) return { label: 'Quiet', color: '#34D399', bg: 'rgba(52, 211, 153, 0.1)', border: 'rgba(52, 211, 153, 0.3)' };
  if (score <= 60) return { label: 'Moderate', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' };
  if (score <= 80) return { label: 'Busy', color: '#EF6C00', bg: 'rgba(239, 108, 0, 0.1)', border: 'rgba(239, 108, 0, 0.3)' };
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
  const dx = vX - uX;
  const dy = vY - uY;
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
