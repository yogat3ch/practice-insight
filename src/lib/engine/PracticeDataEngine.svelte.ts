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

import type { EChartsOption } from 'echarts';
import {
	DEFAULT_COMPARISON_CONFIG,
	DEFAULT_DISTRIBUTION_CONFIG,
	DEFAULT_TIMELINE_CONFIG,
	type ComparisonConfig,
	type ComparisonPeriod,
	type DistributionCategory,
	type DistributionChartStyle,
	type DistributionConfig,
	type DistributionMetric,
	type TabId,
	type TimelineConfig,
	type TimeWindowPreset
} from '../types/engine.js';
import {
	DEFAULT_FILTERS,
	type ActiveFilters,
	type Granularity,
	type Unit
} from '../types/filters.js';
import type { SessionEntry, WorkerResult } from '../types/session.js';
import type { TimeBucket } from '../types/temporal.js';
import { aggregateTimelineBuckets, convertValue } from './aggregators.js';
import {
	compileComparisonOption,
	type ComparisonSeriesData
} from './compilers/comparison-compiler.js';
import {
	compileCategoryBreakdownOption,
	compileDayOfWeekOption,
	compileTimeOfDayOption
} from './compilers/distribution-compiler.js';
import { compileTimelineOption } from './compilers/timeline-compiler.js';
import {
	computeCategoryBreakdown,
	computeDayOfWeekDistribution,
	computeTimeOfDayDistribution,
	type CategoryBreakdownItem,
	type DayOfWeekBin,
	type TimeOfDayBin
} from './distribution.js';
import {
	computeLinearRegression,
	computeMean,
	computeStandardDeviation,
	computeSymmetricMovingAverage,
	type LinearRegressionResult
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
	#filters = $state<ActiveFilters>({ ...DEFAULT_FILTERS });

	/** Active main visualization tab. */
	#activeTab = $state<TabId>('timeline');

	/** Tab 1 Timeline parameters. */
	#timelineConfig = $state<TimelineConfig>({ ...DEFAULT_TIMELINE_CONFIG });

	/** Tab 2 Comparison parameters. */
	#comparisonConfig = $state<ComparisonConfig>({ ...DEFAULT_COMPARISON_CONFIG });

	/** Tab 3 Distribution parameters. */
	#distributionConfig = $state<DistributionConfig>({ ...DEFAULT_DISTRIBUTION_CONFIG });

	// -------------------------------------------------------------------------
	// Derived Working Set ($derived)
	// -------------------------------------------------------------------------

	/** Filtered session array matching active activity, preset, and date range bounds. */
	get filteredSessions(): SessionEntry[] {
		return this.#sessions.filter((session) => {
			const { activities, presets, dateFrom, dateTo } = this.#filters;
			if (activities.size > 0 && !activities.has(session.activity)) return false;
			if (presets.size > 0 && !presets.has(session.preset)) return false;
			if (dateFrom !== null && session.startedAt < dateFrom) return false;
			if (dateTo !== null && session.startedAt > dateTo) return false;
			return true;
		});
	}

	/** Unique, sorted activity strings present in the dataset. */
	get availableActivities(): string[] {
		return Array.from(new Set(this.#sessions.map((s) => s.activity)))
			.filter(Boolean)
			.sort();
	}

	/** Unique, sorted preset names (excludes "(No Preset)"). */
	get availablePresets(): string[] {
		return Array.from(
			new Set(this.#sessions.map((s) => s.preset).filter((p) => p !== '(No Preset)'))
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
			this.#filters.dateTo
		);
	}

	/** Scalar numeric array corresponding to timeline buckets. */
	get timelineValues(): number[] {
		return this.timelineBuckets.map((b) => convertValue(b.totalSeconds, this.#filters.unit));
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
			this.#timelineConfig.movingAverageDays
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
			movingAverageDays: this.#timelineConfig.movingAverageDays
		});
	}

	// -------------------------------------------------------------------------
	// Tab 2: Comparison Derivations ($derived)
	// -------------------------------------------------------------------------

	/** Multi-period series list for Comparison mode. */
	get comparisonSeriesList(): ComparisonSeriesData[] {
		return this.#comparisonConfig.periods.map((period) => {
			const periodSessions = this.filteredSessions.filter(
				(s) => s.startedAt >= period.dateFrom && s.startedAt <= period.dateTo
			);
			const buckets = aggregateTimelineBuckets(
				periodSessions,
				this.#timelineConfig.granularity,
				this.#filters.unit,
				period.dateFrom,
				period.dateTo
			);
			return { id: period.id, label: period.label, color: period.color, buckets };
		});
	}

	/** Declarative ECharts option JSON payload for Tab 2. */
	get comparisonOption(): EChartsOption {
		return compileComparisonOption({
			seriesList: this.comparisonSeriesList,
			unit: this.#filters.unit,
			lockYAxis: this.#comparisonConfig.lockYAxis,
			xAxisAlignment: this.#comparisonConfig.xAxisAlignment
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
			this.#distributionConfig.thresholdMinutes
		);
	}

	/** 24-bin Time-of-Day hourly start-time density calculation. */
	get timeOfDayBins(): TimeOfDayBin[] {
		return computeTimeOfDayDistribution(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.thresholdMinutes
		);
	}

	/** Category share breakdown (Activity or Preset). */
	get categoryBreakdownItems(): CategoryBreakdownItem[] {
		return computeCategoryBreakdown(
			this.filteredSessions,
			this.#filters.unit,
			this.#distributionConfig.category === 'breakdown' ? 'activity' : 'preset',
			this.#distributionConfig.thresholdMinutes
		);
	}

	/** Declarative ECharts option JSON payload for Tab 3. */
	get distributionOption(): EChartsOption {
		const { category, chartStyle } = this.#distributionConfig;
		if (category === 'dayOfWeek') {
			const style = chartStyle === 'heatmap' ? 'heatmap' : 'bar';
			return compileDayOfWeekOption(this.dayOfWeekBins, this.#filters.unit, style);
		}
		if (category === 'timeOfDay') {
			const style = chartStyle === 'polar' ? 'polar' : 'histogram';
			return compileTimeOfDayOption(this.timeOfDayBins, this.#filters.unit, style);
		}
		const style = chartStyle === 'stackedBar' ? 'stackedBar' : 'donut';
		return compileCategoryBreakdownOption(this.categoryBreakdownItems, this.#filters.unit, style);
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
		this.#filters = { ...DEFAULT_FILTERS };
	}

	/** Clears all raw data and resets all view controls to default. */
	clearData(): void {
		this.#sessions = [];
		this.#skippedCount = 0;
		this.#filters = { ...DEFAULT_FILTERS };
		this.#timelineConfig = { ...DEFAULT_TIMELINE_CONFIG };
		this.#comparisonConfig = { ...DEFAULT_COMPARISON_CONFIG };
		this.#distributionConfig = { ...DEFAULT_DISTRIBUTION_CONFIG };
	}

	// -------------------------------------------------------------------------
	// Global Control Setters
	// -------------------------------------------------------------------------

	setTab(tab: TabId): void {
		this.#activeTab = tab;
	}

	setActivityFilter(activities: readonly string[]): void {
		this.#filters = { ...this.#filters, activities: new Set(activities) };
	}

	setPresetFilter(presets: readonly string[]): void {
		this.#filters = { ...this.#filters, presets: new Set(presets) };
	}

	setUnit(unit: Unit): void {
		this.#filters = { ...this.#filters, unit };
	}

	setDateRange(from: Date | null, to: Date | null): void {
		this.#filters = { ...this.#filters, dateFrom: from, dateTo: to };
	}

	// -------------------------------------------------------------------------
	// Timeline View Setters
	// -------------------------------------------------------------------------

	setTimePreset(preset: TimeWindowPreset): void {
		this.#timelineConfig = { ...this.#timelineConfig, timePreset: preset };
	}

	setGranularity(granularity: Granularity): void {
		this.#timelineConfig = { ...this.#timelineConfig, granularity };
	}

	setMovingAverageDays(days: number): void {
		const clamped = Math.max(0, Math.min(30, days));
		this.#timelineConfig = { ...this.#timelineConfig, movingAverageDays: clamped };
	}

	setStatisticalOverlays(showMean: boolean, showStdDev: boolean, showLinearTrend: boolean): void {
		this.#timelineConfig = {
			...this.#timelineConfig,
			showMean,
			showStdDev,
			showLinearTrend
		};
	}

	// -------------------------------------------------------------------------
	// Comparison View Setters
	// -------------------------------------------------------------------------

	setComparisonStrategy(strategy: 'period' | 'grid'): void {
		this.#comparisonConfig = { ...this.#comparisonConfig, strategy };
	}

	addComparisonPeriod(period: ComparisonPeriod): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			periods: [...this.#comparisonConfig.periods, period]
		};
	}

	removeComparisonPeriod(id: string): void {
		this.#comparisonConfig = {
			...this.#comparisonConfig,
			periods: this.#comparisonConfig.periods.filter((p) => p.id !== id)
		};
	}

	setLockYAxis(lockYAxis: boolean): void {
		this.#comparisonConfig = { ...this.#comparisonConfig, lockYAxis };
	}

	setXAxisAlignment(alignment: 'calendar' | 'elapsed'): void {
		this.#comparisonConfig = { ...this.#comparisonConfig, xAxisAlignment: alignment };
	}

	// -------------------------------------------------------------------------
	// Distribution View Setters
	// -------------------------------------------------------------------------

	setDistributionCategory(category: DistributionCategory): void {
		this.#distributionConfig = { ...this.#distributionConfig, category };
	}

	setDistributionStyle(chartStyle: DistributionChartStyle): void {
		this.#distributionConfig = { ...this.#distributionConfig, chartStyle };
	}

	setDistributionMetric(metric: DistributionMetric): void {
		this.#distributionConfig = { ...this.#distributionConfig, metric };
	}

	setThresholdMinutes(thresholdMinutes: number): void {
		this.#distributionConfig = {
			...this.#distributionConfig,
			thresholdMinutes: Math.max(0, thresholdMinutes)
		};
	}
}

/** Singleton PracticeDataEngine instance. */
export const engine = new PracticeDataEngine();
