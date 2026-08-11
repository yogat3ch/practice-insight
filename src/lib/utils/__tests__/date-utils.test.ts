/**
 * @fileoverview Unit tests for date/duration parsing and temporal attribution utilities.
 *
 * Test data derived from static/sample.csv (real Insight Timer export).
 */

import {describe, expect, it} from 'vitest';
import {
	formatDuration,
	getSeasonalYear,
	getSeasonForDate,
	getSeasonRange,
	getWeekStart,
	parseDurationToSeconds,
	parseInsightTimerDate,
} from '../date-utils.js';

// ---------------------------------------------------------------------------
// parseInsightTimerDate
// ---------------------------------------------------------------------------

describe('parseInsightTimerDate', () => {
	it('parses 24h zero-padded format from sample CSV', () => {
		const result = parseInsightTimerDate('07/23/2026 12:55:02');
		expect(result).not.toBeNull();
		expect(result?.getFullYear()).toBe(2026);
		expect(result?.getMonth()).toBe(6); // July = 6 (0-indexed)
		expect(result?.getDate()).toBe(23);
		expect(result?.getHours()).toBe(12);
		expect(result?.getMinutes()).toBe(55);
		expect(result?.getSeconds()).toBe(2);
	});

	it('parses early-morning 24h format correctly', () => {
		const result = parseInsightTimerDate('07/23/2026 06:57:47');
		expect(result).not.toBeNull();
		expect(result?.getHours()).toBe(6);
		expect(result?.getMinutes()).toBe(57);
	});

	it('parses midnight edge case (00:00:00)', () => {
		const result = parseInsightTimerDate('12/22/2024 00:00:00');
		expect(result).not.toBeNull();
		expect(result?.getHours()).toBe(0);
		expect(result?.getDate()).toBe(22);
	});

	it('returns null for an empty string', () => {
		expect(parseInsightTimerDate('')).toBeNull();
	});

	it('returns null for a garbage string', () => {
		expect(parseInsightTimerDate('not a date')).toBeNull();
	});

	it('returns null for a partial date', () => {
		expect(parseInsightTimerDate('07/23/2026')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// parseDurationToSeconds
// ---------------------------------------------------------------------------

describe('parseDurationToSeconds', () => {
	it('parses "3:0:27" (3h 0m 27s = 10827s)', () => {
		expect(parseDurationToSeconds('3:0:27')).toBe(10827);
	});

	it('parses "0:20:42" (20m 42s = 1242s)', () => {
		expect(parseDurationToSeconds('0:20:42')).toBe(1242);
	});

	it('parses "0:47:0" (47m = 2820s)', () => {
		expect(parseDurationToSeconds('0:47:0')).toBe(2820);
	});

	it('parses "1:5:53" (1h 5m 53s = 3953s)', () => {
		expect(parseDurationToSeconds('1:5:53')).toBe(3953);
	});

	it('parses "0:0:33" (33 seconds)', () => {
		expect(parseDurationToSeconds('0:0:33')).toBe(33);
	});

	it('parses zero duration "0:0:0"', () => {
		expect(parseDurationToSeconds('0:0:0')).toBe(0);
	});

	it('returns null for an empty string', () => {
		expect(parseDurationToSeconds('')).toBeNull();
	});

	it('returns null for a non-duration string', () => {
		expect(parseDurationToSeconds('45 minutes')).toBeNull();
	});

	it('returns null for a two-part string (mm:ss only)', () => {
		// Spec shows h:m:s; two parts should fail
		expect(parseDurationToSeconds('20:42')).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// getSeasonForDate (§3.3 fixed solar boundaries)
// ---------------------------------------------------------------------------

describe('getSeasonForDate', () => {
	it('Dec 22 is winter (seasonal year start boundary)', () => {
		expect(getSeasonForDate(new Date(2024, 11, 22))).toBe('winter');
	});

	it('Dec 31 is winter', () => {
		expect(getSeasonForDate(new Date(2024, 11, 31))).toBe('winter');
	});

	it('Jan 1 is winter', () => {
		expect(getSeasonForDate(new Date(2025, 0, 1))).toBe('winter');
	});

	it('Mar 19 is winter (last day)', () => {
		expect(getSeasonForDate(new Date(2025, 2, 19))).toBe('winter');
	});

	it('Mar 20 is spring (first day)', () => {
		expect(getSeasonForDate(new Date(2025, 2, 20))).toBe('spring');
	});

	it('Jun 20 is spring (last day)', () => {
		expect(getSeasonForDate(new Date(2025, 5, 20))).toBe('spring');
	});

	it('Jun 21 is summer (first day)', () => {
		expect(getSeasonForDate(new Date(2025, 5, 21))).toBe('summer');
	});

	it('Sep 21 is summer (last day)', () => {
		expect(getSeasonForDate(new Date(2025, 8, 21))).toBe('summer');
	});

	it('Sep 22 is autumn (first day)', () => {
		expect(getSeasonForDate(new Date(2025, 8, 22))).toBe('autumn');
	});

	it('Dec 21 is autumn (last day, end of seasonal year)', () => {
		expect(getSeasonForDate(new Date(2025, 11, 21))).toBe('autumn');
	});
});

// ---------------------------------------------------------------------------
// getSeasonalYear (§3.3 Dec 22 → Dec 21 cycle)
// ---------------------------------------------------------------------------

describe('getSeasonalYear', () => {
	it('Dec 23, 2024 → "2025 Seasonal Year"', () => {
		const sy = getSeasonalYear(new Date(2024, 11, 23));
		expect(sy.label).toBe('2025 Seasonal Year');
	});

	it('Jan 1, 2025 → "2025 Seasonal Year"', () => {
		const sy = getSeasonalYear(new Date(2025, 0, 1));
		expect(sy.label).toBe('2025 Seasonal Year');
	});

	it('Dec 21, 2025 → "2025 Seasonal Year" (last day of cycle)', () => {
		const sy = getSeasonalYear(new Date(2025, 11, 21));
		expect(sy.label).toBe('2025 Seasonal Year');
	});

	it('Dec 22, 2025 → "2026 Seasonal Year" (first day of new cycle)', () => {
		const sy = getSeasonalYear(new Date(2025, 11, 22));
		expect(sy.label).toBe('2026 Seasonal Year');
	});

	it('start date of "2025 Seasonal Year" is Dec 22, 2024', () => {
		const sy = getSeasonalYear(new Date(2025, 0, 1));
		expect(sy.startDate.getFullYear()).toBe(2024);
		expect(sy.startDate.getMonth()).toBe(11);
		expect(sy.startDate.getDate()).toBe(22);
	});

	it('end date of "2025 Seasonal Year" is Dec 21, 2025', () => {
		const sy = getSeasonalYear(new Date(2025, 0, 1));
		expect(sy.endDate.getFullYear()).toBe(2025);
		expect(sy.endDate.getMonth()).toBe(11);
		expect(sy.endDate.getDate()).toBe(21);
	});
});

// ---------------------------------------------------------------------------
// getSeasonRange (§3.3 fixed solar season bounds)
// ---------------------------------------------------------------------------

describe('getSeasonRange', () => {
	it('spring runs Mar 20 – Jun 20', () => {
		const range = getSeasonRange(new Date(2025, 4, 15));
		expect(range.label).toBe('Spring 2025');
		expect(range.startDate.getMonth()).toBe(2);
		expect(range.startDate.getDate()).toBe(20);
		expect(range.endDate.getMonth()).toBe(5);
		expect(range.endDate.getDate()).toBe(20);
	});

	it('summer runs Jun 21 – Sep 21', () => {
		const range = getSeasonRange(new Date(2025, 6, 15));
		expect(range.label).toBe('Summer 2025');
		expect(range.startDate.getMonth()).toBe(5);
		expect(range.startDate.getDate()).toBe(21);
		expect(range.endDate.getMonth()).toBe(8);
		expect(range.endDate.getDate()).toBe(21);
	});

	it('autumn runs Sep 22 – Dec 21', () => {
		const range = getSeasonRange(new Date(2025, 9, 15));
		expect(range.label).toBe('Autumn 2025');
		expect(range.startDate.getMonth()).toBe(8);
		expect(range.startDate.getDate()).toBe(22);
		expect(range.endDate.getMonth()).toBe(11);
		expect(range.endDate.getDate()).toBe(21);
	});

	it('winter spans Dec 22 – Mar 19 across the calendar-year boundary', () => {
		const janRange = getSeasonRange(new Date(2025, 0, 15));
		expect(janRange.label).toBe('Winter 2024–2025');
		expect(janRange.startDate.getFullYear()).toBe(2024);
		expect(janRange.startDate.getMonth()).toBe(11);
		expect(janRange.startDate.getDate()).toBe(22);
		expect(janRange.endDate.getFullYear()).toBe(2025);
		expect(janRange.endDate.getMonth()).toBe(2);
		expect(janRange.endDate.getDate()).toBe(19);

		const decRange = getSeasonRange(new Date(2025, 11, 25));
		expect(decRange.label).toBe('Winter 2025–2026');
		expect(decRange.startDate.getFullYear()).toBe(2025);
		expect(decRange.endDate.getFullYear()).toBe(2026);
	});
});

// ---------------------------------------------------------------------------
// getWeekStart (Monday-anchored per §3.3)
// ---------------------------------------------------------------------------

describe('getWeekStart', () => {
	it('Wednesday Jul 23, 2026 → Monday Jul 20, 2026', () => {
		const result = getWeekStart(new Date(2026, 6, 23));
		expect(result.getFullYear()).toBe(2026);
		expect(result.getMonth()).toBe(6);
		expect(result.getDate()).toBe(20);
	});

	it('Monday returns itself', () => {
		const result = getWeekStart(new Date(2026, 6, 20));
		expect(result.getDate()).toBe(20);
	});

	it('Sunday returns previous Monday', () => {
		// Sunday Jul 19, 2026 → Mon Jul 13, 2026
		const result = getWeekStart(new Date(2026, 6, 19));
		expect(result.getDate()).toBe(13);
	});
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
	it('formats minutes correctly', () => {
		expect(formatDuration(3661, 'minutes')).toBe('61 min');
		expect(formatDuration(2820, 'minutes')).toBe('47 min');
	});

	it('formats hours with minutes', () => {
		expect(formatDuration(3661, 'hours')).toBe('1h 1m');
		expect(formatDuration(3600, 'hours')).toBe('1h');
		expect(formatDuration(60, 'hours')).toBe('1m');
	});

	it('formats sessions with pluralization', () => {
		expect(formatDuration(1, 'sessions')).toBe('1 session');
		expect(formatDuration(3, 'sessions')).toBe('3 sessions');
	});
});
