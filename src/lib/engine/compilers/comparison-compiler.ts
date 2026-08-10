/**
 * @fileoverview ECharts JSON compiler for Tab 2: Comparison Mode.
 *
 * Compiles multi-period overlay series with locked Y-axis scaling (§5.2) and
 * differential tooltips.
 */

import type { EChartsOption } from 'echarts';
import type { Unit } from '../../types/filters.js';
import type { TimeBucket } from '../../types/temporal.js';

export interface ComparisonSeriesData {
	readonly id: string;
	readonly label: string;
	readonly color: string;
	readonly buckets: readonly TimeBucket[];
}

export interface ComparisonCompilerInput {
	readonly seriesList: readonly ComparisonSeriesData[];
	readonly unit: Unit;
	readonly lockYAxis: boolean;
	readonly xAxisAlignment: 'calendar' | 'elapsed';
}

/**
 * Compiles Tab 2 Comparison parameters into a multi-series overlay ECharts option.
 *
 * @param input - Series list, unit, y-axis lock toggle, and x-axis alignment mode.
 * @returns Complete EChartsOption object ready for chart.setOption().
 */
export function compileComparisonOption(input: ComparisonCompilerInput): EChartsOption {
	const { seriesList, unit, lockYAxis, xAxisAlignment } = input;

	if (seriesList.length === 0) {
		return {
			backgroundColor: 'transparent',
			title: {
				text: 'No Comparison Periods Selected',
				subtext: 'Click "+ Add Period" to compare time windows',
				left: 'center',
				top: 'middle',
				textStyle: { color: '#6E6E6E' }
			}
		};
	}

	// Compute global maximum Y-value across all series for Y-axis range locking (§5.2)
	let globalMaxY = 0;
	for (const series of seriesList) {
		for (const bucket of series.buckets) {
			const val =
				unit === 'sessions'
					? bucket.sessionCount
					: unit === 'hours'
						? bucket.totalSeconds / 3600
						: bucket.totalSeconds / 60;

			if (val > globalMaxY) globalMaxY = val;
		}
	}
	// Add 10% headroom
	const yAxisMax = lockYAxis && globalMaxY > 0 ? Math.ceil(globalMaxY * 1.1) : undefined;

	// Build X-axis categories
	let xCategories: string[] = [];

	if (xAxisAlignment === 'elapsed') {
		const maxLen = Math.max(...seriesList.map((s) => s.buckets.length));
		xCategories = Array.from({ length: maxLen }, (_, i) => `Day ${i + 1}`);
	} else {
		// Use longest bucket list labels
		const longest = seriesList.reduce(
			(prev, curr) => (curr.buckets.length > prev.buckets.length ? curr : prev),
			seriesList[0]
		);
		xCategories = longest.buckets.map((b) => b.label);
	}

	// Construct series array
	const echartsSeries = seriesList.map((s) => {
		const rawValues = s.buckets.map((b) =>
			unit === 'sessions'
				? b.sessionCount
				: unit === 'hours'
					? b.totalSeconds / 3600
					: b.totalSeconds / 60
		);

		return {
			name: s.label,
			type: 'line' as const,
			data: rawValues,
			smooth: true,
			symbolSize: 6,
			lineStyle: { color: s.color, width: 2.5 },
			itemStyle: { color: s.color }
		};
	});

	return {
		backgroundColor: 'transparent',
		textStyle: {
			fontFamily: 'system-ui, -apple-system, sans-serif',
			color: '#1C1C1C'
		},
		legend: {
			top: '2%',
			textStyle: { color: '#1C1C1C' }
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			borderWidth: 1,
			textStyle: { color: '#f8fafc' },
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';

				let html = `<div style="font-weight:600;margin-bottom:4px;color:#cbd5e1;">${params[0].axisValue}</div>`;

				// Render each period value and compute differential vs baseline (first series)
				const baselineVal =
					params.length > 0 && typeof params[0].value === 'number' ? params[0].value : null;

				params.forEach((p: any, idx: number) => {
					const val = typeof p.value === 'number' ? p.value : 0;
					const formattedVal = val.toFixed(1);

					html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;">`;
					html += `<span>${p.marker} ${p.seriesName}</span>`;
					html += `<strong style="color:#f8fafc;">${formattedVal} ${unit}</strong>`;

					if (idx > 0 && baselineVal !== null && baselineVal > 0) {
						const diff = val - baselineVal;
						const pct = (diff / baselineVal) * 100;
						const diffStr = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%)`;
						const color = diff >= 0 ? '#10b981' : '#f43f5e';
						html += `<span style="color:${color};font-size:11px;">${diffStr}</span>`;
					}

					html += `</div>`;
				});

				return html;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '8%',
			top: '12%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: xCategories,
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C' }
		},
		yAxis: {
			type: 'value',
			max: yAxisMax,
			name: unit.charAt(0).toUpperCase() + unit.slice(1),
			nameTextStyle: { color: '#1C1C1C' },
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			splitLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C' }
		},
		series: echartsSeries
	};
}
