/**
 * @fileoverview View control and configuration types for PracticeDataEngine.
 */

import type {Granularity} from './filters.js';

/** Active top-level visualization tab. */
export type TabId = 'timeline' | 'comparison' | 'distribution';

/** Time window presets for Timeline mode. */
export type TimeWindowPreset = '3M' | '6M' | '1Y' | 'YTD' | 'All' | 'Custom';

/** Time split options for segmenting timeline charts into discrete cards. */
export type SplitBy = 'none' | 'week' | 'month' | 'quarter' | 'season' | 'year';

/** Configuration state for Tab 1: Timeline Mode. */
export interface TimelineConfig {
	readonly timePreset: TimeWindowPreset;
	readonly granularity: Granularity;
	readonly splitBy: SplitBy;
	/**
	 * When true and splitBy is active, render one chart card per split segment
	 * instead of a multi-series overlay. Ignored when splitBy is 'none'.
	 */
	readonly useChartGrid: boolean;
	/** Sliding window size in days (0 to 30) for moving average smoothing. 0 = disabled. */
	readonly movingAverageDays: number;
	/** Whether to overlay mean line (μ). */
	readonly showMean: boolean;
	/** Whether to overlay ±1 standard deviation band/lines (σ). */
	readonly showStdDev: boolean;
	/** Whether to overlay linear trendline. */
	readonly showLinearTrend: boolean;
}

/** Default configuration for Timeline mode. */
export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
	timePreset: 'All',
	granularity: 'month',
	splitBy: 'none',
	useChartGrid: false,
	movingAverageDays: 7,
	showMean: true,
	showStdDev: true,
	showLinearTrend: true,
};

/** Comparison strategies for Tab 2: Comparison Mode. */
export type ComparisonStrategy = 'period' | 'grid';

/** X-axis alignment rules for Comparison mode. */
export type XAxisAlignment = 'calendar' | 'elapsed';

/** Single defined period within a Comparison series constructor. */
export interface ComparisonPeriod {
	readonly id: string;
	readonly label: string;
	readonly dateFrom: Date;
	readonly dateTo: Date;
	readonly color: string;
}

/** Configuration state for Tab 2: Comparison Mode. */
export interface ComparisonConfig {
	readonly strategy: ComparisonStrategy;
	readonly periods: readonly ComparisonPeriod[];
	/** Force identical Y-axis scale bounds across all active comparison series. */
	readonly lockYAxis: boolean;
	readonly xAxisAlignment: XAxisAlignment;
}

/** Default configuration for Comparison mode. */
export const DEFAULT_COMPARISON_CONFIG: ComparisonConfig = {
	strategy: 'period',
	periods: [],
	lockYAxis: true,
	xAxisAlignment: 'calendar',
};

/** Distribution categories for Tab 3: Distribution & Breakdown Mode. */
export type DistributionCategory = 'dayOfWeek' | 'timeOfDay' | 'breakdown';

/** Available chart rendering styles per distribution category. */
export type DistributionChartStyle =
	'heatmap' | 'bar' | 'polar' | 'histogram' | 'donut' | 'stackedBar';

/** Metric calculation mode for distribution breakdowns. */
export type DistributionMetric =
	'totalDuration' | 'sessionCount' | 'averageDuration';

/**
 * Temporal grouping for the multi-period heatmap matrix (Day-of-Week) and
 * the stacked-bar breakdown. Each period becomes a row/segment in the chart.
 */
export type DistributionTemporalGrouping =
	'week' | 'month' | 'quarter' | 'season' | 'year';

/** Category group mode for the Activity & Preset Breakdown charts. */
export type BreakdownMode = 'activity' | 'preset';

/** Configuration state for Tab 3: Distribution & Breakdown Mode. */
export interface DistributionConfig {
	readonly category: DistributionCategory;
	readonly chartStyle: DistributionChartStyle;
	readonly metric: DistributionMetric;
	/** Threshold in minutes — sessions shorter than this value are excluded from calculation. */
	readonly thresholdMinutes: number;
	/**
	 * Temporal grouping applied to the Day-of-Week heatmap matrix rows and the
	 * Activity/Preset stacked-bar segments. Ignored by single-period charts
	 * (Day-of-Week bar, Time-of-Day polar/histogram, donut).
	 */
	readonly temporalGrouping: DistributionTemporalGrouping;
	/** Whether the Activity & Preset breakdown groups by activity or preset. */
	readonly breakdownMode: BreakdownMode;
}

/** Default configuration for Distribution mode. */
export const DEFAULT_DISTRIBUTION_CONFIG: DistributionConfig = {
	category: 'dayOfWeek',
	chartStyle: 'heatmap',
	metric: 'totalDuration',
	thresholdMinutes: 0,
	temporalGrouping: 'month',
	breakdownMode: 'activity',
};
