/**
 * @fileoverview Public API barrel export for src/lib.
 *
 * Consumers import from '$lib' (SvelteKit path alias) rather than
 * traversing internal module paths directly.
 */

// Engine singleton
export { engine, PracticeDataEngine } from './engine/PracticeDataEngine.svelte.js';

// Worker bridge
export { parseCSV, fetchAndParseSampleCSV } from './parse-csv.js';

// Types
export type { SessionEntry, CsvRow, WorkerResult, WorkerMessage } from './types/session.js';
export { NO_PRESET } from './types/session.js';
export type { Unit, Granularity, Season, ActiveFilters } from './types/filters.js';
export { DEFAULT_FILTERS } from './types/filters.js';
export type { TimeBucket, SeasonalYear } from './types/temporal.js';
export type {
	TabId,
	TimeWindowPreset,
	SplitBy,
	TimelineConfig,
	ComparisonStrategy,
	XAxisAlignment,
	ComparisonPeriod,
	ComparisonConfig,
	DistributionCategory,
	DistributionChartStyle,
	DistributionMetric,
	DistributionConfig
} from './types/engine.js';
export {
	DEFAULT_TIMELINE_CONFIG,
	DEFAULT_COMPARISON_CONFIG,
	DEFAULT_DISTRIBUTION_CONFIG
} from './types/engine.js';

// Calculators & Aggregators
export { convertValue, aggregateTimelineBuckets } from './engine/aggregators.js';
export {
	computeMean,
	computeStandardDeviation,
	computeLinearRegression,
	computeSymmetricMovingAverage
} from './engine/statistics.js';
export type { LinearRegressionResult } from './engine/statistics.js';
export {
	computeDayOfWeekDistribution,
	computeTimeOfDayDistribution,
	computeCategoryBreakdown
} from './engine/distribution.js';
export type {
	DayOfWeekBin,
	TimeOfDayBin,
	CategoryBreakdownItem
} from './engine/distribution.js';

// ECharts Option Compilers
export { compileTimelineOption } from './engine/compilers/timeline-compiler.js';
export { compileComparisonOption } from './engine/compilers/comparison-compiler.js';
export {
	compileDayOfWeekOption,
	compileTimeOfDayOption,
	compileCategoryBreakdownOption
} from './engine/compilers/distribution-compiler.js';

// ECharts shared modules
export { default as echarts } from './echarts/registry.js';
export { echartAction, exportPNG, exportSVG } from './echarts/echartAction.js';

// Utilities
export {
	parseInsightTimerDate,
	parseDurationToSeconds,
	getSeasonForDate,
	getSeasonalYear,
	getWeekStart,
	formatDuration
} from './utils/date-utils.js';
export { validateRow, extractFilters } from './utils/csv-parser.js';
