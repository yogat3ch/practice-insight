/**
 * @fileoverview CSV row validation and filter extraction.
 *
 * This module is the single source of row-level hygiene logic, shared between
 * the Web Worker and unit tests. No browser APIs are used so it runs in any
 * JS environment.
 */

import {parseInsightTimerDate, parseDurationToSeconds} from './date-utils.js';
import {NO_PRESET, type CsvRow, type SessionEntry} from '../types/session.js';

// ---------------------------------------------------------------------------
// Row validation
// ---------------------------------------------------------------------------

/**
 * Validates and transforms a raw PapaParse CsvRow into a typed SessionEntry.
 *
 * Skips (returns null) if:
 *   - "Started At" cannot be parsed into a valid Date
 *   - "Duration" cannot be parsed into a non-negative number of seconds
 *
 * Normalizes:
 *   - Empty or whitespace-only "Preset" → NO_PRESET sentinel
 *
 * @param row - Raw header-mapped object from PapaParse.
 * @returns A validated SessionEntry, or null if the row is malformed.
 */
export function validateRow(row: CsvRow): SessionEntry | null {
	const startedAt = parseInsightTimerDate(row['Started At']);
	if (startedAt === null) return null;

	const durationSeconds = parseDurationToSeconds(row['Duration']);
	if (durationSeconds === null || durationSeconds < 0) return null;

	const rawPreset = row['Preset']?.trim() ?? '';
	const preset = rawPreset.length > 0 ? rawPreset : NO_PRESET;

	const activity = row['Activity']?.trim() ?? '';

	return {startedAt, durationSeconds, preset, activity};
}

// ---------------------------------------------------------------------------
// Dynamic filter extraction (§3.2)
// ---------------------------------------------------------------------------

/**
 * Extracts sorted, unique activity and preset values from a parsed session array.
 *
 * Per §3.2:
 *   - activities: all unique Activity strings, sorted alphabetically
 *   - presets: unique named presets (excludes NO_PRESET sentinel), sorted alphabetically
 *
 * @param sessions - Array of validated SessionEntry objects.
 * @returns Object with sorted unique `activities` and `presets` arrays.
 */
export function extractFilters(sessions: SessionEntry[]): {
	activities: string[];
	presets: string[];
} {
	const activitySet = new Set<string>();
	const presetSet = new Set<string>();

	for (const session of sessions) {
		if (session.activity) activitySet.add(session.activity);
		if (session.preset !== NO_PRESET) presetSet.add(session.preset);
	}

	return {
		activities: Array.from(activitySet).sort(),
		presets: Array.from(presetSet).sort(),
	};
}
