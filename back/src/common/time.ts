const WEEKDAY_TO_DOW: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

/**
 * Day of week (0 = Monday … 6 = Sunday, matching historical_patterns.day_of_week)
 * and hour (0–23) in the venues' local timezone, not the server's clock.
 * Set APP_TIMEZONE to change it (defaults to Europe/Paris).
 */
export function getLocalDowHour(
  date: Date = new Date(),
  timeZone: string = process.env.APP_TIMEZONE || 'Europe/Paris',
): { dow: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  return { dow: WEEKDAY_TO_DOW[weekday] ?? 0, hour: hour % 24 };
}
