/**
 * @fileoverview Filter state and unit/granularity enumerations.
 */

/** Display unit for all chart values. */
export type Unit = 'minutes' | 'hours' | 'sessions';

/**
 * Time aggregation granularity for timeline bucketing.
 * Determines the width of each x-axis data point.
 */
export type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'season' | 'year';

/** Fixed solar season per §3.3 of the specification. */
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/** Global filter state managed by PracticeDataEngine. */
export interface ActiveFilters {
	/** Activities to include. Empty set = include all. */
	readonly activities: ReadonlySet<string>;
	/** Presets to include. Empty set = include all. */
	readonly presets: ReadonlySet<string>;
	/** Currently selected display unit. */
	readonly unit: Unit;
	/** Inclusive start of the active date window. null = no lower bound. */
	readonly dateFrom: Date | null;
	/** Inclusive end of the active date window. null = no upper bound. */
	readonly dateTo: Date | null;
}

/** Default filter state — all sessions visible, minutes display unit. */
export const DEFAULT_FILTERS: ActiveFilters = {
	activities: new Set(),
	presets: new Set(),
	unit: 'minutes',
	dateFrom: null,
	dateTo: null
};
