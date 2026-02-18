/**
 * Calendar date range constants and utilities.
 *
 * Defines the selectable date range: past 3 months ~ future 3 months from today.
 */

export const CALENDAR_PAST_MONTHS = 3;
export const CALENDAR_FUTURE_MONTHS = 3;

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the allowable min/max date strings (YYYY-MM-DD).
 * minDate: first day of the month 3 months ago
 * maxDate: last day of the month 3 months ahead
 */
export function getCalendarDateRange(): { minDate: string; maxDate: string } {
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth() - CALENDAR_PAST_MONTHS, 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + CALENDAR_FUTURE_MONTHS + 1, 0);
  return {
    minDate: toDateString(minDate),
    maxDate: toDateString(maxDate),
  };
}
