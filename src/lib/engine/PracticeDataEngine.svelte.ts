/**
 * @fileoverview PracticeDataEngine — Central analytical engine for Practice Insight.
 *
 * Framework-agnostic TypeScript class bound to Svelte 5 runes ($state, $derived).
 * Uses the .svelte.ts extension required by Svelte 5 for runes outside components.
 *
 * Implements the "Aggregate-then-Split" pipeline (§3.4):
 *   - Raw SessionEntry retention & privacy-first in-memory filtering
 *   - Continuous time-series bucketing across Days, Weeks, Months, Quarters, Seasons, Years
 *   - Context-relative statistical overlays (Mean μ, StdDev σ, Linear Trendline)
 *   - Symmetric sliding-window moving averages without zero-padding at boundaries
 *   - Declarative ECharts option compilers for Timeline, Comparison, and Distribution views
 */

import {format} from 'date-fns';
import type {EChartsOption} from 'echarts';
import {
	DEFAULT_COMPARISON_CONFIG,
	DEFAULT_DISTRIBUTION_CONFIG,
	DEFAULT_TIMELINE_CONFIG,
	type BreakdownMode,
	type ComparisonConfig,
	type ComparisonPeriod,
	type DistributionCategory,
	type DistributionChartStyle,
	type DistributionConfig,
	type DistributionMetric,
	type DistributionTemporalGrouping,
	type SplitBy,
	type TabId,
	type TimelineConfig,
} from '../types/engine.js';
import {
	DEFAULT_FILTERS,
	type ActiveFilters,
	type Granularity,
	type Unit,
} from '../types/filters.js';
import type {SessionEntry, WorkerResult} from '../types/session.js';
import type {TimeBucket} from '../types/temporal.js';
import {
	aggregateTimelineBuckets,
	convertValue,
	groupBucketsBySegment,
} from './aggregators.js';
import {
	compileComparisonGridOptions,
	compileComparisonOption,
	type ComparisonSeriesData,
} from './compilers/comparison-compiler.js';
import {
	compileCategoryBreakdownOption,
	compileCategoryStackedBar,
	compileDayOfWeekHeatmapMatrix,
	compileDayOfWeekOption,
	compileTimeOfDayOption,
	emptyDistributionOption,
} from './compilers/distribution-compiler.js';
import {
	compileSplitTimelineOption,
	compileTimelineOption,
} from './compilers/timeline-compiler.js';
import {
	computeCategoryBreakdown,
	computeCategoryPeriodBreakdown,
	computeDayOfWeekDistribution,
	computeDayOfWeekPeriodDistribution,
	computeTimeOfDayDistribution,
	type CategoryBreakdownItem,
	type CategoryPeriodItem,
	type DayOfWeekBin,
	type DayOfWeekPeriodBin,
	type TimeOfDayBin,
} from './distribution.js';
import {
	computeLinearRegression,
	computeMean,
	computeStandardDeviation,
	computeSymmetricMovingAverage,
	type LinearRegressionResult,
} from './statistics.js';

export class PracticeDataEngine {
	// -------------------------------------------------------------------------
	// Raw State ($state)
	// -------------------------------------------------------------------------

	/** All raw parsed session entries loaded from CSV. */
	#sessions = $state<SessionEntry[]>([]);

	/** Number of malformed rows skipped during parsing. */
	#skippedCount = $state(0);

	/** Global filter selections. */
	#filters = $state<ActiveFilters>({...DEFAULT_FILTERS});

	/** Active main visualization tab. */
	#activeTab = $state<TabId>('timeline');

	/** Tab 1 Timeline parameters. */
	#timelineConfig = $state<TimelineConfig>({...DEFAULT_TIMELINE_CONFIG});

	/** Tab 2 Comparison parameters. */
	#comparisonConfig = $state<ComparisonConfig>({...DEFAULT_COMPARISON_CONFIG});

