/**
 * @fileoverview ECharts JSON compiler for Tab 3: Distribution & Breakdown Mode.
 *
 * Compiles Day-of-Week (Bar/Heatmap), Time-of-Day (Polar Clock/Histogram),
 * and Activity/Preset Breakdown (Donut/Stacked Bar) charts (§5.3).
 *
 * Supports the full distribution control surface:
 *   - category: dayOfWeek | timeOfDay | breakdown
 *   - chartStyle: bar | heatmap | histogram | polar | donut | stackedBar
 *   - metric: totalDuration | sessionCount | averageDuration
 *   - temporalGrouping: groups heatmap rows and stacked-bar segments by period
 *   - thresholdMinutes: filtered upstream in the calculators
 */

import type {EChartsOption, VisualMapComponentOption} from 'echarts';
import type {
	DistributionMetric,
	DistributionTemporalGrouping,
} from '../../types/engine.js';
import type {Unit} from '../../types/filters.js';
import {
	metricValueOf,
	type CategoryBreakdownItem,
	type DayOfWeekBin,
	type TimeOfDayBin,
} from '../distribution.js';

/** Distinct stacked-bar palette for the Activity/Preset breakdown segments. */
const STACKED_PALETTE: readonly string[] = [
	'#10b981', // Emerald 500
	'#f59e0b', // Amber 500
	'#3b82f6', // Blue 500
	'#ec4899', // Pink 500
	'#8b5cf6', // Violet 500
	'#14b8a6', // Teal 500
	'#f97316', // Orange 500
	'#6366f1', // Indigo 500
];

