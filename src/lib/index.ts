/**
 * @fileoverview Public API barrel export for src/lib.
 *
 * Consumers import from '$lib' (SvelteKit path alias) rather than
 * traversing internal module paths directly.
 */

// Engine singleton
export { engine, PracticeDataEngine } from './engine/PracticeDataEngine.svelte.js';

// Worker bridge
export { fetchAndParseSampleCSV, parseCSV } from './parse-csv.js';

// Types
export {
	DEFAULT_COMPARISON_CONFIG,
	DEFAULT_DISTRIBUTION_CONFIG,
	DEFAULT_TIMELINE_CONFIG
} from './types/engine.js';
export type {
	ComparisonConfig,
	ComparisonPeriod,
	ComparisonStrategy,
	DistributionCategory,
	DistributionChartStyle,
	DistributionConfig,
	DistributionMetric,
	SplitBy,
	TabId,
	TimelineConfig,
	TimeWindowPreset,
	XAxisAlignment
} from './types/engine.js';
export { DEFAULT_FILTERS } from './types/filters.js';
export type { ActiveFilters, Granularity, Season, Unit } from './types/filters.js';
export { NO_PRESET } from './types/session.js';
export type { CsvRow, SessionEntry, WorkerMessage, WorkerResult } from './types/session.js';
export type { SeasonalYear, TimeBucket } from './types/temporal.js';

// Calculators & Aggregators
export {
	aggregateTimelineBuckets,
	convertValue,
	groupBucketsBySegment
} from './engine/aggregators.js';
export {
	computeCategoryBreakdown,
	computeDayOfWeekDistribution,
	computeTimeOfDayDistribution
} from './engine/distribution.js';
export type { CategoryBreakdownItem, DayOfWeekBin, TimeOfDayBin } from './engine/distribution.js';
export {
	computeLinearRegression,
	computeMean,
	computeStandardDeviation,
	computeSymmetricMovingAverage
} from './engine/statistics.js';
export type { LinearRegressionResult } from './engine/statistics.js';

// ECharts Option Compilers
export {
	compileComparisonGridOptions,
	compileComparisonOption
} from './engine/compilers/comparison-compiler.js';
export type { ComparisonSeriesData } from './engine/compilers/comparison-compiler.js';
export {
	compileCategoryBreakdownOption,
	compileDayOfWeekOption,
	compileTimeOfDayOption
} from './engine/compilers/distribution-compiler.js';
export {
	compileSplitTimelineOption,
	compileTimelineOption
} from './engine/compilers/timeline-compiler.js';
export type { TimelineSegment } from './engine/compilers/timeline-compiler.js';

// ECharts shared modules
export { echartAction, exportPNG, exportSVG } from './echarts/echartAction.js';
export { default as echarts } from './echarts/registry.js';

// Utilities
export { extractFilters, validateRow } from './utils/csv-parser.js';
export {
	computeTimeWindowDateRange,
	formatDuration,
	getSeasonalYear,
	getSeasonForDate,
	getWeekStart,
	parseDurationToSeconds,
	parseInsightTimerDate
} from './utils/date-utils.js';
