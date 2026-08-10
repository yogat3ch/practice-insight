/**
 * @fileoverview ECharts JSON compiler for Tab 3: Distribution & Breakdown Mode.
 *
 * Compiles Day-of-Week (Bar/Heatmap), Time-of-Day (Polar Clock/Histogram),
 * and Activity/Preset Breakdown (Donut/Stacked Bar) charts.
 */

import type { EChartsOption } from 'echarts';
import type { Unit } from '../../types/filters.js';
import type { CategoryBreakdownItem, DayOfWeekBin, TimeOfDayBin } from '../distribution.js';

/**
 * Compiles Day-of-Week distribution options.
 *
 * @param bins - Mon-Sun 7-bin calculation array.
 * @param unit - Display unit.
 * @param style - 'bar' or 'heatmap'.
 */
export function compileDayOfWeekOption(
	bins: readonly DayOfWeekBin[],
	unit: Unit,
	style: 'bar' | 'heatmap' = 'bar'
): EChartsOption {
	const dayNames = bins.map((b) => b.dayName);
	const values = bins.map((b) => b.totalValue);

	if (style === 'bar') {
		return {
			backgroundColor: 'transparent',
			textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
			tooltip: {
				trigger: 'axis',
				backgroundColor: '#1F2937',
				borderColor: '#334155',
				textStyle: { color: '#f8fafc' },
				formatter: (params: any) => {
					if (!Array.isArray(params) || params.length === 0) return '';
					const idx = params[0].dataIndex;
					const bin = bins[idx];
					return `
						<div style="font-weight:600;">${bin.dayName}</div>
						<div>Total: <strong>${bin.totalValue.toFixed(1)} ${unit}</strong></div>
						<div>Sessions: <strong>${bin.sessionCount}</strong></div>
						<div>Average: <strong>${bin.averageValue.toFixed(1)} ${unit}/session</strong></div>
					`;
				}
			},
			grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
			xAxis: {
				type: 'category',
				data: dayNames,
				axisLine: { lineStyle: { color: '#E5E7EB' } },
				axisLabel: { color: '#1C1C1C' }
			},
			yAxis: {
				type: 'value',
				name: unit.charAt(0).toUpperCase() + unit.slice(1),
				axisLine: { lineStyle: { color: '#E5E7EB' } },
				splitLine: { lineStyle: { color: '#E5E7EB' } },
				axisLabel: { color: '#1C1C1C' }
			},
			series: [
				{
					name: 'Day of Week Volume',
					type: 'bar',
					data: values,
					itemStyle: {
						color: '#EAA845', // Warm amber accent
						borderRadius: [4, 4, 0, 0]
					}
				}
			]
		};
	}

	// Heatmap mode
	const heatmapData = bins.map((b, i) => [i, 0, b.totalValue]);
	const maxVal = Math.max(...values, 1);

	return {
		backgroundColor: 'transparent',
		textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
		tooltip: {
			position: 'top',
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			textStyle: { color: '#f8fafc' }
		},
		grid: { height: '30%', top: '20%' },
		xAxis: { type: 'category', data: dayNames, axisLabel: { color: '#1C1C1C' } },
		yAxis: { type: 'category', data: ['Volume'], axisLabel: { color: '#1C1C1C' } },
		visualMap: {
			min: 0,
			max: maxVal,
			calculable: true,
			orient: 'horizontal',
			left: 'center',
			bottom: '15%',
			// Cool-to-warm sequential scale (#3B82F6 -> #EF4444)
			inRange: { color: ['#3B82F6', '#EAA845', '#EF4444'] },
			textStyle: { color: '#1C1C1C' }
		},
		series: [
			{
				name: 'Intensity',
				type: 'heatmap',
				data: heatmapData,
				label: { show: true, color: '#1C1C1C' }
			}
		]
	};
}

/**
 * Compiles 24-hour Time-of-Day distribution options.
 *
 * @param bins - 24-bin calculation array (00:00 to 23:00).
 * @param unit - Display unit.
 * @param style - 'histogram' or 'polar'.
 */