/** Shared base style for every distribution chart (light theme). */
function baseTextStyle(): EChartsOption['textStyle'] {
	return {fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C'};
}

/** Shared dark tooltip shell used across distribution charts. */
function darkTooltip(
	extra: Record<string, unknown> = {},
): EChartsOption['tooltip'] {
	return {
		backgroundColor: '#1F2937',
		borderColor: '#334155',
		borderWidth: 1,
		textStyle: {color: '#f8fafc'},
		confine: true,
		...extra,
	};
}

/**
 * Human-readable display label for the selected unit (e.g. "Minutes").
 *
 * @param unit - Display unit.
 * @returns Title-cased unit label for axis names.
 */
export function unitAxisName(unit: Unit): string {
	if (unit === 'sessions') return 'Sessions';
	if (unit === 'hours') return 'Hours';
	return 'Minutes';
}

/**
 * Compiles Day-of-Week distribution options.
 *
 * @param bins - Mon-Sun 7-bin calculation array.
 * @param unit - Display unit.
 * @param style - 'bar' or 'heatmap'.
 * @param metric - Metric calculation mode.
 */
export function compileDayOfWeekOption(
	bins: readonly DayOfWeekBin[],
	unit: Unit,
	style: 'bar' | 'heatmap' = 'bar',
	metric: DistributionMetric = 'totalDuration',
	showHeatmapLabels = true,
): EChartsOption {
	const dayNames = bins.map(b => b.dayName);
	const values = bins.map(b =>
		metricValueOf(b.totalValue, b.sessionCount, b.averageValue, metric),
	);
	const unitLabel = unitAxisName(unit);

	if (style === 'bar') {
		return {
			backgroundColor: 'transparent',
			textStyle: baseTextStyle(),
			tooltip: darkTooltip({
				trigger: 'axis',
				formatter: (params: any) => {
					if (!Array.isArray(params) || params.length === 0) return '';
					const idx = params[0].dataIndex;
					const bin = bins[idx];
					const value = metricValueOf(
						bin.totalValue,
						bin.sessionCount,
						bin.averageValue,
						metric,
					);
					return `
						<div style="font-weight:600;">${bin.dayName}</div>
						<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
						<div>Sessions: <strong>${bin.sessionCount}</strong></div>
						<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
					`;
				},
			}),
			grid: {
				left: '3%',
				right: '4%',
				bottom: '10%',
				top: '8%',
				containLabel: true,
			},
			xAxis: {
				type: 'category',
				data: dayNames,
				axisLine: {lineStyle: {color: '#E5E7EB'}},
				axisLabel: {color: '#1C1C1C'},
			},
			yAxis: {
				type: 'value',
				name: unitLabel,
				nameTextStyle: {color: '#1C1C1C', padding: [0, 0, 0, 10]},
				axisLine: {lineStyle: {color: '#E5E7EB'}},
				splitLine: {lineStyle: {color: '#E5E7EB'}},
				axisLabel: {color: '#1C1C1C'},
			},
			series: [
				{
					name: 'Day of Week Volume',
					type: 'bar',
					data: values,
					itemStyle: {
						color: '#EAA845', // Warm amber accent
						borderRadius: [4, 4, 0, 0],
					},
				},
			],
		};
	}

	// Heatmap mode (single-row "Volume" heatmap)
	const heatmapData = bins.map((b, i) => [
		i,
		0,
		metricValueOf(b.totalValue, b.sessionCount, b.averageValue, metric),
	]);
	const maxVal = Math.max(...heatmapData.map(d => d[2] as number), 1);

	return {
		backgroundColor: 'transparent',
		textStyle: baseTextStyle(),
		tooltip: darkTooltip({
			position: 'top',
			formatter: (params: any) => {
				if (!params || params.data === undefined) return '';
				const [x, , value] = params.data as [number, number, number];
				const bin = bins[x];
				if (!bin) return '';
				return `
					<div style="font-weight:600;">${bin.dayName}</div>
					<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
					<div>Sessions: <strong>${bin.sessionCount}</strong></div>
					<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
				`;
			},
		}),
		grid: {height: '30%', top: '20%'},
		xAxis: {type: 'category', data: dayNames, axisLabel: {color: '#1C1C1C'}},
		yAxis: {type: 'category', data: ['Volume'], axisLabel: {color: '#1C1C1C'}},
		visualMap: {
			min: 0,
			max: maxVal,
			calculable: true,
			orient: 'horizontal',
			left: 'center',
			bottom: '15%',
			// Cool-to-warm sequential scale (#3B82F6 -> #EF4444)
			inRange: {color: ['#3B82F6', '#EAA845', '#EF4444']},
			textStyle: {color: '#1C1C1C'},
			// Show/hide the value labels; round to one decimal to match tooltips.
			show: showHeatmapLabels,
			precision: 1,
		} as VisualMapComponentOption,
		series: [
			{
				name: 'Intensity',
				type: 'heatmap',
				data: heatmapData,
				// The cell labels ARE the series labels (not the visualMap labels).
				// Round to one decimal and drive visibility from the toggle.
				label: {
					show: showHeatmapLabels,
					color: '#1C1C1C',
					formatter: (params: any) => {
						const value = params?.value?.[2];
						return typeof value === 'number' ? value.toFixed(1) : '';
					},
				},
			},
		],
	};
}

/**
 * Compiles a multi-period Day-of-Week heatmap matrix (§5.3).
 *
 * Each temporal period (week/month/quarter/season/year) is one row; the
 * columns are Mon–Sun. Cells are shaded by the selected metric intensity.
 *
 * @param periodBins - Per-period day-of-week bins (chronological).
 * @param unit - Display unit.
 * @param metric - Metric calculation mode.
 * @param grouping - Temporal grouping granularity.
 * @returns EChartsOption heatmap matrix.
 */
export function compileDayOfWeekHeatmapMatrix(
	periodBins: readonly {period: string; bins: DayOfWeekBin[]}[],
	unit: Unit,
	metric: DistributionMetric = 'totalDuration',
	grouping: DistributionTemporalGrouping = 'month',
	showLabels = true,
): EChartsOption {
	const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const rowLabels = periodBins.map(p => p.period);

	const heatmapData: [number, number, number][] = [];
	let globalMax = 0;

	periodBins.forEach((period, row) => {
		period.bins.forEach((bin, col) => {
			const value = metricValueOf(
				bin.totalValue,
				bin.sessionCount,
				bin.averageValue,
				metric,
			);
			heatmapData.push([col, row, value]);
			if (value > globalMax) globalMax = value;
		});
	});

	const maxVal = Math.max(globalMax, 1);

	return {
		backgroundColor: 'transparent',
		textStyle: baseTextStyle(),
		tooltip: darkTooltip({
			position: 'top',
			formatter: (params: any) => {
				if (!params || params.data === undefined) return '';
				const [col, row, value] = params.data as [number, number, number];
				const period = rowLabels[row];
				const bin = periodBins[row]?.bins[col];
				if (!period || !bin) return '';
				return `
					<div style="font-weight:600;">${period} · ${bin.dayName}</div>
					<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
					<div>Sessions: <strong>${bin.sessionCount}</strong></div>
					<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
				`;
			},
		}),
		grid: {
			left: '3%',
			right: '4%',
			bottom: '15%',
			top: '12%',
			containLabel: true,
		},
		xAxis: {type: 'category', data: dayNames, axisLabel: {color: '#1C1C1C'}},
		yAxis: {type: 'category', data: rowLabels, axisLabel: {color: '#1C1C1C'}},
		visualMap: {
			min: 0,
			max: maxVal,
			calculable: true,
			orient: 'horizontal',
			left: 'center',
			bottom: '2%',
			inRange: {color: ['#3B82F6', '#EAA845', '#EF4444']},
			textStyle: {color: '#1C1C1C'},
			// Show/hide the value labels; round to one decimal to match tooltips.
			show: showLabels,
			precision: 1,
		} as VisualMapComponentOption,
		title: {
			text: `Day of Week by ${groupingLabel(grouping)}`,
			subtext: `Shaded by ${metricLabel(metric).toLowerCase()} (${unit})`,
			left: 'center',
			top: 'top',
			textStyle: {color: '#1C1C1C', fontSize: 13, fontWeight: 600},
			subtextStyle: {color: '#6E6E6E', fontSize: 11},
		},
		series: [
			{
				name: 'Intensity',
				type: 'heatmap',
				data: heatmapData,
				// The cell labels ARE the series labels (not the visualMap labels).
				// Round to one decimal and drive visibility from the toggle.
				label: {
					show: showLabels,
					color: '#1C1C1C',
					fontSize: 10,
					formatter: (params: any) => {
						const value = params?.value?.[2];
						return typeof value === 'number' ? value.toFixed(1) : '';
					},
				},
			},
		],
	};
}

/**
 * Compiles 24-hour Time-of-Day distribution options.
 *
 * @param bins - 24-bin calculation array (00:00 to 23:00).
 * @param unit - Display unit.
 * @param style - 'histogram' or 'polar'.
 * @param metric - Metric calculation mode.
 */
export function compileTimeOfDayOption(
	bins: readonly TimeOfDayBin[],
	unit: Unit,
	style: 'histogram' | 'polar' = 'histogram',
	metric: DistributionMetric = 'totalDuration',
): EChartsOption {
	const hourLabels = bins.map(b => b.hourLabel);
	const values = bins.map(b =>
		metricValueOf(b.totalValue, b.sessionCount, b.averageValue, metric),
	);
	const unitLabel = unitAxisName(unit);

	if (style === 'polar') {
		return {
			backgroundColor: 'transparent',
			textStyle: baseTextStyle(),
			tooltip: darkTooltip({
				trigger: 'item',
				formatter: (params: any) => {
					const idx = params?.dataIndex;
					const bin = bins[idx];
					if (!bin) return '';
					const value = metricValueOf(
						bin.totalValue,
						bin.sessionCount,
						bin.averageValue,
						metric,
					);
					return `
						<div style="font-weight:600;">${bin.hourLabel}</div>
						<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
						<div>Sessions: <strong>${bin.sessionCount}</strong></div>
						<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
					`;
				},
			}),
			angleAxis: {
				type: 'category',
				data: hourLabels,
				startAngle: 90, // 00:00 at top (clock position 12)
				clockwise: true,
				axisLabel: {color: '#1C1C1C', interval: 2},
			},
			radiusAxis: {
				min: 0,
				axisLabel: {color: '#1C1C1C'},
				splitLine: {lineStyle: {color: '#E5E7EB'}},
			},
			polar: {},
			series: [
				{
					type: 'bar',
					data: values,
					coordinateSystem: 'polar',
					name: 'Practice Volume',
					itemStyle: {color: '#10B981'}, // Emerald 500
				},
			],
		};
	}

	// Hourly Histogram
	return {
		backgroundColor: 'transparent',
		textStyle: baseTextStyle(),
		tooltip: darkTooltip({
			trigger: 'axis',
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';
				const idx = params[0].dataIndex;
				const bin = bins[idx];
				if (!bin) return '';
				const value = metricValueOf(
					bin.totalValue,
					bin.sessionCount,
					bin.averageValue,
					metric,
				);
				return `
					<div style="font-weight:600;">${bin.hourLabel}</div>
					<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
					<div>Sessions: <strong>${bin.sessionCount}</strong></div>
					<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
				`;
			},
		}),
		grid: {
			left: '3%',
			right: '4%',
			bottom: '10%',
			top: '8%',
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: hourLabels,
			axisLine: {lineStyle: {color: '#E5E7EB'}},
			axisLabel: {color: '#1C1C1C', interval: 1, rotate: 45},
		},
		yAxis: {
			type: 'value',
			name: unitLabel,
			nameTextStyle: {color: '#1C1C1C', padding: [0, 0, 0, 10]},
			axisLine: {lineStyle: {color: '#E5E7EB'}},
			splitLine: {lineStyle: {color: '#E5E7EB'}},
			axisLabel: {color: '#1C1C1C'},
		},
		series: [
			{
				name: 'Hourly Volume',
				type: 'bar',
				data: values,
				itemStyle: {
					color: '#EAA845', // Warm amber accent
					borderRadius: [2, 2, 0, 0],
				},
			},
		],
	};
}

