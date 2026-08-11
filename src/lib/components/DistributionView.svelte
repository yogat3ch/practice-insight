<script lang="ts">
    import { engine } from '$lib';
    import { echartAction, exportPNG, exportSVG } from '$lib/echarts/echartAction';
    import type { EChartsOption } from 'echarts';

    let chartDiv = $state<HTMLDivElement>();
    const option: EChartsOption = $derived.by(() => engine.distributionOption);
    const hasData = $derived(engine.hasData);

    function downloadPNG() {
        if (chartDiv) exportPNG(chartDiv, `distribution-${Date.now()}.png`);
    }
    function downloadSVG() {
        if (chartDiv) exportSVG(chartDiv, `distribution-${Date.now()}.svg`);
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex justify-end space-x-2 p-2">
        <button onclick={downloadPNG} title="Export chart as PNG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">PNG</button>
        <button onclick={downloadSVG} title="Export chart as SVG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">SVG</button>
    </div>
    {#if hasData}
        <div bind:this={chartDiv} use:echartAction={{ option }} role="img" aria-label="Distribution chart of practice volume by category, style, and metric" class="flex-1 w-full h-full min-h-100 border border-[#E5E7EB] rounded"></div>
    {:else}
        <div class="flex-1 w-full min-h-100 border border-[#E5E7EB] rounded flex items-center justify-center">
            <p class="text-sm text-[#6E6E6E]">No data loaded. Import a CSV to see distribution charts.</p>
        </div>
    {/if}
</div>
