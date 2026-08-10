/**
 * @fileoverview Pure date/duration parsing and temporal attribution utilities.
 *
 * All functions are side-effect free. Temporal attribution follows §3.3 of the
 * Practice Insight App Specification: sessions are attributed 100% to their
 * "Started At" timestamp regardless of duration span.
 */

import {
	parse,
	startOfWeek,
	isValid,
	getMonth,
	getDate,
	getYear,
	addYears,
	subYears,
	setMonth,
	setDate
} from 'date-fns';
import type { Season, Unit } from '../types/filters.js';
import type { SeasonalYear } from '../types/temporal.js';

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

/**
 * Parses an Insight Timer "Started At" timestamp string into a Date.
 *
 * Accepts two known export formats:
 *   - 24-hour (actual export): "MM/dd/yyyy HH:mm:ss"  e.g. "07/23/2026 12:55:02"
 *   - AM/PM (spec description): "M/d/yyyy h:mm:ss a"  e.g. "7/23/2026 12:55:02 PM"
 *
 * @param raw - Raw "Started At" string from the CSV row.
 * @returns Parsed Date, or null if the string is unparseable.
 */
export function parseInsightTimerDate(raw: string): Date | null {
	if (!raw || typeof raw !== 'string') return null;

	const trimmed = raw.trim();

	// Try 24-hour format first (the real export format observed in sample data)
	const date24h = parse(trimmed, 'MM/dd/yyyy HH:mm:ss', new Date());
	if (isValid(date24h)) return date24h;

	// Try non-zero-padded 24-hour variant
	const date24hNp = parse(trimmed, 'M/d/yyyy H:mm:ss', new Date());
	if (isValid(date24hNp)) return date24hNp;

	// Try AM/PM format (spec description, for future-proofing)
	const dateAmPm = parse(trimmed, 'M/d/yyyy h:mm:ss a', new Date());
	if (isValid(dateAmPm)) return dateAmPm;

	return null;
}

// ---------------------------------------------------------------------------
// Duration parsing
// ---------------------------------------------------------------------------

/**
 * Parses an Insight Timer "Duration" string into total seconds.
 *
 * Handles non-zero-padded h:m:s format: "3:0:27", "0:47:0", "1:5:53".
 * Also handles zero-padded h:mm:ss for robustness.
 *
 * @param raw - Raw "Duration" string from the CSV row.
 * @returns Total duration in seconds, or null if unparseable.
 */
export function parseDurationToSeconds(raw: string): number | null {
	if (!raw || typeof raw !== 'string') return null;

	const trimmed = raw.trim();
	const parts = trimmed.split(':');

	if (parts.length !== 3) return null;

	const [h, m, s] = parts.map(Number);

	if ([h, m, s].some(isNaN)) return null;
	if (m < 0 || m > 59 || s < 0 || s > 59) return null;
	if (h < 0) return null;

	return h * 3600 + m * 60 + s;
}

// ---------------------------------------------------------------------------
// Seasonal attribution (§3.3)
// ---------------------------------------------------------------------------

/**
 * Fixed solar season boundaries per §3.3.
 * Winter:  Dec 22 – Mar 19
 * Spring:  Mar 20 – Jun 20
 * Summer:  Jun 21 – Sep 21
 * Autumn:  Sep 22 – Dec 21
 */
export function getSeasonForDate(date: Date): Season {
	const month = getMonth(date); // 0-indexed
	const day = getDate(date);

	// Winter: Dec 22 – end of year
	if (month === 11 && day >= 22) return 'winter';
	// Winter: Jan – Mar 19
	if (month < 2) return 'winter';
	if (month === 2 && day <= 19) return 'winter';
	// Spring: Mar 20 – Jun 20
	if (month === 2 && day >= 20) return 'spring';
	if (month === 3 || month === 4) return 'spring';
	if (month === 5 && day <= 20) return 'spring';
	// Summer: Jun 21 – Sep 21
	if (month === 5 && day >= 21) return 'summer';
	if (month === 6 || month === 7) return 'summer';
	if (month === 8 && day <= 21) return 'summer';
	// Autumn: Sep 22 – Dec 21
	return 'autumn';
}

/**
 * Computes the seasonal year cycle (Dec 22 → Dec 21) that contains `date`.
 * The cycle is labeled by its ending calendar year per §3.3.
 * E.g. Dec 23, 2024 → Dec 21, 2025 = "2025 Seasonal Year".
 *
 * @param date - Any date to classify.
 * @returns The SeasonalYear object containing that date.
 */
export function getSeasonalYear(date: Date): SeasonalYear {
	const month = getMonth(date); // 0-indexed
	const day = getDate(date);
	const year = getYear(date);

	// If Dec 22 or later, the cycle ends next year
	const endYear = month === 11 && day >= 22 ? year + 1 : year;
	const startYear = endYear - 1;

	const startDate = setDate(setMonth(new Date(startYear, 0, 1), 11), 22); // Dec 22, startYear
	const endDate = setDate(setMonth(new Date(endYear, 0, 1), 11), 21); // Dec 21, endYear

	return {
		label: `${endYear} Seasonal Year`,
		season: getSeasonForDate(date),
		startDate,
		endDate
	};
}

// ---------------------------------------------------------------------------
// Week boundary (§3.3)
// ---------------------------------------------------------------------------

/**
 * Returns the Monday-anchored start of the ISO week containing `date`.
 * Uses date-fns `startOfWeek` with `weekStartsOn: 1` per §3.3.
 *
 * @param date - Any date within the target week.
 * @returns The Monday 00:00:00 of that week.
 */
export function getWeekStart(date: Date): Date {
	return startOfWeek(date, { weekStartsOn: 1 });
}

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/**
 * Formats a duration in seconds as a human-readable string for the given unit.
 *
 * @param seconds - Total seconds to format.
 * @param unit - Display unit ("minutes", "hours", or "sessions").
 * @returns Formatted string, e.g. "1h 15m", "75 min", "3 sessions".
 */
export function formatDuration(seconds: number, unit: Unit): string {
	if (unit === 'sessions') {
		return `${seconds} session${seconds === 1 ? '' : 's'}`;
	}
	if (unit === 'hours') {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h === 0) return `${m}m`;
		if (m === 0) return `${h}h`;
		return `${h}h ${m}m`;
	}
	// minutes
	const totalMin = Math.floor(seconds / 60);
	return `${totalMin} min`;
}

// Suppress unused import warning for addYears/subYears (used in tests via re-export)
export { addYears, subYears };