export function compileTimeOfDayOption(
	bins: readonly TimeOfDayBin[],
	unit: Unit,
	style: 'histogram' | 'polar' = 'histogram'
): EChartsOption {
	const hourLabels = bins.map((b) => b.hourLabel);
	const values = bins.map((b) => b.totalValue);

	if (style === 'polar') {
		return {
			backgroundColor: 'transparent',
			textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
			tooltip: {
				trigger: 'item',
				backgroundColor: '#1F2937',
				borderColor: '#334155',
				textStyle: { color: '#f8fafc' }
			},
			angleAxis: {
				type: 'category',
				data: hourLabels,
				startAngle: 90, // 00:00 at top (clock position 12)
				clockwise: true,
				axisLabel: { color: '#1C1C1C', interval: 2 }
			},
			radiusAxis: {
				min: 0,
				axisLabel: { color: '#1C1C1C' },
				splitLine: { lineStyle: { color: '#E5E7EB' } }
			},
			polar: {},
			series: [
				{
					type: 'bar',
					data: values,
					coordinateSystem: 'polar',
					name: 'Practice Volume',
					itemStyle: { color: '#10B981' } // Emerald 500
				}
			]
		};
	}

	// Hourly Histogram
	return {
		backgroundColor: 'transparent',
		textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
		tooltip: {
			trigger: 'axis',
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			textStyle: { color: '#f8fafc' }
		},
		grid: { left: '3%', right: '4%', bottom: '10%', top: '8%', containLabel: true },
		xAxis: {
			type: 'category',
			data: hourLabels,
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C', interval: 1, rotate: 45 }
		},
		yAxis: {
			type: 'value',
			name: unit.charAt(0).toUpperCase() + unit.slice(1),
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			splitLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C' }
		},
		series: [
			{
				name: 'Hourly Volume',
				type: 'bar',
				data: values,
				itemStyle: {
					color: '#EAA845', // Warm amber accent
					borderRadius: [2, 2, 0, 0]
				}
			}
		]
	};
}

/**
 * Compiles Activity & Preset proportional breakdown options.
 *
 * @param items - Category breakdown array.
 * @param unit - Display unit.
 * @param style - 'donut' or 'stackedBar'.
 */
export function compileCategoryBreakdownOption(
	items: readonly CategoryBreakdownItem[],
	unit: Unit,
	style: 'donut' | 'stackedBar' = 'donut'
): EChartsOption {
	if (style === 'donut') {
		const pieData = items.map((item) => ({
			name: item.name,
			value: Number(item.totalValue.toFixed(1))
		}));

		return {
			backgroundColor: 'transparent',
			textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
			tooltip: {
				trigger: 'item',
				backgroundColor: '#1F2937',
				borderColor: '#334155',
				textStyle: { color: '#f8fafc' },
				formatter: '{b}: <strong>{c} ' + unit + '</strong> ({d}%)'
			},
			legend: {
				orient: 'vertical',
				right: '5%',
				top: 'center',
				textStyle: { color: '#1C1C1C' }
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
						borderWidth: 2
					},
					label: { show: false },
					emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
					// Distinct pastel hues (#F59E0B, #FBBF24, #FCD34D, #A7F3D0)
					color: ['#F59E0B', '#FBBF24', '#FCD34D', '#A7F3D0', '#6EE7B7', '#93C5FD'],
					data: pieData
				}
			]
		};
	}

	// Stacked horizontal bar mode
	const categories = items.map((i) => i.name);
	const values = items.map((i) => i.totalValue);

	return {
		backgroundColor: 'transparent',
		textStyle: { fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1C1C1C' },
		tooltip: {
			trigger: 'axis',
			axisPointer: { type: 'shadow' },
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			textStyle: { color: '#f8fafc' }
		},
		grid: { left: '3%', right: '4%', bottom: '5%', top: '5%', containLabel: true },
		xAxis: { type: 'value', axisLabel: { color: '#1C1C1C' } },
		yAxis: { type: 'category', data: categories, axisLabel: { color: '#1C1C1C' } },
		series: [
			{
				name: 'Volume',
				type: 'bar',
				data: values,
				itemStyle: { color: '#EAA845', borderRadius: [0, 4, 4, 0] }
			}
		]
	};
}
