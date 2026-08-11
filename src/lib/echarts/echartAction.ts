import type {EChartsOption} from 'echarts';
import type {EChartsType} from 'echarts/core';
import echarts from './registry';

/**
 * Svelte action to bind an ECharts instance to a DOM node.
 * @param node - HTML element to initialize chart in.
 * @param params - Object containing `option` and optional `theme`.
 */
export function echartAction(
	node: HTMLElement,
	params: {option: EChartsOption; theme?: string},
) {
	let {option, theme} = params;
	// Default to the light theme to match the light-mode UI.
	const chart: EChartsType = echarts.init(node, theme ?? 'light');
	// Store reference for external helpers
	(node as any).__chart = chart;
	chart.setOption(option, true);

	// Resize handling
	const resizeObserver = new ResizeObserver(() => chart.resize());
	resizeObserver.observe(node);

	return {
		update(newParams: {option: EChartsOption; theme?: string}) {
			option = newParams.option;
			if (chart && option) {
				chart.setOption(option, true);
			}
		},
		destroy() {
			resizeObserver.disconnect();
			chart.dispose();
			delete (node as any).__chart;
		},
	};
}

/** Export helpers for PNG/SVG download */
export function exportPNG(node: HTMLElement, filename: string = 'chart.png') {
	const chart: EChartsType | undefined = (node as any).__chart;
	if (!chart) return;
	const dataUrl = chart.getDataURL({
		type: 'png',
		pixelRatio: 2,
		backgroundColor: '#fff',
	});
	const a = document.createElement('a');
	a.href = dataUrl;
	a.download = filename;
	a.click();
}

export function exportSVG(node: HTMLElement, filename: string = 'chart.svg') {
	const chart: EChartsType | undefined = (node as any).__chart;
	if (!chart) return;
	const dataUrl = chart.getDataURL({type: 'svg'});
	const a = document.createElement('a');
	a.href = dataUrl;
	a.download = filename;
	a.click();
}
