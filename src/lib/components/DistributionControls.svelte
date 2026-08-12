<script lang="ts">
	import type {
		BreakdownMode,
		DistributionCategory,
		DistributionChartStyle,
		DistributionComparisonStrategy,
		DistributionMetric,
		DistributionTemporalGrouping,
	} from '$lib';
	import {engine} from '$lib';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Tooltip from './Tooltip.svelte';

	/** Category selector options per §5.3. */
	const CATEGORY_OPTIONS: {value: DistributionCategory; label: string}[] = [
		{value: 'dayOfWeek', label: 'Day-of-Week Distribution'},
		{value: 'timeOfDay', label: 'Time-of-Day Practice Windows'},
		{value: 'breakdown', label: 'Activity & Preset Breakdown'},
	];

	/** Context-dependent chart style options per §5.3. */
	const STYLE_OPTIONS: Record<
		DistributionCategory,
		{value: DistributionChartStyle; label: string}[]
	> = {
		dayOfWeek: [
			{value: 'heatmap', label: 'Heatmap Matrix'},
			{value: 'bar', label: 'Bar Chart'},
		],
		timeOfDay: [
			{value: 'polar', label: 'Polar Clock (24h)'},
			{value: 'histogram', label: 'Hourly Histogram'},
		],
		breakdown: [
			{value: 'donut', label: 'Donut Chart'},
			{value: 'stackedBar', label: 'Stacked Bar'},
		],
	};

	/** Temporal grouping options per §5.3. */
	const GROUPING_OPTIONS: {
		value: DistributionTemporalGrouping;
		label: string;
	}[] = [
		{value: 'week', label: 'By Week'},
		{value: 'month', label: 'By Month'},
		{value: 'quarter', label: 'By Quarter'},
		{value: 'season', label: 'By Season'},
		{value: 'year', label: 'By Year'},
	];

	/** Distribution comparison strategy options (7c). */
	const STRATEGY_OPTIONS: {
		value: DistributionComparisonStrategy;
		label: string;
	}[] = [
		{value: 'period', label: 'Period-over-Period (Relative)'},
		{value: 'grid', label: 'Sequential Side-by-Side'},
	];

	/** Metric calculation options per §5.3. */
	const METRIC_OPTIONS: {value: DistributionMetric; label: string}[] = [
		{value: 'totalDuration', label: 'Total Duration'},
		{value: 'sessionCount', label: 'Session Count'},
		{value: 'averageDuration', label: 'Average Session Length'},
	];

	/** Breakdown grouping mode (Activity vs Preset). */
	const BREAKDOWN_MODE_OPTIONS: {value: BreakdownMode; label: string}[] = [
		{value: 'activity', label: 'By Activity'},
		{value: 'preset', label: 'By Preset'},
	];

	// Local control state, initialized from the engine's current config.
	let category = $state<DistributionCategory>(
		engine.distributionConfig.category,
	);
	let chartStyle = $state<DistributionChartStyle>(
		engine.distributionConfig.chartStyle,
	);
	let temporalGrouping = $state<DistributionTemporalGrouping>(
		engine.distributionConfig.temporalGrouping,
	);
	let distributionStrategy = $state<DistributionComparisonStrategy>(
		engine.distributionConfig.distributionStrategy,
	);
	let metric = $state<DistributionMetric>(engine.distributionConfig.metric);
	let thresholdMinutes = $state<number>(
		engine.distributionConfig.thresholdMinutes,
	);
	let breakdownMode = $state<BreakdownMode>(
		engine.distributionConfig.breakdownMode,
	);
	let showDayOfWeekLabels = $state<boolean>(
		engine.distributionConfig.showDayOfWeekLabels,
	);

	/** Whether to show the heatmap/strategy incompatibility warning (7c). */
	let showHeatmapStrategyWarning = $state(false);

	/** Whether to show the polar/overlay incompatibility warning (7c). */
	let showPolarStrategyWarning = $state(false);

	/** Style options for the currently selected category. */
	const currentStyles = $derived(STYLE_OPTIONS[category]);

	/** Whether the Distribution Comparison Strategy selector is relevant. */
	const showStrategySelector = $derived(
		(category === 'dayOfWeek' && chartStyle === 'bar') ||
			category === 'timeOfDay' ||
			(category === 'breakdown' && chartStyle === 'stackedBar'),
	);

	/**
	 * When the category changes, the selected chart style may no longer be
	 * valid for the new category. Reset it to the first option of the new
	 * category so the chart always matches the context-dependent style list.
	 */
	function selectCategory(value: DistributionCategory) {
		category = value;
		chartStyle = STYLE_OPTIONS[value][0].value;
	}

	/**
	 * Selecting the heatmap style while a variable comparison strategy is
	 * active is incompatible (the heatmap matrix already renders per-period
	 * rows). Show an ephemeral warning and reset the strategy to the default.
	 *
	 * Selecting the polar clock while the period-over-period overlay strategy
	 * is active is also incompatible (ECharts cannot overlay bars on a shared
	 * polar axis) — fall back to the grid strategy and notify.
	 */
	function selectStyle(value: DistributionChartStyle) {
		chartStyle = value;
		if (value === 'heatmap' && category === 'dayOfWeek') {
			showHeatmapStrategyWarning = true;
			distributionStrategy = 'period';
			setTimeout(() => {
				showHeatmapStrategyWarning = false;
			}, 4000);
		}
		if (value === 'polar' && category === 'timeOfDay') {
			showPolarStrategyWarning = true;
			distributionStrategy = 'grid';
			setTimeout(() => {
				showPolarStrategyWarning = false;
			}, 4000);
		}
	}

	function applyControls(): void {
		engine.setDistributionCategory(category);
		engine.setDistributionStyle(chartStyle);
		engine.setTemporalGrouping(temporalGrouping);
		engine.setDistributionStrategy(distributionStrategy);
		engine.setDistributionMetric(metric);
		engine.setThresholdMinutes(thresholdMinutes);
		engine.setBreakdownMode(breakdownMode);
		engine.setShowDayOfWeekLabels(showDayOfWeekLabels);
	}
