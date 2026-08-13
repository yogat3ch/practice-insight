<script lang="ts">
	import type {Granularity, SplitBy} from '$lib';
	import {engine, isSplitCoarserThanGranularity} from '$lib';
	import Info from '@lucide/svelte/icons/info';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Tooltip from './Tooltip.svelte';

	const GRANULARITY_OPTIONS: {value: Granularity; label: string}[] = [
		{value: 'day', label: 'Day'},
		{value: 'week', label: 'Week'},
		{value: 'month', label: 'Month'},
		{value: 'quarter', label: 'Quarter'},
		{value: 'season', label: 'Season'},
		{value: 'year', label: 'Year'},
	];

	const SPLIT_OPTIONS: {value: SplitBy; label: string}[] = [
		{value: 'none', label: 'No Split'},
		{value: 'week', label: 'Week'},
		{value: 'month', label: 'Month'},
		{value: 'quarter', label: 'Quarter'},
		{value: 'season', label: 'Season'},
		{value: 'year', label: 'Year'},
	];

	// Local control state, initialized from the engine's current config.
	let granularity = $state<Granularity>(engine.timelineConfig.granularity);
	let splitBy = $state<SplitBy>(engine.timelineConfig.splitBy);
	let useChartGrid = $state<boolean>(engine.timelineConfig.useChartGrid);
	let movingAverageDays = $state<number>(
		engine.timelineConfig.movingAverageDays,
	);
	let showMean = $state<boolean>(engine.timelineConfig.showMean);
	let showStdDev = $state<boolean>(engine.timelineConfig.showStdDev);
	let showLinearTrend = $state<boolean>(engine.timelineConfig.showLinearTrend);

	/**
	 * Time Split options valid for the currently selected Aggregate By —
	 * only intervals strictly coarser than the granularity, plus No Split.
	 */
	const availableSplitOptions = $derived(
		SPLIT_OPTIONS.filter(opt =>
			isSplitCoarserThanGranularity(opt.value, granularity),
		),
	);

	/**
	 * True when the current Time Split selection is finer than (or equal to)
	 * the Aggregate By granularity — the split cannot produce valid segments.
	 */
	const splitTooFine = $derived(
		splitBy !== 'none' && !isSplitCoarserThanGranularity(splitBy, granularity),
	);

	/**
	 * Reset an invalid Time Split selection to No Split before the options
	 * are filtered, and surface a warning explaining the reset.
	 */
	function selectGranularity(value: Granularity) {
		granularity = value;
		if (splitBy !== 'none' && !isSplitCoarserThanGranularity(splitBy, value)) {
			splitBy = 'none';
		}
	}

	function applyControls() {
		engine.setGranularity(granularity);
		engine.setTimeSplit(splitBy);
		engine.setUseChartGrid(useChartGrid);
		engine.setMovingAverageDays(movingAverageDays);
		engine.setStatisticalOverlays(showMean, showStdDev, showLinearTrend);
	}
</script>

<section
	aria-labelledby="timelineControlsTitle"
	class="border border-[#E5E5E5] bg-white rounded-md p-3 space-y-3"
>
	<h3 id="timelineControlsTitle" class="text-sm font-semibold text-[#1C1C1C]">
		Timeline Controls
	</h3>

	<!-- Time Aggregation -->
	<div>
		<label
			for="granularitySelect"
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Aggregate By
			<Tooltip for="granularity" />
		</label>
		<select
			id="granularitySelect"
			value={granularity}
			onchange={e =>
				selectGranularity(
					(e.currentTarget as HTMLSelectElement).value as Granularity,
				)}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each GRANULARITY_OPTIONS as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	{#if granularity === 'season' || splitBy === 'season'}
		<p
			class="flex items-start gap-1.5 rounded-md bg-blue-300 px-2.5 py-2 text-xs text-[#0C4A6E]"
		>
			<Info class="w-4 h-4 shrink-0 text-[#0C4A6E]" aria-hidden="true" />
			<span
				>Seasonal years run Dec 22 – Dec 21. Sessions attributed to Start Time.</span
			>
		</p>
	{/if}

	<!-- Time Split -->
	<div>
		<label
			for="splitBySelect"
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Time Split
			<Tooltip for="splitBy" />
		</label>
		<select
			id="splitBySelect"
			bind:value={splitBy}
			class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
		>
			{#each availableSplitOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
		{#if splitTooFine}
			<p
				class="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-300 px-2.5 py-2 text-xs text-orange-400"
			>
				<TriangleAlert
					class="w-4 h-4 shrink-0 text-orange-400"
					aria-hidden="true"
				/>
				<span
					>Time Split reset to No Split because selection was smaller than
					Aggregate By</span
				>
			</p>
		{/if}
		{#if splitBy !== 'none'}
			<label
				class="mt-1.5 flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
			>
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
			<label
				for="movingAvgSlider"
				class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C]"
			>
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
		<legend
			class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1"
		>
			Statistical Overlays
			<Tooltip for="statisticalOverlays" />
		</legend>
		<label
			class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
		>
			<input
				type="checkbox"
				bind:checked={showMean}
				class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40"
			/>
			Mean (μ)
		</label>
		<label
			class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
		>
			<input
				type="checkbox"
				bind:checked={showStdDev}
				class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40"
			/>
			±1 Std Dev (σ)
		</label>
		<label
			class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer"
		>
			<input
				type="checkbox"
				bind:checked={showLinearTrend}
				class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40"
			/>
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
