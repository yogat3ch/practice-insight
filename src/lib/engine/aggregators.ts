/**
 * @fileoverview Time-series aggregation pipeline ("Aggregate-then-Split").
 *
 * Groups sessions into continuous temporal buckets (Day, Week, Month, Quarter,
 * Season, Year) and converts duration to the selected Unit.
 * Fills missing date intervals so x-axes maintain chronological continuity.
 */

import {
	format,
	startOfDay,
	endOfDay,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	startOfQuarter,
	endOfQuarter,
	startOfYear,
	endOfYear,
	addDays,
	addWeeks,
	addMonths,
	addQuarters,
	addYears,
	isAfter,
	isBefore,
	min,
	max
} from 'date-fns';
import type { Granularity, Unit } from '../types/filters.js';
import type { SessionEntry } from '../types/session.js';
import type { TimeBucket } from '../types/temporal.js';
import { getSeasonForDate, getSeasonalYear } from '../utils/date-utils.js';

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

/** Internal helper computing interval start, end, and label for a target date. */
function getIntervalRange(
	date: Date,
	granularity: Granularity
): { startDate: Date; endDate: Date; label: string; key: string } {
	switch (granularity) {
		case 'day': {
			const startDate = startOfDay(date);
			const endDate = endOfDay(date);
			const label = format(date, 'MMM d, yyyy');
			const key = format(date, 'yyyy-MM-dd');
			return { startDate, endDate, label, key };
		}
		case 'week': {
			const startDate = startOfWeek(date, { weekStartsOn: 1 });
			const endDate = endOfWeek(date, { weekStartsOn: 1 });
			const label = `W${format(startDate, 'II')} (${format(startDate, 'MMM d')})`;
			const key = format(startDate, 'yyyy-II');
			return { startDate, endDate, label, key };
		}
		case 'month': {
			const startDate = startOfMonth(date);
			const endDate = endOfMonth(date);
			const label = format(date, 'MMM yyyy');
			const key = format(date, 'yyyy-MM');
			return { startDate, endDate, label, key };
		}
		case 'quarter': {
			const startDate = startOfQuarter(date);
			const endDate = endOfQuarter(date);
			const q = Math.floor(startDate.getMonth() / 3) + 1;
			const label = `Q${q} ${startDate.getFullYear()}`;
			const key = `${startDate.getFullYear()}-Q${q}`;
			return { startDate, endDate, label, key };
		}
		case 'season': {
			const sy = getSeasonalYear(date);
			const season = getSeasonForDate(date);
			const capitalized = season.charAt(0).toUpperCase() + season.slice(1);
			const label = `${capitalized} (${sy.label.split(' ')[0]})`;
			const key = `${sy.label}-${season}`;
			return { startDate: sy.startDate, endDate: sy.endDate, label, key };
		}
		case 'year': {
			const startDate = startOfYear(date);
			const endDate = endOfYear(date);
			const label = format(date, 'yyyy');
			const key = format(date, 'yyyy');
			return { startDate, endDate, label, key };
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
	dateTo: Date | null = null
): TimeBucket[] {
	if (sessions.length === 0) return [];

	// Map sessions into buckets by key
	const bucketMap = new Map<
		string,
		{ label: string; startDate: Date; endDate: Date; totalSeconds: number; sessionCount: number }
	>();

	let minDate = sessions[0].startedAt;
	let maxDate = sessions[0].startedAt;

	for (const session of sessions) {
		if (isBefore(session.startedAt, minDate)) minDate = session.startedAt;
		if (isAfter(session.startedAt, maxDate)) maxDate = session.startedAt;

		const { key, label, startDate, endDate } = getIntervalRange(session.startedAt, granularity);

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
				sessionCount: 1
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
		const { key, label, startDate, endDate } = getIntervalRange(curr, granularity);

		if (!seenKeys.has(key)) {
			seenKeys.add(key);
			const aggregated = bucketMap.get(key);

			result.push({
				label,
				startDate,
				endDate,
				totalSeconds: aggregated ? aggregated.totalSeconds : 0,
				sessionCount: aggregated ? aggregated.sessionCount : 0
			});
		}

		curr = stepInterval(curr, granularity);
	}

	return result;
}
