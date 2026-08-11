<script lang="ts">
	import { engine, computeTimeWindowDateRange } from '$lib';
	import type { Granularity, SplitBy, TimeWindowPreset } from '$lib';
	import { format } from 'date-fns';
	import Info from '@lucide/svelte/icons/info';
	import Tooltip from './Tooltip.svelte';

	const TIME_WINDOW_OPTIONS: { value: TimeWindowPreset; label: string }[] = [
		{ value: '3M', label: 'Last 3 Months' },
		{ value: '6M', label: 'Last 6 Months' },
		{ value: '1Y', label: 'Last Year' },
		{ value: 'YTD', label: 'Year to Date' },
		{ value: 'All', label: 'All Time' },
		{ value: 'Custom', label: 'Custom Range' }
	];

	const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
		{ value: 'day', label: 'Day' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' },
		{ value: 'quarter', label: 'Quarter' },
		{ value: 'season', label: 'Season' },
		{ value: 'year', label: 'Year' }
	];

	const SPLIT_OPTIONS: { value: SplitBy; label: string }[] = [
		{ value: 'none', label: 'No Split' },
		{ value: 'week', label: 'Week' },
		{ value: 'month', label: 'Month' },
		{ value: 'quarter', label: 'Quarter' },
		{ value: 'season', label: 'Season' },
		{ value: 'year', label: 'Year' }
	];

	// Local control state, initialized from the engine's current config.
	let timePreset = $state<TimeWindowPreset>(engine.timelineConfig.timePreset);
	let granularity = $state<Granularity>(engine.timelineConfig.granularity);
	let splitBy = $state<SplitBy>(engine.timelineConfig.splitBy);
	let useChartGrid = $state<boolean>(engine.timelineConfig.useChartGrid);
	let movingAverageDays = $state<number>(engine.timelineConfig.movingAverageDays);
	let showMean = $state<boolean>(engine.timelineConfig.showMean);
	let showStdDev = $state<boolean>(engine.timelineConfig.showStdDev);
	let showLinearTrend = $state<boolean>(engine.timelineConfig.showLinearTrend);
	let customFrom = $state('');
	let customTo = $state('');

	const isCustom = $derived(timePreset === 'Custom');

	function selectPreset(value: TimeWindowPreset) {
		timePreset = value;
		if (value === 'Custom') return;
		const [from, to] = computeTimeWindowDateRange(value, engine.filteredSessions);
		// Store computed bounds locally so Apply can send them to the engine.
		engine.setDateRange(from, to);
	}

	function applyControls() {
		engine.setTimePreset(timePreset);
		engine.setGranularity(granularity);
		engine.setTimeSplit(splitBy);
		engine.setUseChartGrid(useChartGrid);
		engine.setMovingAverageDays(movingAverageDays);
		engine.setStatisticalOverlays(showMean, showStdDev, showLinearTrend);

		if (isCustom) {
			const from = customFrom ? new Date(customFrom) : null;
			const to = customTo ? new Date(customTo) : null;
			engine.setDateRange(from, to);
		}
	}

	// Format a preset's resolved range for display in the button area.
	function formatRangeLabel(preset: TimeWindowPreset): string {
		if (preset === 'Custom') return '';
		const [from, to] = computeTimeWindowDateRange(preset, engine.filteredSessions);
		if (from === null || to === null) return '';
		return `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
	}

	const rangeLabel = $derived(formatRangeLabel(timePreset));
</script>

<section aria-labelledby="timelineControlsTitle" class="border border-[#E5E5E5] bg-white rounded-md p-3 space-y-3">
	<h3 id="timelineControlsTitle" class="text-sm font-semibold text-[#1C1C1C]">Timeline Controls</h3>

	<!-- Time Window -->
	<div>
		<label for="timeWindowSelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Time Window
			<Tooltip for="timeWindow" />
		</label>
		<select
			id="timeWindowSelect"
			bind:value={timePreset}
			onchange={() => selectPreset(timePreset)}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each TIME_WINDOW_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if !isCustom && rangeLabel}
			<p class="mt-1 text-xs text-[#6E6E6E]">{rangeLabel}</p>
		{/if}
	</div>

	{#if isCustom}
		<div class="flex space-x-px">
			<div class="flex-1">
				<label for="timelineFrom" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
					From
					<Tooltip for="timelineFrom" />
				</label>
				<input id="timelineFrom" type="date" bind:value={customFrom} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
			</div>
			<div class="flex-1">
				<label for="timelineTo" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
					To
					<Tooltip for="timelineTo" />
				</label>
				<input id="timelineTo" type="date" bind:value={customTo} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
			</div>
		</div>
	{/if}

	<!-- Time Aggregation -->
	<div>
		<label for="granularitySelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Aggregate By
			<Tooltip for="granularity" />
		</label>
		<select
			id="granularitySelect"
			bind:value={granularity}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each GRANULARITY_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	{#if granularity === 'season' || splitBy === 'season'}
		<p class="flex items-start gap-1.5 rounded-md bg-amber-100 px-2.5 py-2 text-xs text-[#B45309]">
			<Info class="w-4 h-4 shrink-0 text-[#B45309]" aria-hidden="true" />
			<span>Seasonal years run Dec 22 – Dec 21. Sessions attributed to Start Time.</span>
		</p>
	{/if}

	<!-- Time Split -->
	<div>
		<label for="splitBySelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Time Split
			<Tooltip for="splitBy" />
		</label>
		<select
			id="splitBySelect"
			bind:value={splitBy}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each SPLIT_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if splitBy !== 'none'}
			<label class="mt-1.5 flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
				<input
					type="checkbox"
					bind:checked={useChartGrid}
					class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40"
				/>
				Show as separate chart cards
			</label>
		{/if}
	</div>

	<!-- Smoothing -->
	<div>
		<div class="flex items-center justify-between mb-1">
			<label for="movingAvgSlider" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C]">
				Moving Average
				<Tooltip for="movingAverage" />
			</label>
			<span class="text-xs text-[#6E6E6E]">{movingAverageDays} days</span>
		</div>
		<input
			id="movingAvgSlider"
			type="range"
			min="0"
			max="30"
			step="1"
			bind:value={movingAverageDays}
			class="w-full accent-emerald-500"
		/>
	</div>

	<!-- Statistical Overlays -->
	<fieldset class="space-y-1.5">
		<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Statistical Overlays
			<Tooltip for="statisticalOverlays" />
		</legend>
		<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
			<input type="checkbox" bind:checked={showMean} class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40" />
			Mean (μ)
		</label>
		<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
			<input type="checkbox" bind:checked={showStdDev} class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40" />
			±1 Std Dev (σ)
		</label>
		<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
			<input type="checkbox" bind:checked={showLinearTrend} class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40" />
			Linear Trendline
		</label>
	</fieldset>

	<button
		type="button"
		onclick={applyControls}
		class="mt-1 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
	>
		Apply Timeline
	</button>
</section>
