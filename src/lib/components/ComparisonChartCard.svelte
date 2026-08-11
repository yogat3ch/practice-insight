<script lang="ts">
	import {echartAction} from '$lib/echarts/echartAction';
	import ExportControls from './ExportControls.svelte';
	import type {EChartsOption} from 'echarts';

	interface Props {
		option: EChartsOption;
		label: string;
	}

	let {option, label}: Props = $props();

	let chartDiv = $state<HTMLDivElement>();
</script>

<div
	class="flex flex-col border border-[#E5E7EB] rounded-md overflow-hidden bg-white"
>
	<div
		class="flex items-center justify-between border-b border-[#E5E5E5] px-2 py-1"
	>
		<h4 class="text-xs font-semibold text-[#1C1C1C] truncate">{label}</h4>
		<ExportControls chartEl={chartDiv} prefix="comparison" {label} size="sm" />
	</div>
	<div
		bind:this={chartDiv}
		use:echartAction={{option}}
		role="img"
		aria-label={`Comparison chart for ${label}`}
		class="w-full min-h-80 h-80"
	></div>
</div>
