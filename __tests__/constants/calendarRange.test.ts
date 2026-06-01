/**
 * Unit tests for getCalendarDateRange() in constants/calendarRange.ts
 */

import {
  getCalendarDateRange,
  CALENDAR_PAST_MONTHS,
  CALENDAR_FUTURE_MONTHS,
} from '../../constants/calendarRange';

// ============================================
// Helpers
// ============================================

/** Parse a YYYY-MM-DD string to a Date at local midnight. */
function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date to YYYY-MM-DD. */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ============================================
// Constants
// ============================================

describe('calendar range constants', () => {
  it('CALENDAR_PAST_MONTHS is 3', () => {
    expect(CALENDAR_PAST_MONTHS).toBe(3);
  });

  it('CALENDAR_FUTURE_MONTHS is 3', () => {
    expect(CALENDAR_FUTURE_MONTHS).toBe(3);
  });
});

// ============================================
// getCalendarDateRange
// ============================================

describe('getCalendarDateRange', () => {
  it('returns an object with minDate and maxDate strings', () => {
    const range = getCalendarDateRange();
    expect(typeof range.minDate).toBe('string');
    expect(typeof range.maxDate).toBe('string');
  });

  it('minDate and maxDate match the YYYY-MM-DD format', () => {
    const { minDate, maxDate } = getCalendarDateRange();
    expect(minDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(maxDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('minDate is strictly before maxDate', () => {
    const { minDate, maxDate } = getCalendarDateRange();
    expect(parseDate(minDate).getTime()).toBeLessThan(parseDate(maxDate).getTime());
  });

  it('minDate is the first day of the month 3 months ago', () => {
    const today = new Date();
    const expectedMin = new Date(today.getFullYear(), today.getMonth() - CALENDAR_PAST_MONTHS, 1);
    const { minDate } = getCalendarDateRange();
    expect(minDate).toBe(formatDate(expectedMin));
  });

  it('maxDate is the last day of the month 3 months ahead', () => {
    const today = new Date();
    // Last day of (current month + CALENDAR_FUTURE_MONTHS) = day 0 of the next month
    const expectedMax = new Date(
      today.getFullYear(),
      today.getMonth() + CALENDAR_FUTURE_MONTHS + 1,
      0,
    );
    const { maxDate } = getCalendarDateRange();
    expect(maxDate).toBe(formatDate(expectedMax));
  });

  it('minDate day is always 01 (first of month)', () => {
    const { minDate } = getCalendarDateRange();
    expect(minDate.endsWith('-01')).toBe(true);
  });

  it('maxDate spans at least 6 months from minDate', () => {
    const { minDate, maxDate } = getCalendarDateRange();
    const minMs = parseDate(minDate).getTime();
    const maxMs = parseDate(maxDate).getTime();
    const sixMonthsMs = 6 * 28 * 24 * 60 * 60 * 1000; // conservative lower bound
    expect(maxMs - minMs).toBeGreaterThanOrEqual(sixMonthsMs);
  });

  it('returns a new object on each call (no shared reference)', () => {
    const range1 = getCalendarDateRange();
    const range2 = getCalendarDateRange();
    expect(range1).not.toBe(range2);
    expect(range1).toEqual(range2);
  });
});
