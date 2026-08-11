<script lang="ts">
	import {engine} from '$lib';
	import {echartAction} from '$lib/echarts/echartAction';
	import ExportControls from './ExportControls.svelte';
	import TimelineChartCard from './TimelineChartCard.svelte';
	import type {EChartsOption} from 'echarts';

	// Reactive segmented options derived from the engine.
	const timelineSegments = $derived.by(() => engine.timelineOptionsBySegment);
	const isGridMode = $derived(
		engine.timelineConfig.splitBy !== 'none' &&
			engine.timelineConfig.useChartGrid,
	);

	let chartDiv = $state<HTMLDivElement>();
	// Single-chart (non-grid) option — the first (and usually only) segment.
	const option: EChartsOption = $derived.by(
		() => timelineSegments[0]?.option ?? {},
	);
</script>

<div class="flex flex-col h-full p-2 space-y-3 overflow-y-auto">
	<div class="flex justify-end">
		<ExportControls chartEl={chartDiv} prefix="timeline" />
	</div>

	{#if isGridMode && timelineSegments.length > 1}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each timelineSegments as segment}
				<TimelineChartCard option={segment.option} label={segment.segment} />
			{/each}
		</div>
	{:else}
		<div
			bind:this={chartDiv}
			use:echartAction={{option}}
			role="img"
			aria-label="Timeline chart of practice volume over time"
			class="flex-1 w-full min-h-100 border border-[#E5E7EB] rounded"
		></div>
	{/if}
</div>
