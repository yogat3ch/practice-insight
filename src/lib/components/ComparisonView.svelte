<script lang="ts">
    import { engine } from '$lib';
    import { echartAction, exportPNG, exportSVG } from '$lib/echarts/echartAction';
    import ComparisonChartCard from './ComparisonChartCard.svelte';
    import type { EChartsOption } from 'echarts';

    // Strategy drives rendering: overlay (default) vs. side-by-side grid.
    const strategy = $derived(engine.comparisonConfig.strategy);
    const isGridMode = $derived(strategy === 'grid');

    // Single overlay chart option.
    const option: EChartsOption = $derived.by(() => engine.comparisonOption);
    // Per-period grid card options.
    const gridCards = $derived.by(() => engine.comparisonGridOptions);

    let chartDiv = $state<HTMLDivElement>();

    function downloadPNG() {
        if (chartDiv) exportPNG(chartDiv, `comparison-${Date.now()}.png`);
    }

    function downloadSVG() {
        if (chartDiv) exportSVG(chartDiv, `comparison-${Date.now()}.svg`);
    }
</script>

<div class="flex flex-col h-full p-2 space-y-3 overflow-y-auto">
    <div class="flex justify-end space-x-2">
        <button onclick={downloadPNG} title="Export chart as PNG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">PNG</button>
        <button onclick={downloadSVG} title="Export chart as SVG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">SVG</button>
    </div>

    {#if isGridMode}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each gridCards as card}
                <ComparisonChartCard option={card.option} label={card.period} />
            {/each}
        </div>
    {:else}
        <div bind:this={chartDiv} use:echartAction={{ option }} role="img" aria-label="Comparison chart of practice volume across selected periods" class="flex-1 w-full min-h-100 border border-[#E5E7EB] rounded"></div>
    {/if}
</div>
