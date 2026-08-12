/**
 * @fileoverview Time-series aggregation pipeline ("Aggregate-then-Split").
 *
 * Groups sessions into continuous temporal buckets (Day, Week, Month, Quarter,
 * Season, Year) and converts duration to the selected Unit.
 * Fills missing date intervals so x-axes maintain chronological continuity.
 */

import {
	addDays,
	addMonths,
	addQuarters,
	addWeeks,
	addYears,
	endOfDay,
	endOfMonth,
	endOfQuarter,
	endOfWeek,
	endOfYear,
	format,
	isAfter,
	isBefore,
	max,
	min,
	startOfDay,
	startOfMonth,
	startOfQuarter,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import type {SplitBy} from '../types/engine.js';
import type {Granularity, Unit} from '../types/filters.js';
import type {SessionEntry} from '../types/session.js';
import type {TimeBucket} from '../types/temporal.js';
import {
	getSeasonForDate,
	getSeasonRange,
	getSeasonalYear,
} from '../utils/date-utils.js';

/**
 * Converts duration seconds or session count to a numeric scalar for the given unit.
 * Per §3.4 Rule 4: when unit is 'sessions', every record evaluates to 1.0.
 *
 * @param seconds - Session duration in seconds.
 * @param unit - Display unit ('minutes' | 'hours' | 'sessions').
 * @returns Converted numeric value.
 */
export function convertValue(seconds: number, unit: Unit): number {
	if (unit === 'sessions') return 1.0;
	if (unit === 'hours') return seconds / 3600;
	return seconds / 60; // minutes
}

/**
 * Ordinal rank for temporal intervals, ordered from finest to coarsest:
 * day(0) < week(1) < month(2) < quarter(3) < season(4) < year(5).
 *
 * Used to validate "Time Split must be coarser than Aggregate By" and to
 * filter valid Time Split options. `'none'` (No Split) is intentionally
 * excluded — callers treat it as always-available.
 *
 * @param interval - Granularity or split interval.
 * @returns Ordinal rank (0 = finest, 5 = coarsest). -1 for 'none'.
 */
export function intervalRank(interval: Granularity | SplitBy): number {
	switch (interval) {
		case 'day':
			return 0;
		case 'week':
			return 1;
		case 'month':
			return 2;
		case 'quarter':
			return 3;
		case 'season':
			return 4;
		case 'year':
			return 5;
		case 'none':
			return -1;
	}
}

/**
 * Returns true when a Time Split interval is strictly coarser than an
 * Aggregate By granularity — i.e. the split produces fewer, wider segments.
 * 'none' is always valid (returns true).
 *
 * @param splitBy - Candidate Time Split interval.
 * @param granularity - Selected Aggregate By granularity.
 * @returns Whether the split is coarser than (or equal to no) the granularity.
 */
export function isSplitCoarserThanGranularity(
	splitBy: SplitBy,
	granularity: Granularity,
): boolean {
	if (splitBy === 'none') return true;
	return intervalRank(splitBy) > intervalRank(granularity);
}

/**
 * Returns the temporal interval metadata (label, calendar bounds, stable key)
 * that contains `date` for a given granularity. Public wrapper around the
 * internal interval helper so distribution calculators can bucket sessions
 * into temporal periods (Week/Month/Quarter/Season/Year) without duplicating
 * the calendar math used by the aggregation pipeline (§5.3).
 *
 * For 'season' this returns the fixed solar season bounds (e.g. Spring =
 * Mar 20 – Jun 20) rather than the full Dec 22 → Dec 21 seasonal-year cycle,
 * so each season renders as its own row in the grouped charts.
 *
 * @param date - Target date.
 * @param granularity - Period granularity.
 * @returns Interval metadata (label, startDate, endDate, key).
 */
export function getPeriodForDate(
	date: Date,
	granularity: Granularity,
): {label: string; startDate: Date; endDate: Date; key: string} {
	if (granularity === 'season') {
		const range = getSeasonRange(date);
		return {...range, key: range.label};
	}
	return getIntervalRange(date, granularity);
}

/** Internal helper computing interval start, end, and label for a target date. */
function getIntervalRange(
	date: Date,
	granularity: Granularity,
): {startDate: Date; endDate: Date; label: string; key: string} {
	switch (granularity) {
		case 'day': {
			const startDate = startOfDay(date);
			const endDate = endOfDay(date);
			const label = format(date, 'MMM d, yyyy');
			const key = format(date, 'yyyy-MM-dd');
			return {startDate, endDate, label, key};
		}
		case 'week': {
			const startDate = startOfWeek(date, {weekStartsOn: 1});
			const endDate = endOfWeek(date, {weekStartsOn: 1});
			const label = `W${format(startDate, 'II')} (${format(startDate, 'MMM d')})`;
			const key = format(startDate, 'yyyy-II');
			return {startDate, endDate, label, key};
		}
		case 'month': {
			const startDate = startOfMonth(date);
			const endDate = endOfMonth(date);
			const label = format(date, 'MMM yyyy');
			const key = format(date, 'yyyy-MM');
			return {startDate, endDate, label, key};
		}
		case 'quarter': {
			const startDate = startOfQuarter(date);
			const endDate = endOfQuarter(date);
			const q = Math.floor(startDate.getMonth() / 3) + 1;
			const label = `Q${q} ${startDate.getFullYear()}`;
			const key = `${startDate.getFullYear()}-Q${q}`;
			return {startDate, endDate, label, key};
		}
		case 'season': {
			const sy = getSeasonalYear(date);
			const season = getSeasonForDate(date);
			const capitalized = season.charAt(0).toUpperCase() + season.slice(1);
			const label = `${capitalized} (${sy.label.split(' ')[0]})`;
			const key = `${sy.label}-${season}`;
			return {startDate: sy.startDate, endDate: sy.endDate, label, key};
		}
		case 'year': {
			const startDate = startOfYear(date);
			const endDate = endOfYear(date);
			const label = format(date, 'yyyy');
			const key = format(date, 'yyyy');
			return {startDate, endDate, label, key};
		}
	}
}

/** Steps a date forward by one granularity interval. */
function stepInterval(date: Date, granularity: Granularity): Date {
	switch (granularity) {
		case 'day':
			return addDays(date, 1);
		case 'week':
			return addWeeks(date, 1);
		case 'month':
			return addMonths(date, 1);
		case 'quarter':
			return addQuarters(date, 1);
		case 'season':
			return addMonths(date, 3);
		case 'year':
			return addYears(date, 1);
	}
}

/**
 * Aggregates a filtered array of sessions into continuous time buckets.
 *
 * Guarantees zero-value buckets for empty time intervals within the bounds
 * so time series line and bar charts maintain unbroken timeline continuity.
 *
 * @param sessions - Filtered session entries.
 * @param granularity - Aggregation granularity ('day', 'week', 'month', etc.).
 * @param unit - Display unit ('minutes', 'hours', 'sessions').
 * @param dateFrom - Inclusive lower bound (optional).
 * @param dateTo - Inclusive upper bound (optional).
 * @returns Array of TimeBucket objects ordered chronologically.
 */
export function aggregateTimelineBuckets(
	sessions: SessionEntry[],
	granularity: Granularity,
	unit: Unit,
	dateFrom: Date | null = null,
	dateTo: Date | null = null,
): TimeBucket[] {
	if (sessions.length === 0) return [];

	// Map sessions into buckets by key
	const bucketMap = new Map<
		string,
		{
			label: string;
			startDate: Date;
			endDate: Date;
			totalSeconds: number;
			sessionCount: number;
		}
	>();

	let minDate = sessions[0].startedAt;
	let maxDate = sessions[0].startedAt;

	for (const session of sessions) {
		if (isBefore(session.startedAt, minDate)) minDate = session.startedAt;
		if (isAfter(session.startedAt, maxDate)) maxDate = session.startedAt;

		const {key, label, startDate, endDate} = getIntervalRange(
			session.startedAt,
			granularity,
		);

		const existing = bucketMap.get(key);
		if (existing) {
			existing.totalSeconds += session.durationSeconds;
			existing.sessionCount += 1;
		} else {
			bucketMap.set(key, {
				label,
				startDate,
				endDate,
				totalSeconds: session.durationSeconds,
				sessionCount: 1,
			});
		}
	}

	// Override range bounds if explicitly provided
	const effectiveMin = dateFrom ? min([minDate, dateFrom]) : minDate;
	const effectiveMax = dateTo ? max([maxDate, dateTo]) : maxDate;

	// Fill all intervals continuously from effectiveMin to effectiveMax
	const result: TimeBucket[] = [];
	let curr = getIntervalRange(effectiveMin, granularity).startDate;
	const endLimit = getIntervalRange(effectiveMax, granularity).endDate;

	const seenKeys = new Set<string>();

	while (!isAfter(curr, endLimit)) {
		const {key, label, startDate, endDate} = getIntervalRange(
			curr,
			granularity,
		);

		if (!seenKeys.has(key)) {
			seenKeys.add(key);
			const aggregated = bucketMap.get(key);

			result.push({
				label,
				startDate,
				endDate,
				totalSeconds: aggregated ? aggregated.totalSeconds : 0,
				sessionCount: aggregated ? aggregated.sessionCount : 0,
			});
		}

		curr = stepInterval(curr, granularity);
	}

	return result;
}

/**
 * Groups continuous timeline buckets into discrete split segments for a
 * Time Split granularity (Week, Month, Quarter, Season, Year).
 *
 * Each segment is keyed by its first bucket's start date. Empty segments are
 * skipped (no empty segment cards are emitted).
 *
 * @param buckets - Continuous timeline buckets.
 * @param splitBy - Granularity to segment buckets by.
 * @returns Array of { segment, buckets } entries, ordered chronologically.
 */
export function groupBucketsBySegment(
	buckets: readonly TimeBucket[],
	splitBy: Exclude<SplitBy, 'none'>,
): {segment: string; buckets: TimeBucket[]}[] {
	const groups = new Map<string, TimeBucket[]>();

	for (const bucket of buckets) {
		const key = getSegmentKey(bucket.startDate, splitBy);
		const existing = groups.get(key);
		if (existing) {
			existing.push(bucket);
		} else {
			groups.set(key, [bucket]);
		}
	}

	return Array.from(groups.entries()).map(([segment, group]) => ({
		segment,
		buckets: group,
	}));
}

/**
 * Computes a stable segment key for a bucket's start date under a split
 * granularity.
 *
 * Uses the same date-fns granularity helpers as the aggregation pipeline so
 * labels stay consistent with the rest of the engine.
 *
 * @param date - Bucket start date.
 * @param splitBy - Split granularity.
 * @returns Stable string key, e.g. "2026-07", "2026-Q3", "2025-Summer", "2026".
 */
function getSegmentKey(date: Date, splitBy: Exclude<SplitBy, 'none'>): string {
	switch (splitBy) {
		case 'week': {
			const monday = startOfWeek(date, {weekStartsOn: 1});
			return `W${format(monday, 'II')} ${monday.getFullYear()}`;
		}
		case 'month':
			return format(date, 'MMM yyyy');
		case 'quarter': {
			const q = Math.floor(date.getMonth() / 3) + 1;
			return `Q${q} ${date.getFullYear()}`;
		}
		case 'season': {
			const season = getSeasonForDate(date);
			const capitalized = season.charAt(0).toUpperCase() + season.slice(1);
			return `${capitalized} ${getSeasonalYear(date).label.split(' ')[0]}`;
		}
		case 'year':
			return format(date, 'yyyy');
	}
}