/**
 * Compiles Activity & Preset proportional breakdown options.
 *
 * @param items - Category breakdown array.
 * @param unit - Display unit.
 * @param style - 'donut' or 'stackedBar'.
 * @param metric - Metric calculation mode.
 */
export function compileCategoryBreakdownOption(
	items: readonly CategoryBreakdownItem[],
	unit: Unit,
	style: 'donut' | 'stackedBar' = 'donut',
	metric: DistributionMetric = 'totalDuration',
): EChartsOption {
	if (style === 'donut') {
		const pieData = items.map(item => ({
			name: item.name,
			value: Number(
				metricValueOf(
					item.totalValue,
					item.sessionCount,
					item.averageValue,
					metric,
				).toFixed(1),
			),
		}));

		return {
			backgroundColor: 'transparent',
			textStyle: baseTextStyle(),
			tooltip: darkTooltip({
				trigger: 'item',
				formatter: (params: any) => {
					const item = items[params?.dataIndex];
					if (!item) return '{b}: <strong>{c}</strong> ({d}%)';
					const value = metricValueOf(
						item.totalValue,
						item.sessionCount,
						item.averageValue,
						metric,
					);
					return `
						<div style="font-weight:600;">${item.name}</div>
						<div>${metricLabel(metric)}: <strong>${value.toFixed(1)} ${unit}</strong></div>
						<div>Sessions: <strong>${item.sessionCount}</strong></div>
						<div>Share: <strong>${item.percentage.toFixed(1)}%</strong></div>
					`;
				},
			}),
			legend: {
				orient: 'vertical',
				right: '5%',
				top: 'center',
				textStyle: {color: '#1C1C1C'},
			},
			series: [
				{
					name: 'Breakdown Share',
					type: 'pie',
					radius: ['40%', '70%'],
					center: ['40%', '50%'],
					avoidLabelOverlap: true,
					itemStyle: {
						borderRadius: 6,
						borderColor: '#ffffff',
						borderWidth: 2,
					},
					label: {show: false},
					emphasis: {label: {show: true, fontSize: 14, fontWeight: 'bold'}},
					// Distinct pastel hues (#F59E0B, #FBBF24, #FCD34D, #A7F3D0)
					color: [
						'#F59E0B',
						'#FBBF24',
						'#FCD34D',
						'#A7F3D0',
						'#6EE7B7',
						'#93C5FD',
					],
					data: pieData,
				},
			],
		};
	}

	// Stacked bar mode — horizontal stacked bar where each category is one
	// stacked segment of a single "All" bar. This is the ungrouped variant;
	// use compileCategoryStackedBar for the temporal-grouped view.
	return {
		backgroundColor: 'transparent',
		textStyle: baseTextStyle(),
		tooltip: darkTooltip({
			trigger: 'axis',
			axisPointer: {type: 'shadow'},
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';
				const category = params[0].name;
				let html = `<div style="font-weight:600;margin-bottom:4px;">${category}</div>`;
				let total = 0;
				for (const p of params) {
					const val = typeof p.value === 'number' ? p.value : 0;
					total += val;
					html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;">`;
					html += `<span>${p.marker} ${p.seriesName}</span>`;
					html += `<strong style="color:#f8fafc;">${val.toFixed(1)} ${unit}</strong></div>`;
				}
				html += `<div style="border-top:1px solid #334155;margin-top:4px;padding-top:4px;display:flex;align-items:center;justify-content:space-between;font-size:12px;">`;
				html += `<span>Total ${metricLabel(metric)}</span><strong>${total.toFixed(1)} ${unit}</strong></div>`;
				return html;
			},
		}),
		grid: {
			left: '3%',
			right: '4%',
			bottom: '5%',
			top: '5%',
			containLabel: true,
		},
		xAxis: {
			type: 'value',
			axisLabel: {color: '#1C1C1C'},
			splitLine: {lineStyle: {color: '#E5E7EB'}},
		},
		yAxis: {type: 'category', data: ['All'], axisLabel: {color: '#1C1C1C'}},
		series: items.map((item, index) => ({
			name: item.name,
			type: 'bar' as const,
			stack: 'total',
			emphasis: {focus: 'series' as const},
			data: [
				metricValueOf(
					item.totalValue,
					item.sessionCount,
					item.averageValue,
					metric,
				),
			],
			itemStyle: {color: STACKED_PALETTE[index % STACKED_PALETTE.length]},
		})),
	};
}

