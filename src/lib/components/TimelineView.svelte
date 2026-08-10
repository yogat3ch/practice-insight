<script lang="ts">
    import { engine } from '$lib';
    import { echartAction, exportPNG, exportSVG } from '$lib/echarts/echartAction';
    import type { EChartsOption } from 'echarts';

    let chartDiv: HTMLDivElement;
    // Reactive option derived from engine
    const option: EChartsOption = $derived.by(() => engine.timelineOption);

    function downloadPNG() {
        exportPNG(chartDiv, `timeline-${Date.now()}.png`);
    }

    function downloadSVG() {
        exportSVG(chartDiv, `timeline-${Date.now()}.svg`);
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex justify-end space-x-2 p-2">
        <button onclick={downloadPNG} title="Export chart as PNG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">PNG</button>
        <button onclick={downloadSVG} title="Export chart as SVG" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">SVG</button>
    </div>
    <div bind:this={chartDiv} use:echartAction={{ option }} role="img" aria-label="Timeline chart of practice volume over time" class="flex-1 w-full h-full min-h-100 border border-[#E5E7EB] rounded"></div>
</div>