</script>

<section
	aria-labelledby="distributionControlsTitle"
	class="border border-[#E5E5E5] bg-white rounded-md p-3 space-y-3"
>
	<h3
		id="distributionControlsTitle"
		class="text-sm font-semibold text-[#1C1C1C]"
	>
		Distribution Controls
	</h3>

	<!-- Category Selector -->
	<div>
		<label
			for="categorySelect"
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Category
			<Tooltip for="category" />
		</label>
		<select
			id="categorySelect"
			value={category}
			onchange={e =>
				selectCategory(
					(e.currentTarget as HTMLSelectElement).value as DistributionCategory,
				)}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each CATEGORY_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<!-- Chart Style (context-dependent) -->
	<fieldset>
		<legend
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Chart Style
			<Tooltip for="chartStyle" />
		</legend>
		<div class="space-y-1.5">
			{#each currentStyles as opt}
				<label
					class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
				>
					<input
						type="radio"
						name="distributionChartStyle"
						value={opt.value}
						checked={chartStyle === opt.value}
						onchange={() => selectStyle(opt.value)}
						class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Heatmap / Comparison Strategy incompatibility warning (7c, ephemeral) -->
	{#if showHeatmapStrategyWarning}
		<p
			class="flex items-start gap-1.5 rounded-md bg-amber-300 px-2.5 py-2 text-xs text-[#1C1C1C]"
		>
			<TriangleAlert
				class="w-4 h-4 shrink-0 text-orange-400"
				aria-hidden="true"
			/>
			<span>Heatmap is incompatible with variable Comparison Strategies</span>
		</p>
	{/if}

	<!-- Polar / Comparison Strategy incompatibility warning (7c, ephemeral) -->
	{#if showPolarStrategyWarning}
		<p
			class="flex items-start gap-1.5 rounded-md bg-amber-300 px-2.5 py-2 text-xs text-[#1C1C1C]"
		>
			<TriangleAlert
				class="w-4 h-4 shrink-0 text-orange-400"
				aria-hidden="true"
			/>
			<span
				>Polar charts can't overlay periods; switched to Sequential Side-by-Side</span
			>
		</p>
	{/if}

	<!-- Distribution Comparison Strategy (7c) -->
	{#if showStrategySelector}
		<fieldset>
			<legend
				class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
			>
				Comparison Strategy
				<Tooltip for="comparisonStrategy" />
			</legend>
			<div class="space-y-1.5">
				{#each STRATEGY_OPTIONS as opt}
					<label
						class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
					>
						<input
							type="radio"
							name="distributionStrategy"
							value={opt.value}
							checked={distributionStrategy === opt.value}
							onchange={() => (distributionStrategy = opt.value)}
							class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
						/>
						{opt.label}
					</label>
				{/each}
			</div>
			<p class="mt-1 text-xs text-[#6E6E6E]">
				How temporal-grouped periods are compared when Temporal Grouping is
				active.
			</p>
		</fieldset>
	{/if}

	<!-- Show Labels toggle (only for the Day-of-Week heatmap visualMap labels) -->
	{#if category === 'dayOfWeek' && chartStyle === 'heatmap'}
		<label
			class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
		>
			<input
				type="checkbox"
				bind:checked={showDayOfWeekLabels}
				class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40"
			/>
			Show value labels
		</label>
	{/if}

	<!-- Breakdown Mode (only for Activity & Preset Breakdown category) -->
	{#if category === 'breakdown'}
		<fieldset>
			<legend
				class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
			>
				Breakdown By
				<Tooltip for="breakdownMode" />
			</legend>
			<div class="space-y-1.5">
				{#each BREAKDOWN_MODE_OPTIONS as opt}
					<label
						class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
					>
						<input
							type="radio"
							name="breakdownMode"
							value={opt.value}
							checked={breakdownMode === opt.value}
							onchange={() => (breakdownMode = opt.value)}
							class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
						/>
						{opt.label}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}

	<!-- Seasonal Time Rule Note (shown when By Season is selected) -->
	{#if temporalGrouping === 'season'}
		<p
			class="flex items-start gap-1.5 rounded-md bg-blue-300 px-2.5 py-2 text-xs text-[#0C4A6E]"
		>
			<Info class="w-4 h-4 shrink-0 text-[#0C4A6E]" aria-hidden="true" />
			<span
				>Seasonal years run Dec 22 – Dec 21. Sessions attributed to Start Time.</span
			>
		</p>
	{/if}

	<!-- Temporal Grouping -->
	<div>
		<label
			for="temporalGroupingSelect"
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Temporal Grouping
			<Tooltip for="temporalGrouping" />
		</label>
		<select
			id="temporalGroupingSelect"
			bind:value={temporalGrouping}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each GROUPING_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if category === 'dayOfWeek' && chartStyle === 'heatmap'}
			<p class="mt-1 text-xs text-[#6E6E6E]">
				Groups the heatmap matrix into rows by time period.
			</p>
		{:else if category === 'breakdown' && chartStyle === 'stackedBar'}
			<p class="mt-1 text-xs text-[#6E6E6E]">
				Shows how the activity/preset mix shifts across time periods.
			</p>
		{/if}
	</div>

	<!-- Metric Calculation -->
	<fieldset>
		<legend
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Metric
			<Tooltip for="metric" />
		</legend>
		<div class="space-y-1.5">
			{#each METRIC_OPTIONS as opt}
				<label
					class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
				>
					<input
						type="radio"
						name="distributionMetric"
						value={opt.value}
						checked={metric === opt.value}
						onchange={() => (metric = opt.value)}
						class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Threshold Filter -->
	<div>
		<label
			for="thresholdInput"
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Threshold Filter
			<Tooltip for="threshold" />
		</label>
		<input
			id="thresholdInput"
			type="number"
			min="0"
			step="1"
			bind:value={thresholdMinutes}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
			placeholder="0"
		/>
		<p class="mt-1 text-xs text-[#6E6E6E]">
			Ignore sessions shorter than this many minutes.
		</p>
	</div>

	<button
		type="button"
		onclick={applyControls}
		class="mt-1 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
	>
		Apply Distribution
	</button>
</section>
