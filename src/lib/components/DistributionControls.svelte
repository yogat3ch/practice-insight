<script lang="ts">
	import { engine } from '$lib';
	import type {
		BreakdownMode,
		DistributionCategory,
		DistributionChartStyle,
		DistributionMetric,
		DistributionTemporalGrouping
	} from '$lib';
	import Tooltip from './Tooltip.svelte';

	/** Category selector options per §5.3. */
	const CATEGORY_OPTIONS: { value: DistributionCategory; label: string }[] = [
		{ value: 'dayOfWeek', label: 'Day-of-Week Distribution' },
		{ value: 'timeOfDay', label: 'Time-of-Day Practice Windows' },
		{ value: 'breakdown', label: 'Activity & Preset Breakdown' }
	];

	/** Context-dependent chart style options per §5.3. */
	const STYLE_OPTIONS: Record<
		DistributionCategory,
		{ value: DistributionChartStyle; label: string }[]
	> = {
		dayOfWeek: [
			{ value: 'heatmap', label: 'Heatmap Matrix' },
			{ value: 'bar', label: 'Bar Chart' }
		],
		timeOfDay: [
			{ value: 'polar', label: 'Polar Clock (24h)' },
			{ value: 'histogram', label: 'Hourly Histogram' }
		],
		breakdown: [
			{ value: 'donut', label: 'Donut Chart' },
			{ value: 'stackedBar', label: 'Stacked Bar' }
		]
	};

	/** Temporal grouping options per §5.3. */
	const GROUPING_OPTIONS: { value: DistributionTemporalGrouping; label: string }[] = [
		{ value: 'week', label: 'By Week' },
		{ value: 'month', label: 'By Month' },
		{ value: 'quarter', label: 'By Quarter' },
		{ value: 'season', label: 'By Season' },
		{ value: 'year', label: 'By Year' }
	];

	/** Metric calculation options per §5.3. */
	const METRIC_OPTIONS: { value: DistributionMetric; label: string }[] = [
		{ value: 'totalDuration', label: 'Total Duration' },
		{ value: 'sessionCount', label: 'Session Count' },
		{ value: 'averageDuration', label: 'Average Session Length' }
	];

	/** Breakdown grouping mode (Activity vs Preset). */
	const BREAKDOWN_MODE_OPTIONS: { value: BreakdownMode; label: string }[] = [
		{ value: 'activity', label: 'By Activity' },
		{ value: 'preset', label: 'By Preset' }
	];

	// Local control state, initialized from the engine's current config.
	let category = $state<DistributionCategory>(engine.distributionConfig.category);
	let chartStyle = $state<DistributionChartStyle>(engine.distributionConfig.chartStyle);
	let temporalGrouping = $state<DistributionTemporalGrouping>(
		engine.distributionConfig.temporalGrouping
	);
	let metric = $state<DistributionMetric>(engine.distributionConfig.metric);
	let thresholdMinutes = $state<number>(engine.distributionConfig.thresholdMinutes);
	let breakdownMode = $state<BreakdownMode>(engine.distributionConfig.breakdownMode);

	/** Style options for the currently selected category. */
	const currentStyles = $derived(STYLE_OPTIONS[category]);

	/**
	 * When the category changes, the selected chart style may no longer be
	 * valid for the new category. Reset it to the first option of the new
	 * category so the chart always matches the context-dependent style list.
	 */
	function selectCategory(value: DistributionCategory) {
		category = value;
		chartStyle = STYLE_OPTIONS[value][0].value;
	}

	function applyControls(): void {
		engine.setDistributionCategory(category);
		engine.setDistributionStyle(chartStyle);
		engine.setTemporalGrouping(temporalGrouping);
		engine.setDistributionMetric(metric);
		engine.setThresholdMinutes(thresholdMinutes);
		engine.setBreakdownMode(breakdownMode);
	}
</script>

<section aria-labelledby="distributionControlsTitle" class="border border-[#E5E5E5] bg-white rounded-md p-3 space-y-3">
	<h3 id="distributionControlsTitle" class="text-sm font-semibold text-[#1C1C1C]">Distribution Controls</h3>

	<!-- Category Selector -->
	<div>
		<label for="categorySelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Category
			<Tooltip for="category" />
		</label>
		<select
			id="categorySelect"
			value={category}
			onchange={(e) => selectCategory((e.currentTarget as HTMLSelectElement).value as DistributionCategory)}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none"
		>
			{#each CATEGORY_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<!-- Chart Style (context-dependent) -->
	<fieldset>
		<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Chart Style
			<Tooltip for="chartStyle" />
		</legend>
		<div class="space-y-1.5">
			{#each currentStyles as opt}
				<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
					<input
						type="radio"
						name="distributionChartStyle"
						value={opt.value}
						checked={chartStyle === opt.value}
						onchange={() => (chartStyle = opt.value)}
						class="w-4 h-4 text-[#EAA845] focus:ring-[#EAA845]/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Breakdown Mode (only for Activity & Preset Breakdown category) -->
	{#if category === 'breakdown'}
		<fieldset>
			<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
				Breakdown By
				<Tooltip for="breakdownMode" />
			</legend>
			<div class="space-y-1.5">
				{#each BREAKDOWN_MODE_OPTIONS as opt}
					<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
						<input
							type="radio"
							name="breakdownMode"
							value={opt.value}
							checked={breakdownMode === opt.value}
							onchange={() => (breakdownMode = opt.value)}
							class="w-4 h-4 text-[#EAA845] focus:ring-[#EAA845]/40 focus:outline-none"
						/>
						{opt.label}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}

	<!-- Temporal Grouping -->
	<div>
		<label for="temporalGroupingSelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Temporal Grouping
			<Tooltip for="temporalGrouping" />
		</label>
		<select
			id="temporalGroupingSelect"
			bind:value={temporalGrouping}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none"
		>
			{#each GROUPING_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if category === 'dayOfWeek' && chartStyle === 'heatmap'}
			<p class="mt-1 text-xs text-[#6E6E6E]">Groups the heatmap matrix into rows by time period.</p>
		{:else if category === 'breakdown' && chartStyle === 'stackedBar'}
			<p class="mt-1 text-xs text-[#6E6E6E]">Shows how the activity/preset mix shifts across time periods.</p>
		{/if}
	</div>

	<!-- Metric Calculation -->
	<fieldset>
		<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Metric
			<Tooltip for="metric" />
		</legend>
		<div class="space-y-1.5">
			{#each METRIC_OPTIONS as opt}
				<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
					<input
						type="radio"
						name="distributionMetric"
						value={opt.value}
						checked={metric === opt.value}
						onchange={() => (metric = opt.value)}
						class="w-4 h-4 text-[#EAA845] focus:ring-[#EAA845]/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Threshold Filter -->
	<div>
		<label for="thresholdInput" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Threshold Filter
			<Tooltip for="threshold" />
		</label>
		<input
			id="thresholdInput"
			type="number"
			min="0"
			step="1"
			bind:value={thresholdMinutes}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none"
			placeholder="0"
		/>
		<p class="mt-1 text-xs text-[#6E6E6E]">Ignore sessions shorter than this many minutes.</p>
	</div>

	<button
		type="button"
		onclick={applyControls}
		class="mt-1 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
	>
		Apply Distribution
	</button>
</section>
