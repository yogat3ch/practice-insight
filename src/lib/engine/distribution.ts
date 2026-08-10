/**
 * @fileoverview Distribution & Breakdown calculators for Tab 3.
 *
 * Computes Day-of-Week distributions (Mon–Sun 7-bin), Time-of-Day practice
 * windows (00:00 to 23:00 24-bin), and Activity/Preset proportional shares.
 */

import type { Unit } from '../types/filters.js';
import type { SessionEntry } from '../types/session.js';
import { convertValue } from './aggregators.js';

/** Single day of week bin (Mon=0 to Sun=6). */
export interface DayOfWeekBin {
	readonly dayIndex: number; // 0=Mon, 6=Sun
	readonly dayName: string; // 'Mon', 'Tue', etc.
	readonly sessionCount: number;
	readonly totalValue: number;
	readonly averageValue: number;
}

/** Single 24-hour time of day bin (00:00 to 23:00). */
export interface TimeOfDayBin {
	readonly hour: number; // 0 to 23
	readonly hourLabel: string; // '00:00', '01:00', etc.
	readonly sessionCount: number;
	readonly totalValue: number;
}

/** Single item in Activity or Preset proportional breakdown. */
export interface CategoryBreakdownItem {
	readonly name: string;
	readonly sessionCount: number;
	readonly totalValue: number;
	readonly percentage: number; // 0 to 100
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Computes Mon–Sun 7-bin Day-of-Week volume intensity and averages.
 *
 * @param sessions - Filtered session entries.
 * @param unit - Display unit ('minutes', 'hours', 'sessions').
 * @param thresholdMinutes - Exclude sessions shorter than this value.
 * @returns Array of 7 DayOfWeekBin objects (Mon=0 to Sun=6).
 */
export function computeDayOfWeekDistribution(
	sessions: SessionEntry[],
	unit: Unit,
	thresholdMinutes = 0
): DayOfWeekBin[] {
	const thresholdSeconds = thresholdMinutes * 60;
	const validSessions = sessions.filter((s) => s.durationSeconds >= thresholdSeconds);

	const counts = new Array(7).fill(0);
	const totals = new Array(7).fill(0);

	for (const session of validSessions) {
		// JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat -> Convert to Mon=0 .. Sun=6
		const jsDay = session.startedAt.getDay();
		const monDay = (jsDay + 6) % 7;

		const val = convertValue(session.durationSeconds, unit);
		counts[monDay] += 1;
		totals[monDay] += val;
	}

	return DAY_NAMES.map((name, i) => {
		const sessionCount = counts[i];
		const totalValue = totals[i];
		const averageValue = sessionCount > 0 ? totalValue / sessionCount : 0;

		return {
			dayIndex: i,
			dayName: name,
			sessionCount,
			totalValue,
			averageValue
		};
	});
}

/**
 * Computes 24-bin Time-of-Day hourly start-time density (00:00 to 23:00).
 *
 * @param sessions - Filtered session entries.
 * @param unit - Display unit.
 * @param thresholdMinutes - Minimum session duration threshold.
 * @returns Array of 24 TimeOfDayBin objects (hours 0 to 23).
 */
export function computeTimeOfDayDistribution(
	sessions: SessionEntry[],
	unit: Unit,
	thresholdMinutes = 0
): TimeOfDayBin[] {
	const thresholdSeconds = thresholdMinutes * 60;
	const validSessions = sessions.filter((s) => s.durationSeconds >= thresholdSeconds);

	const counts = new Array(24).fill(0);
	const totals = new Array(24).fill(0);

	for (const session of validSessions) {
		const hour = session.startedAt.getHours(); // 0 to 23
		const val = convertValue(session.durationSeconds, unit);

		counts[hour] += 1;
		totals[hour] += val;
	}

	return Array.from({ length: 24 }, (_, hour) => ({
		hour,
		hourLabel: `${hour.toString().padStart(2, '0')}:00`,
		sessionCount: counts[hour],
		totalValue: totals[hour]
	}));
}

/**
 * Computes category breakdown share across Activities or Presets.
 *
 * @param sessions - Filtered session entries.
 * @param unit - Display unit.
 * @param mode - Group by 'activity' or 'preset'.
 * @param thresholdMinutes - Minimum session duration threshold.
 * @returns Array of CategoryBreakdownItem objects sorted by totalValue descending.
 */
export function computeCategoryBreakdown(
	sessions: SessionEntry[],
	unit: Unit,
	mode: 'activity' | 'preset',
	thresholdMinutes = 0
): CategoryBreakdownItem[] {
	const thresholdSeconds = thresholdMinutes * 60;
	const validSessions = sessions.filter((s) => s.durationSeconds >= thresholdSeconds);

	const map = new Map<string, { count: number; totalVal: number }>();
	let sumTotalVal = 0;

	for (const session of validSessions) {
		const name = mode === 'activity' ? session.activity : session.preset;
		if (!name) continue;

		const val = convertValue(session.durationSeconds, unit);
		sumTotalVal += val;

		const existing = map.get(name);
		if (existing) {
			existing.count += 1;
			existing.totalVal += val;
		} else {
			map.set(name, { count: 1, totalVal: val });
		}
	}

	const items: CategoryBreakdownItem[] = [];

	for (const [name, data] of map.entries()) {
		const percentage = sumTotalVal > 0 ? (data.totalVal / sumTotalVal) * 100 : 0;
		items.push({
			name,
			sessionCount: data.count,
			totalValue: data.totalVal,
			percentage
		});
	}

	return items.sort((a, b) => b.totalValue - a.totalValue);
}
