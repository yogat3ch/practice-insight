<script lang="ts">
	import {engine} from '$lib';
	import {echartAction} from '$lib/echarts/echartAction';
	import type {EChartsOption} from 'echarts';
	import DistributionChartCard from './DistributionChartCard.svelte';
	import ExportControls from './ExportControls.svelte';

	let chartDiv = $state<HTMLDivElement>();
	const option: EChartsOption = $derived.by(() => engine.distributionOption);
	const hasData = $derived(engine.hasData);

	// Sequential Side-by-Side grid: per-period chart cards (7c).
	const gridCards = $derived.by(() => engine.distributionGridOptions);
	const isGridMode = $derived(
		engine.distributionConfig.distributionStrategy === 'grid' &&
			gridCards.length > 0,
	);
</script>

<div class="flex flex-col h-full">
	<div class="flex justify-end p-2">
		<ExportControls chartEl={chartDiv} prefix="distribution" />
	</div>
	{#if hasData}
		{#if isGridMode}
			<div class="flex-1 overflow-y-auto p-2 pt-0">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					{#each gridCards as card}
						<DistributionChartCard option={card.option} label={card.period} />
					{/each}
				</div>
			</div>
		{:else}
			<div
				bind:this={chartDiv}
				use:echartAction={{option}}
				role="img"
				aria-label="Distribution chart of practice volume by category, style, and metric"
				class="flex-1 w-full h-full min-h-100 border border-[#E5E7EB] rounded"
			></div>
		{/if}
	{:else}
		<div
			class="flex-1 w-full min-h-100 border border-[#E5E7EB] rounded flex items-center justify-center"
		>
			<p class="text-sm text-[#6E6E6E]">
				No data loaded. Import a CSV to see distribution charts.
			</p>
		</div>
	{/if}
</div>