	/** Tab 3 Distribution parameters. */
	#distributionConfig = $state<DistributionConfig>({
		...DEFAULT_DISTRIBUTION_CONFIG,
	});

	// -------------------------------------------------------------------------
	// Derived Working Set ($derived)
	// -------------------------------------------------------------------------

	/** Filtered session array matching active activity, preset, and date range bounds. */
	get filteredSessions(): SessionEntry[] {
		return this.#sessions.filter(session => {
			const {activities, presets, dateFrom, dateTo} = this.#filters;
			if (activities.size > 0 && !activities.has(session.activity))
				return false;
			if (presets.size > 0 && !presets.has(session.preset)) return false;
			if (dateFrom !== null && session.startedAt < dateFrom) return false;
			if (dateTo !== null && session.startedAt > dateTo) return false;
			return true;
		});
	}

	/** Unique, sorted activity strings present in the dataset. */
	get availableActivities(): string[] {
		return Array.from(new Set(this.#sessions.map(s => s.activity)))
			.filter(Boolean)
			.sort();
	}

	/** Unique, sorted preset names (excludes "(No Preset)"). */
	get availablePresets(): string[] {
		return Array.from(
			new Set(
				this.#sessions.map(s => s.preset).filter(p => p !== '(No Preset)'),
			),
		).sort();
	}

	// -------------------------------------------------------------------------
	// Tab 1: Timeline Derivations ($derived)
	// -------------------------------------------------------------------------

	/** Continuous time-series buckets for the active granularity and date window. */
	get timelineBuckets(): TimeBucket[] {
		return aggregateTimelineBuckets(
			this.filteredSessions,
			this.#timelineConfig.granularity,
			this.#filters.unit,
			this.#filters.dateFrom,
			this.#filters.dateTo,
		);
	}

	/** Scalar numeric array corresponding to timeline buckets. */
	get timelineValues(): number[] {
		return this.timelineBuckets.map(b =>
			convertValue(b.totalSeconds, this.#filters.unit),
		);
	}

	/** Arithmetic mean (μ) of current timeline bucket values. */
	get timelineMean(): number {
		return computeMean(this.timelineValues);
	}

	/** Sample standard deviation (σ) of current timeline bucket values. */
	get timelineStdDev(): number {
		return computeStandardDeviation(this.timelineValues);
	}

	/** Linear regression trendline calculated over active timeline buckets. */
	// Linear regression computed on-demand to avoid initialization order issues.
	get timelineLinearTrend(): LinearRegressionResult {
		return computeLinearRegression(this.timelineValues);
	}

	/** Symmetric sliding-window moving average without zero-padding at boundaries. */
	get timelineMovingAverage(): number[] {
		return computeSymmetricMovingAverage(
			this.timelineValues,
			this.#timelineConfig.movingAverageDays,
		);
	}

	/** Declarative ECharts option JSON payload for Tab 1. */
	get timelineOption(): EChartsOption {
		return compileTimelineOption({
			buckets: this.timelineBuckets,
			unit: this.#filters.unit,
			movingAverageValues: this.timelineMovingAverage,
			mean: this.timelineMean,
			stdDev: this.timelineStdDev,
			linearTrend: this.timelineLinearTrend,
			showMean: this.#timelineConfig.showMean,
			showStdDev: this.#timelineConfig.showStdDev,
			showLinearTrend: this.#timelineConfig.showLinearTrend,
			movingAverageDays: this.#timelineConfig.movingAverageDays,
		});
	}

	/**
	 * Array of per-segment timeline options when Time Split is active.
	 *
	 * - splitBy === 'none'             → single chart (existing timelineOption).
	 * - splitBy active, !useChartGrid  → single multi-series overlay chart, one
	 *                                    colored series per split segment.
	 * - splitBy active, useChartGrid   → one chart card per split segment.
	 */
	get timelineOptionsBySegment(): {segment: string; option: EChartsOption}[] {
		const {splitBy, useChartGrid} = this.#timelineConfig;

		// No split requested — single overlay chart.
		if (splitBy === 'none') {
			return [{segment: 'All', option: this.timelineOption}];
		}

		const segments = groupBucketsBySegment(this.timelineBuckets, splitBy);

		// Multi-series overlay of all segments on a single chart.
		if (!useChartGrid) {
			return [
				{
					segment: 'All',
					option: compileSplitTimelineOption(segments, this.#filters.unit),
				},
			];
		}

		// Card grid — one chart per split segment.
		return segments.map(({segment, buckets}) => {
			const values = buckets.map(b =>
				convertValue(b.totalSeconds, this.#filters.unit),
			);
			const mean = computeMean(values);
			const stdDev = computeStandardDeviation(values);
			const linearTrend = computeLinearRegression(values);
			// Recompute moving average on the segment-local values.
			const ma = computeSymmetricMovingAverage(
				values,
				this.#timelineConfig.movingAverageDays,
			);

			return {
				segment,
				option: compileTimelineOption({
					buckets,
					unit: this.#filters.unit,
					movingAverageValues: ma,
					mean,
					stdDev,
					linearTrend,
					showMean: this.#timelineConfig.showMean,
					showStdDev: this.#timelineConfig.showStdDev,
					showLinearTrend: this.#timelineConfig.showLinearTrend,
					movingAverageDays: this.#timelineConfig.movingAverageDays,
				}),
			};
		});
	}

	// -------------------------------------------------------------------------
	// Tab 2: Comparison Derivations ($derived)
	// -------------------------------------------------------------------------

	/** Multi-period series list for Comparison mode. */
	get comparisonSeriesList(): ComparisonSeriesData[] {
		return this.#comparisonConfig.periods.map(period => {
			const periodSessions = this.filteredSessions.filter(
				s => s.startedAt >= period.dateFrom && s.startedAt <= period.dateTo,
			);
			const buckets = aggregateTimelineBuckets(
				periodSessions,
				this.#timelineConfig.granularity,
				this.#filters.unit,
				period.dateFrom,
				period.dateTo,
			);
			return {id: period.id, label: period.label, color: period.color, buckets};
		});
	}

	/** Declarative ECharts option JSON payload for Tab 2. */
	get comparisonOption(): EChartsOption {
		return compileComparisonOption({
			seriesList: this.comparisonSeriesList,
			unit: this.#filters.unit,
			lockYAxis: this.#comparisonConfig.lockYAxis,
			xAxisAlignment: this.#comparisonConfig.xAxisAlignment,
		});
	}

	/**
	 * Per-period standalone chart options for Tab 2's Sequential Side-by-Side
	 * strategy. Each entry is one chart card with a shared (locked) Y-axis.
	 */
	get comparisonGridOptions(): {period: string; option: EChartsOption}[] {
		return compileComparisonGridOptions({
			seriesList: this.comparisonSeriesList,
			unit: this.#filters.unit,
			lockYAxis: this.#comparisonConfig.lockYAxis,
			xAxisAlignment: this.#comparisonConfig.xAxisAlignment,
		});
	}

	// -------------------------------------------------------------------------
	// Tab 3: Distribution Derivations ($derived)
	// -------------------------------------------------------------------------

	/** Mon–Sun 7-bin Day-of-Week distribution calculation. */
	get dayOfWeekBins(): DayOfWeekBin[] {
		return computeDayOfWeekDistribution(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.thresholdMinutes,
		);
	}

	/**
	 * Per-temporal-period Day-of-Week distributions for the heatmap matrix.
	 * Each entry is one row (week/month/quarter/season/year).
	 */
	get dayOfWeekPeriodBins(): DayOfWeekPeriodBin[] {
		return computeDayOfWeekPeriodDistribution(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.thresholdMinutes,
			this.#distributionConfig.temporalGrouping,
		);
	}

	/** 24-bin Time-of-Day hourly start-time density calculation. */
	get timeOfDayBins(): TimeOfDayBin[] {
		return computeTimeOfDayDistribution(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.thresholdMinutes,
		);
	}

	/** Category share breakdown (Activity or Preset). */
	get categoryBreakdownItems(): CategoryBreakdownItem[] {
		return computeCategoryBreakdown(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.breakdownMode,
			this.#distributionConfig.thresholdMinutes,
		);
	}

	/**
	 * Per-temporal-period category breakdowns for the grouped stacked bar.
	 * Each entry is one horizontal bar (week/month/quarter/season/year).
	 */
	get categoryPeriodItems(): CategoryPeriodItem[] {
		return computeCategoryPeriodBreakdown(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.breakdownMode,
			this.#distributionConfig.thresholdMinutes,
			this.#distributionConfig.temporalGrouping,
		);
	}

	/**
	 * Declarative ECharts option JSON payload for Tab 3.
	 *
	 * Wires the full distribution control surface (§5.3):
	 *   - category → the correct compiler family
	 *   - chartStyle → the correct chart shape (bar/heatmap matrix, polar/
	 *     histogram, donut/stacked bar)
	 *   - metric → flows through every calculator via metricValueOf
	 *   - temporalGrouping → groups heatmap rows and stacked-bar segments
	 *   - thresholdMinutes → filters bins upstream in the calculators
	 */
	get distributionOption(): EChartsOption {
		const {category, chartStyle, metric, temporalGrouping} =
			this.#distributionConfig;
		const unit = this.#filters.unit;

		if (category === 'dayOfWeek') {
			// Heatmap style uses the multi-period matrix when grouping is active;
			// otherwise it degrades to the single "Volume" row heatmap.
			if (chartStyle === 'heatmap') {
				const periods = this.dayOfWeekPeriodBins;
				if (periods.length > 0) {
					return compileDayOfWeekHeatmapMatrix(
						periods,
						unit,
						metric,
						temporalGrouping,
					);
				}
				return compileDayOfWeekOption(
					this.dayOfWeekBins,
					unit,
					'heatmap',
					metric,
				);
			}
			return compileDayOfWeekOption(this.dayOfWeekBins, unit, 'bar', metric);
		}

		if (category === 'timeOfDay') {
			const style = chartStyle === 'polar' ? 'polar' : 'histogram';
			return compileTimeOfDayOption(this.timeOfDayBins, unit, style, metric);
		}

		// Activity & Preset breakdown.
		if (chartStyle === 'stackedBar') {
			const periods = this.categoryPeriodItems;
			if (periods.length > 0) {
				return compileCategoryStackedBar(
					periods,
					unit,
					metric,
					temporalGrouping,
				);
			}
			return compileCategoryBreakdownOption(
				this.categoryBreakdownItems,
				unit,
				'stackedBar',
				metric,
			);
		}
		return compileCategoryBreakdownOption(
			this.categoryBreakdownItems,
			unit,
			'donut',
			metric,
		);
	}

	/**
	 * Empty-state ECharts option for Tab 3, shown when no data is loaded.
	 */
	get emptyDistributionOption(): EChartsOption {
		return emptyDistributionOption();
	}

	// -------------------------------------------------------------------------
	// Global State Getters ($derived getters)
	// -------------------------------------------------------------------------

	get filters(): ActiveFilters {
		return this.#filters;
	}
	get activeTab(): TabId {
		return this.#activeTab;
	}
	get timelineConfig(): TimelineConfig {
		return this.#timelineConfig;
	}
	get comparisonConfig(): ComparisonConfig {
		return this.#comparisonConfig;
	}
	get distributionConfig(): DistributionConfig {
		return this.#distributionConfig;
	}
	get skippedCount(): number {
		return this.#skippedCount;
	}
	get hasData(): boolean {
		return this.#sessions.length > 0;
	}
	get totalSessionCount(): number {
		return this.#sessions.length;
	}

	// -------------------------------------------------------------------------
	// Data Load & Reset API
	// -------------------------------------------------------------------------

	/** Loads a fresh CSV WorkerResult into the engine and resets filters. */
	loadData(result: WorkerResult): void {
		this.#sessions = result.sessions;
		this.#skippedCount = result.skippedCount;
		this.#filters = {...DEFAULT_FILTERS};
	}

	/** Clears all raw data and resets all view controls to default. */
	clearData(): void {
		this.#sessions = [];
		this.#skippedCount = 0;
		this.#filters = {...DEFAULT_FILTERS};
		this.#timelineConfig = {...DEFAULT_TIMELINE_CONFIG};
		this.#comparisonConfig = {...DEFAULT_COMPARISON_CONFIG};
		this.#distributionConfig = {...DEFAULT_DISTRIBUTION_CONFIG};
	}

	// -------------------------------------------------------------------------
	// Global Control Setters
	// -------------------------------------------------------------------------

	setTab(tab: TabId): void {
		this.#activeTab = tab;
	}

	setActivityFilter(activities: readonly string[]): void {
		this.#filters = {...this.#filters, activities: new Set(activities)};
	}

	setPresetFilter(presets: readonly string[]): void {
		this.#filters = {...this.#filters, presets: new Set(presets)};
	}

	setUnit(unit: Unit): void {
		this.#filters = {...this.#filters, unit};
	}

	setDateRange(from: Date | null, to: Date | null): void {
		this.#filters = {...this.#filters, dateFrom: from, dateTo: to};
	}

	// -------------------------------------------------------------------------
	// Timeline View Setters
	// -------------------------------------------------------------------------

	setGranularity(granularity: Granularity): void {
		this.#timelineConfig = {...this.#timelineConfig, granularity};
	}

	setTimeSplit(splitBy: SplitBy): void {
		this.#timelineConfig = {...this.#timelineConfig, splitBy};
	}

	setUseChartGrid(useChartGrid: boolean): void {
		this.#timelineConfig = {...this.#timelineConfig, useChartGrid};
	}

	setMovingAverageDays(days: number): void {
		const clamped = Math.max(0, Math.min(30, days));
		this.#timelineConfig = {
			...this.#timelineConfig,
			movingAverageDays: clamped,
		};
	}

	setStatisticalOverlays(
		showMean: boolean,
		showStdDev: boolean,
		showLinearTrend: boolean,
	): void {
		this.#timelineConfig = {
			...this.#timelineConfig,
			showMean,
			showStdDev,
			showLinearTrend,
		};
	}

	// -------------------------------------------------------------------------
	// Comparison View Setters
	// -------------------------------------------------------------------------

	setComparisonStrategy(strategy: 'period' | 'grid'): void {
		this.#comparisonConfig = {...this.#comparisonConfig, strategy};
	}

	/**
	 * Adds a fully-specified comparison period to the active series constructor.
	 *
	 * @param period - Complete period definition (id, label, bounds, color).
	 */
	addComparisonPeriod(period: ComparisonPeriod): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			periods: [...this.#comparisonConfig.periods, period],
		};
	}

	/**
	 * Convenience helper (§5.2, Phase 5b): adds a comparison period from date
	 * bounds, auto-generating a stable id, a readable label, and a default
	 * color. The color is left empty so the compiler assigns from the palette
	 * when the caller provides none.
	 *
	 * @param from - Inclusive start of the comparison period.
	 * @param to - Inclusive end of the comparison period.
	 * @param color - Optional explicit series color (hex).
	 */
	addComparisonPeriodRange(from: Date, to: Date, color?: string): void {
		const label = `${format(from, 'MMM d')} – ${format(to, 'MMM d, yyyy')}`;
		const period: ComparisonPeriod = {
			id: `period-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			label,
			dateFrom: from,
			dateTo: to,
			color: color ?? '',
		};
		this.addComparisonPeriod(period);
	}

	removeComparisonPeriod(id: string): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			periods: this.#comparisonConfig.periods.filter(p => p.id !== id),
		};
	}

	/**
	 * Replaces an existing comparison period in place, preserving its position
	 * in the series list. Used by the color picker / period editor.
	 *
	 * @param id - Id of the period to update.
	 * @param updates - Partial fields to merge into the period.
	 */
	updateComparisonPeriod(
		id: string,
		updates: Partial<Omit<ComparisonPeriod, 'id'>>,
	): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			periods: this.#comparisonConfig.periods.map(p =>
				p.id === id ? {...p, ...updates} : p,
			),
		};
	}

	setLockYAxis(lockYAxis: boolean): void {
		this.#comparisonConfig = {...this.#comparisonConfig, lockYAxis};
	}

	setXAxisAlignment(alignment: 'calendar' | 'elapsed'): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			xAxisAlignment: alignment,
		};
	}

	// -------------------------------------------------------------------------
	// Distribution View Setters
	// -------------------------------------------------------------------------

	setDistributionCategory(category: DistributionCategory): void {
		this.#distributionConfig = {...this.#distributionConfig, category};
	}

	setDistributionStyle(chartStyle: DistributionChartStyle): void {
		this.#distributionConfig = {...this.#distributionConfig, chartStyle};
	}

	setDistributionMetric(metric: DistributionMetric): void {
		this.#distributionConfig = {...this.#distributionConfig, metric};
	}

	/**
	 * Sets the temporal grouping granularity for the Day-of-Week heatmap
	 * matrix rows and the stacked-bar breakdown segments (§5.3).
	 *
	 * @param temporalGrouping - Week/Month/Quarter/Season/Year.
	 */
	setTemporalGrouping(temporalGrouping: DistributionTemporalGrouping): void {
		this.#distributionConfig = {...this.#distributionConfig, temporalGrouping};
	}

	/**
	 * Sets whether the Activity & Preset breakdown groups by activity or
	 * preset (§5.3).
	 *
	 * @param breakdownMode - 'activity' | 'preset'.
	 */
	setBreakdownMode(breakdownMode: BreakdownMode): void {
		this.#distributionConfig = {...this.#distributionConfig, breakdownMode};
	}

	setThresholdMinutes(thresholdMinutes: number): void {
		this.#distributionConfig = {
			...this.#distributionConfig,
			thresholdMinutes: Math.max(0, thresholdMinutes),
		};
	}
}

/** Singleton PracticeDataEngine instance. */
export const engine = new PracticeDataEngine();
