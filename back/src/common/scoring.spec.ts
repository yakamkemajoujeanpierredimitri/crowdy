import { computeCrowdScore, classifyScore } from './scoring';

const now = new Date('2026-11-05T16:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000);

describe('computeCrowdScore', () => {
  it('returns the baseline when there are no reports', () => {
    expect(computeCrowdScore(50, [], 0.05, now).score).toBe(50);
  });

  it('a fresh "Busy" report from a new user raises the score above the baseline', () => {
    const r = computeCrowdScore(
      50,
      [{ score: 70, createdAt: now, reputation: 0.5 }],
      0.05,
      now,
    );
    // 0.55 * 50 + 0.45 * 70 = 59
    expect(r.score).toBe(59);
    expect(r.userScore).toBe(70);
  });

  it('three fresh reports use the boosted 0.65 user share', () => {
    const reports = [0, 5, 10].map((m) => ({
      score: 70,
      createdAt: minutesAgo(m),
      reputation: 0.5,
    }));
    const r = computeCrowdScore(50, reports, 0.05, now);
    expect(r.score).toBeGreaterThan(59);
    expect(r.score).toBeLessThanOrEqual(63);
  });

  it('reputation changes the weight, not the reported value', () => {
    const reports = [
      { score: 90, createdAt: now, reputation: 2.0 },
      { score: 10, createdAt: now, reputation: 0.5 },
    ];
    const r = computeCrowdScore(50, reports, 0.05, now);
    // weighted average = (90*2 + 10*0.5) / 2.5 = 74
    expect(r.userScore).toBeCloseTo(74, 5);
  });

  it('old reports fade back to the baseline', () => {
    const r = computeCrowdScore(
      50,
      [{ score: 100, createdAt: minutesAgo(120), reputation: 1 }],
      0.05,
      now,
    );
    expect(r.score).toBe(50);
  });

  it('ignores reports outside the 4h window or in the future', () => {
    const r = computeCrowdScore(
      40,
      [
        { score: 100, createdAt: minutesAgo(300) },
        { score: 100, createdAt: minutesAgo(-10) },
      ],
      0.008,
      now,
    );
    expect(r.usedReports).toBe(0);
    expect(r.score).toBe(40);
  });
});

describe('classifyScore', () => {
  it.each([
    [0, 'Empty'],
    [20, 'Empty'],
    [21, 'Quiet'],
    [60, 'Moderate'],
    [80, 'Busy'],
    [81, 'Packed'],
  ])('%i -> %s', (score, label) => {
    expect(classifyScore(score).label).toBe(label);
  });
});
