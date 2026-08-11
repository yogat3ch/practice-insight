/**
 * @fileoverview Temporal aggregation bucket and seasonal year types.
 */

import type {Season} from './filters.js';

/**
 * A single aggregated time bucket for charting.
 * Produced by the PracticeDataEngine aggregate-then-split pipeline.
 */
export interface TimeBucket {
	/** Human-readable x-axis label (e.g. "Jul 2026", "W29 2026", "Summer 2025"). */
	readonly label: string;
	/** Inclusive start timestamp of this bucket. */
	readonly startDate: Date;
	/** Inclusive end timestamp of this bucket. */
	readonly endDate: Date;
	/** Sum of durationSeconds for all sessions in this bucket. */
	readonly totalSeconds: number;
	/** Count of sessions in this bucket. */
	readonly sessionCount: number;
}

/**
 * A seasonal year cycle running Dec 22 → Dec 21, labeled by end year.
 * E.g. Dec 22, 2024 → Dec 21, 2025 = "2025 Seasonal Year".
 */
export interface SeasonalYear {
	/** Display label, e.g. "2025 Seasonal Year". */
	readonly label: string;
	readonly season: Season;
	/** Dec 22 of the opening calendar year. */
	readonly startDate: Date;
	/** Dec 21 of the closing calendar year. */
	readonly endDate: Date;
}
