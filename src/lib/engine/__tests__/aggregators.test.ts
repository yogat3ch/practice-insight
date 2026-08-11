/**
 * @fileoverview Unit tests for time-series bucketing aggregators and unit converters.
 */

import {describe, expect, it} from 'vitest';
import type {SessionEntry} from '../../types/session.js';
import {
	aggregateTimelineBuckets,
	convertValue,
	getPeriodForDate,
} from '../aggregators.js';

describe('convertValue (§3.4 Rule 4)', () => {
	it('converts seconds to minutes', () => {
		expect(convertValue(180, 'minutes')).toBe(3);
	});

	it('converts seconds to hours', () => {
		expect(convertValue(3600, 'hours')).toBe(1);
		expect(convertValue(1800, 'hours')).toBe(0.5);
	});

	it('evaluates every record to 1.0 when unit is sessions', () => {
		expect(convertValue(0, 'sessions')).toBe(1.0);
		expect(convertValue(10800, 'sessions')).toBe(1.0);
	});
});

describe('aggregateTimelineBuckets', () => {
	const sampleSessions: SessionEntry[] = [
		{
			startedAt: new Date(2026, 6, 20, 10, 0, 0), // Mon Jul 20, 2026
			durationSeconds: 1800, // 30 mins
			preset: '(No Preset)',
			activity: 'Meditation',
		},
		{
			startedAt: new Date(2026, 6, 21, 15, 0, 0), // Tue Jul 21, 2026
			durationSeconds: 3600, // 60 mins
			preset: '(No Preset)',
			activity: 'Meditation',
		},
		{
			startedAt: new Date(2026, 6, 23, 8, 0, 0), // Thu Jul 23, 2026
			durationSeconds: 900, // 15 mins
			preset: '(No Preset)',
			activity: 'Yoga',
		},
	];

	it('aggregates daily buckets and fills zero-value gap for Wed Jul 22', () => {
		const buckets = aggregateTimelineBuckets(sampleSessions, 'day', 'minutes');

		// Expected days: Mon 20, Tue 21, Wed 22 (gap filled with 0), Thu 23
		expect(buckets.length).toBe(4);

		expect(buckets[0].totalSeconds).toBe(1800);
		expect(buckets[0].sessionCount).toBe(1);

		expect(buckets[1].totalSeconds).toBe(3600);
		expect(buckets[1].sessionCount).toBe(1);

		// Wed Jul 22 filled zero bucket
		expect(buckets[2].totalSeconds).toBe(0);
		expect(buckets[2].sessionCount).toBe(0);

		expect(buckets[3].totalSeconds).toBe(900);
		expect(buckets[3].sessionCount).toBe(1);
	});

	it('aggregates into a single weekly bucket for sessions within same ISO week', () => {
		const buckets = aggregateTimelineBuckets(sampleSessions, 'week', 'minutes');
		expect(buckets.length).toBe(1);
		expect(buckets[0].totalSeconds).toBe(6300); // 1800 + 3600 + 900
		expect(buckets[0].sessionCount).toBe(3);
	});

	it('returns empty array for empty sessions input', () => {
		expect(aggregateTimelineBuckets([], 'month', 'minutes')).toEqual([]);
	});
});

describe('getPeriodForDate (§5.3 temporal grouping)', () => {
	it('maps a date to its month period', () => {
		const period = getPeriodForDate(new Date(2026, 6, 20), 'month');
		expect(period.label).toBe('Jul 2026');
		expect(period.key).toBe('2026-07');
	});

	it('maps a date to its quarter period', () => {
		const period = getPeriodForDate(new Date(2026, 6, 20), 'quarter');
		expect(period.label).toBe('Q3 2026');
	});

	it('maps a date to its seasonal-year period', () => {
		const period = getPeriodForDate(new Date(2026, 6, 20), 'season');
		// July is Summer 2026 (fixed solar bounds, not the full seasonal year).
		expect(period.label).toBe('Summer 2026');
	});

	it('maps a December date to the correct winter period', () => {
		const period = getPeriodForDate(new Date(2026, 11, 25), 'season');
		expect(period.label).toBe('Winter 2026–2027');
	});

	it('maps a date to its year period', () => {
		const period = getPeriodForDate(new Date(2026, 6, 20), 'year');
		expect(period.label).toBe('2026');
	});
});
