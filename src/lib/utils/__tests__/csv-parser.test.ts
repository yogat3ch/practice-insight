/**
 * @fileoverview Unit tests for csv-parser.ts row validation and filter extraction.
 */

import { describe, it, expect } from 'vitest';
import { validateRow, extractFilters } from '../csv-parser.js';
import { NO_PRESET, type CsvRow, type SessionEntry } from '../../types/session.js';

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<CsvRow> = {}): CsvRow {
	return {
		'Started At': '07/23/2026 12:55:02',
		Duration: '0:20:42',
		Preset: '',
		Activity: 'Meditation',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// validateRow
// ---------------------------------------------------------------------------

describe('validateRow', () => {
	it('returns a valid SessionEntry for a well-formed row', () => {
		const entry = validateRow(makeRow());
		expect(entry).not.toBeNull();
		expect(entry?.activity).toBe('Meditation');
		expect(entry?.durationSeconds).toBe(1242); // 0:20:42
		expect(entry?.startedAt).toBeInstanceOf(Date);
	});

	it('normalizes an empty Preset to NO_PRESET sentinel', () => {
		const entry = validateRow(makeRow({ Preset: '' }));
		expect(entry?.preset).toBe(NO_PRESET);
	});

	it('normalizes a whitespace-only Preset to NO_PRESET', () => {
		const entry = validateRow(makeRow({ Preset: '   ' }));
		expect(entry?.preset).toBe(NO_PRESET);
	});

	it('preserves a non-empty Preset value', () => {
		const entry = validateRow(makeRow({ Preset: 'Morning Sit' }));
		expect(entry?.preset).toBe('Morning Sit');
	});

	it('returns null for an unparseable "Started At"', () => {
		expect(validateRow(makeRow({ 'Started At': 'not a date' }))).toBeNull();
	});

	it('returns null for an empty "Started At"', () => {
		expect(validateRow(makeRow({ 'Started At': '' }))).toBeNull();
	});

	it('returns null for an unparseable Duration', () => {
		expect(validateRow(makeRow({ Duration: 'invalid' }))).toBeNull();
	});

	it('returns null for an empty Duration', () => {
		expect(validateRow(makeRow({ Duration: '' }))).toBeNull();
	});

	it('parses zero-second duration as valid (session log artifact)', () => {
		const entry = validateRow(makeRow({ Duration: '0:0:0' }));
		expect(entry).not.toBeNull();
		expect(entry?.durationSeconds).toBe(0);
	});

	it('correctly parses a 3-hour+ session from sample CSV', () => {
		const entry = validateRow(
			makeRow({ 'Started At': '07/23/2026 12:55:02', Duration: '3:0:27' })
		);
		expect(entry?.durationSeconds).toBe(10827);
	});

	it('parses a very short session (33 seconds) from sample CSV', () => {
		const entry = validateRow(
			makeRow({ 'Started At': '07/09/2026 22:05:46', Duration: '0:0:33' })
		);
		expect(entry?.durationSeconds).toBe(33);
	});
});

// ---------------------------------------------------------------------------
// extractFilters
// ---------------------------------------------------------------------------

describe('extractFilters', () => {
	const sessions: SessionEntry[] = [
		{
			startedAt: new Date(),
			durationSeconds: 60,
			preset: NO_PRESET,
			activity: 'Meditation'
		},
		{
			startedAt: new Date(),
			durationSeconds: 120,
			preset: NO_PRESET,
			activity: 'Yoga'
		},
		{
			startedAt: new Date(),
			durationSeconds: 30,
			preset: 'Morning Sit',
			activity: 'Meditation'
		},
		{
			startedAt: new Date(),
			durationSeconds: 45,
			preset: NO_PRESET,
			activity: 'Breathing'
		}
	];

	it('returns sorted unique activity strings', () => {
		const { activities } = extractFilters(sessions);
		expect(activities).toEqual(['Breathing', 'Meditation', 'Yoga']);
	});

	it('returns sorted unique named presets (excludes NO_PRESET)', () => {
		const { presets } = extractFilters(sessions);
		expect(presets).toEqual(['Morning Sit']);
	});

	it('returns empty arrays for an empty session array', () => {
		const { activities, presets } = extractFilters([]);
		expect(activities).toEqual([]);
		expect(presets).toEqual([]);
	});

	it('returns empty presets array when all sessions use NO_PRESET', () => {
		const noPresetSessions = sessions.filter((s) => s.preset === NO_PRESET);
		const { presets } = extractFilters(noPresetSessions);
		expect(presets).toEqual([]);
	});

	it('deduplicates repeated activities', () => {
		const { activities } = extractFilters(sessions);
		const meditationCount = activities.filter((a) => a === 'Meditation').length;
		expect(meditationCount).toBe(1);
	});
});
