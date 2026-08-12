<script lang="ts">
	import {engine} from '$lib';
	import {echartAction} from '$lib/echarts/echartAction';
	import type {EChartsOption} from 'echarts';
	import ComparisonChartCard from './ComparisonChartCard.svelte';
	import ExportControls from './ExportControls.svelte';

	// Strategy drives rendering: overlay (default) vs. side-by-side grid.
	const strategy = $derived(engine.comparisonConfig.strategy);
	const isGridMode = $derived(strategy === 'grid');

	// Single overlay chart option.
	const option: EChartsOption = $derived.by(() => engine.comparisonOption);
	// Per-period grid card options.
	const gridCards = $derived.by(() => engine.comparisonGridOptions);

	let chartDiv = $state<HTMLDivElement>();
</script>

<div class="flex flex-col h-full p-2 space-y-3 overflow-y-auto">
	<div class="flex justify-end">
		<ExportControls chartEl={chartDiv} prefix="comparison" />
	</div>

	{#if isGridMode}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each gridCards as card}
				<ComparisonChartCard option={card.option} label={card.period} />
			{/each}
		</div>
	{:else}
		<div
			bind:this={chartDiv}
			use:echartAction={{option}}
			role="img"
			aria-label="Comparison chart of practice volume across selected periods"
			class="flex-1 w-full min-h-100 border border-[#E5E7EB] rounded"
		></div>
	{/if}
</div>