/**
 * Compiles a temporal-grouped Activity/Preset stacked-bar breakdown (§5.3).
 *
 * Each temporal period is one horizontal bar; the stacked segments are the
 * category share within that period. Use this when temporal grouping is
 * active so the breakdown shows mix shifts over time.
 *
 * @param periodItems - Per-period category breakdown items.
 * @param unit - Display unit.
 * @param metric - Metric calculation mode.
 * @param grouping - Temporal grouping granularity.
 * @returns EChartsOption stacked bar.
 */
export function compileCategoryStackedBar(
	periodItems: readonly {period: string; items: CategoryBreakdownItem[]}[],
	unit: Unit,
	metric: DistributionMetric = 'totalDuration',
	grouping: DistributionTemporalGrouping = 'month',
): EChartsOption {
	const periodLabels = periodItems.map(p => p.period);
	const allNames = Array.from(
		new Set(periodItems.flatMap(p => p.items.map(i => i.name))),
	);

	const series = allNames.map((name, index) => ({
		name,
		type: 'bar' as const,
		stack: 'total',
		emphasis: {focus: 'series' as const},
		data: periodItems.map(period => {
			const item = period.items.find(i => i.name === name);
			if (!item) return 0;
			return metricValueOf(
				item.totalValue,
				item.sessionCount,
				item.averageValue,
				metric,
			);
		}),
		itemStyle: {color: STACKED_PALETTE[index % STACKED_PALETTE.length]},
	}));

	return {
		backgroundColor: 'transparent',
		textStyle: baseTextStyle(),
		tooltip: darkTooltip({
			trigger: 'axis',
			axisPointer: {type: 'shadow'},
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';
				const period = params[0].name;
				let html = `<div style="font-weight:600;margin-bottom:4px;">${period}</div>`;
				let total = 0;
				for (const p of params) {
					const val = typeof p.value === 'number' ? p.value : 0;
					total += val;
					html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;">`;
					html += `<span>${p.marker} ${p.seriesName}</span>`;
					html += `<strong style="color:#f8fafc;">${val.toFixed(1)} ${unit}</strong></div>`;
				}
				html += `<div style="border-top:1px solid #334155;margin-top:4px;padding-top:4px;display:flex;align-items:center;justify-content:space-between;font-size:12px;">`;
				html += `<span>Total ${metricLabel(metric)}</span><strong>${total.toFixed(1)} ${unit}</strong></div>`;
				return html;
			},
		}),
		legend: {
			type: 'scroll',
			bottom: 0,
			textStyle: {color: '#1C1C1C'},
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '12%',
			top: '12%',
			containLabel: true,
		},
		xAxis: {
			type: 'value',
			axisLabel: {color: '#1C1C1C'},
			splitLine: {lineStyle: {color: '#E5E7EB'}},
			name: unitAxisName(unit),
			nameTextStyle: {color: '#1C1C1C'},
		},
		yAxis: {
			type: 'category',
			data: periodLabels,
			axisLabel: {color: '#1C1C1C'},
		},
		title: {
			text: `Breakdown by ${groupingLabel(grouping)}`,
			subtext: `Stacked by ${metricLabel(metric).toLowerCase()} (${unit})`,
			left: 'center',
			top: 'top',
			textStyle: {color: '#1C1C1C', fontSize: 13, fontWeight: 600},
			subtextStyle: {color: '#6E6E6E', fontSize: 11},
		},
		series,
	};
}

/** Empty-state option shown when there is no data to plot. */
export function emptyDistributionOption(): EChartsOption {
	return {
		backgroundColor: 'transparent',
		title: {
			text: 'No Distribution Data',
			subtext: 'Load a CSV to view practice distribution',
			left: 'center',
			top: 'middle',
			textStyle: {color: '#6E6E6E'},
		},
	};
}

/** Human-readable label for a metric, used in tooltips and titles. */
function metricLabel(metric: DistributionMetric): string {
	switch (metric) {
		case 'sessionCount':
			return 'Session Count';
		case 'averageDuration':
			return 'Average Session Length';
		case 'totalDuration':
		default:
			return 'Total Duration';
	}
}

/** Human-readable grouping label, e.g. "Month". */
function groupingLabel(grouping: DistributionTemporalGrouping): string {
	switch (grouping) {
		case 'week':
			return 'Week';
		case 'month':
			return 'Month';
		case 'quarter':
			return 'Quarter';
		case 'season':
			return 'Season';
		case 'year':
			return 'Year';
	}
}
