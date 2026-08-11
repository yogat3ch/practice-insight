<script lang="ts">
	import {echartAction, exportPNG, exportSVG} from '$lib/echarts/echartAction';
	import type {EChartsOption} from 'echarts';

	interface Props {
		option: EChartsOption;
		label: string;
	}

	let {option, label}: Props = $props();

	let chartDiv: HTMLDivElement;

	function downloadPNG(): void {
		exportPNG(chartDiv, `comparison-${label}-${Date.now()}.png`);
	}

	function downloadSVG(): void {
		exportSVG(chartDiv, `comparison-${label}-${Date.now()}.svg`);
	}
</script>

<div
	class="flex flex-col border border-[#E5E7EB] rounded-md overflow-hidden bg-white"
>
	<div
		class="flex items-center justify-between border-b border-[#E5E5E5] px-2 py-1"
	>
		<h4 class="text-xs font-semibold text-[#1C1C1C] truncate">{label}</h4>
		<div class="flex space-x-1">
			<button
				onclick={downloadPNG}
				title={`Export ${label} chart as PNG`}
				class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
			>
				PNG
			</button>
			<button
				onclick={downloadSVG}
				title={`Export ${label} chart as SVG`}
				class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
			>
				SVG
			</button>
		</div>
	</div>
	<div
		bind:this={chartDiv}
		use:echartAction={{option}}
		role="img"
		aria-label={`Comparison chart for ${label}`}
		class="w-full min-h-80 h-80"
	></div>
</div>
