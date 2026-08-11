<script lang="ts">
	import Download from '@lucide/svelte/icons/download';
	import {exportPNG, exportSVG} from '$lib/echarts/echartAction';

	interface Props {
		/** Chart DOM element to export (PNG/SVG). */
		chartEl: HTMLElement | undefined;
		/** Filename prefix for the exported file (e.g. "timeline", "comparison"). */
		prefix: string;
		/** Optional label used in button titles / aria (e.g. a segment or period). */
		label?: string;
		/** Visual size variant: 'md' for view headers, 'sm' for card headers. */
		size?: 'md' | 'sm';
	}

	let {chartEl, prefix, label = '', size = 'md'}: Props = $props();

	const buttonClass = $derived(
		size === 'sm'
			? 'px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1'
			: 'px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
	);

	function downloadPNG(): void {
		if (chartEl) exportPNG(chartEl, `${prefix}-${label}-${Date.now()}.png`);
	}

	function downloadSVG(): void {
		if (chartEl) exportSVG(chartEl, `${prefix}-${label}-${Date.now()}.svg`);
	}
</script>

<div
	class="flex items-center gap-1.5"
	role="group"
	aria-label={`Download ${prefix} chart`}
>
	<!-- Decorative download icon: signals the PNG/SVG buttons initiate a download. -->
	<Download class="w-4 h-4 text-[#6E6E6E]" aria-hidden="true" />
	<button
		type="button"
		onclick={downloadPNG}
		title={label ? `Export ${label} chart as PNG` : 'Export chart as PNG'}
		class={buttonClass}
	>
		PNG
	</button>
	<button
		type="button"
		onclick={downloadSVG}
		title={label ? `Export ${label} chart as SVG` : 'Export chart as SVG'}
		class={buttonClass}
	>
		SVG
	</button>
</div>
