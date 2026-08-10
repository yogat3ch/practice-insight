/**
 * @fileoverview ECharts JSON compiler for Tab 1: Timeline Mode.
 *
 * Transmutes aggregated timeline buckets, moving average smoothing, and
 * statistical overlays (Mean, StdDev, Linear Trendline) into a declarative
 * ECharts option payload.
 */

import type { EChartsOption } from 'echarts';
import type { Unit } from '../../types/filters.js';
import type { TimeBucket } from '../../types/temporal.js';
import type { LinearRegressionResult } from '../statistics.js';

export interface TimelineCompilerInput {
	readonly buckets: readonly TimeBucket[];
	readonly unit: Unit;
	readonly movingAverageValues: readonly number[];
	readonly mean: number;
	readonly stdDev: number;
	readonly linearTrend: LinearRegressionResult;
	readonly showMean: boolean;
	readonly showStdDev: boolean;
	readonly showLinearTrend: boolean;
	readonly movingAverageDays: number;
}

/**
 * Compiles Tab 1 Timeline parameters into a declarative ECharts option payload.
 *
 * @param input - Aggregated buckets, unit, statistical calculations, and toggle states.
 * @returns Complete EChartsOption object ready for chart.setOption().
 */
export function compileTimelineOption(input: TimelineCompilerInput): EChartsOption {
	const {
		buckets,
		unit,
		movingAverageValues,
		mean,
		stdDev,
		linearTrend,
		showMean,
		showStdDev,
		showLinearTrend,
		movingAverageDays
	} = input;

	const xLabels = buckets.map((b) => b.label);
	const rawValues = buckets.map((b) =>
		unit === 'sessions'
			? b.sessionCount
			: unit === 'hours'
				? b.totalSeconds / 3600
				: b.totalSeconds / 60
	);

	const unitSuffix = unit === 'sessions' ? ' sessions' : unit === 'hours' ? 'h' : 'm';

	// Main primary bar/line series
	const primarySeries: EChartsOption['series'] = [
		{
			name: 'Practice Volume',
			type: 'bar',
			data: rawValues,
			itemStyle: {
				color: '#10b981', // Emerald 500
				borderRadius: [4, 4, 0, 0]
			},
			emphasis: {
				itemStyle: {
					color: '#34d399'
				}
			}
		}
	];

	// Moving Average overlay series
	if (movingAverageDays > 0 && movingAverageValues.length > 0) {
		(primarySeries as any[]).push({
			name: `${movingAverageDays}-Point Moving Avg`,
			type: 'line',
			data: [...movingAverageValues],
			smooth: true,
			symbol: 'none',
			lineStyle: {
				color: '#38bdf8', // Sky 400
				width: 2.5
			}
		});
	}

	// Linear Trendline series
	if (showLinearTrend && linearTrend.trendline.length > 0) {
		(primarySeries as any[]).push({
			name: 'Linear Trendline',
			type: 'line',
			data: [...linearTrend.trendline],
			symbol: 'none',
			lineStyle: {
				color: '#f59e0b', // Amber 500
				width: 2,
				type: 'dashed'
			}
		});
	}

	// Statistical MarkLines / MarkAreas on primary series
	const markLineData: any[] = [];
	const markAreaData: any[] = [];

	if (showMean && buckets.length > 0) {
		markLineData.push({
			name: 'Mean (μ)',
			yAxis: mean,
			lineStyle: { color: '#ec4899', width: 2, type: 'solid' },
			label: {
				formatter: `μ: {c}${unitSuffix}`,
				position: 'end',
				color: '#db2777'
			}
		});
	}

	if (showStdDev && buckets.length > 0 && stdDev > 0) {
		const upper = mean + stdDev;
		const lower = Math.max(0, mean - stdDev);

		markLineData.push(
			{
				name: '+1 Std Dev (+σ)',
				yAxis: upper,
				lineStyle: { color: '#9333ea', width: 1.5, type: 'dotted' },
				label: { formatter: `+σ: {c}${unitSuffix}`, position: 'end', color: '#9333ea' }
			},
			{
				name: '-1 Std Dev (-σ)',
				yAxis: lower,
				lineStyle: { color: '#9333ea', width: 1.5, type: 'dotted' },
				label: { formatter: `-σ: {c}${unitSuffix}`, position: 'end', color: '#9333ea' }
			}
		);

		markAreaData.push([
			{ yAxis: lower, itemStyle: { color: 'rgba(147, 51, 234, 0.08)' } },
			{ yAxis: upper }
		]);
	}

	if (markLineData.length > 0 || markAreaData.length > 0) {
		(primarySeries[0] as any).markLine = {
			symbol: ['none', 'none'],
			data: markLineData
		};

		if (markAreaData.length > 0) {
			(primarySeries[0] as any).markArea = {
				silent: true,
				data: markAreaData
			};
		}
	}

	return {
		backgroundColor: 'transparent',
		textStyle: {
			fontFamily: 'system-ui, -apple-system, sans-serif',
			color: '#1C1C1C'
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			borderWidth: 1,
			textStyle: { color: '#f8fafc' },
			axisPointer: { type: 'cross', crossStyle: { color: '#9CA3AF' } },
			formatter: (params: any) => {
				if (!Array.isArray(params) || params.length === 0) return '';
				const dataIndex = params[0].dataIndex;
				const bucket = buckets[dataIndex];
				if (!bucket) return '';

				let html = `<div style="font-weight:600;margin-bottom:4px;color:#cbd5e1;">${bucket.label}</div>`;
				html += `<div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">Sessions: <strong>${bucket.sessionCount}</strong></div>`;

				for (const p of params) {
					const val = typeof p.value === 'number' ? p.value.toFixed(1) : p.value;
					html += `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;">`;
					html += `<span>${p.marker} ${p.seriesName}</span>`;
					html += `<strong style="color:#f8fafc;">${val} ${unit}</strong></div>`;
				}
				return html;
			}
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '15%',
			top: '10%',
			containLabel: true
		},
		xAxis: {
			type: 'category',
			data: xLabels,
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C', rotate: xLabels.length > 20 ? 45 : 0 }
		},
		yAxis: {
			type: 'value',
			name: unit.charAt(0).toUpperCase() + unit.slice(1),
			nameTextStyle: { color: '#1C1C1C', padding: [0, 0, 0, 10] },
			axisLine: { lineStyle: { color: '#E5E7EB' } },
			splitLine: { lineStyle: { color: '#E5E7EB' } },
			axisLabel: { color: '#1C1C1C' }
		},
		dataZoom: [
			{
				type: 'slider',
				show: true,
				bottom: '2%',
				height: 20,
				borderColor: '#E5E7EB',
				backgroundColor: '#F9FAFB',
				fillerColor: 'rgba(16, 185, 129, 0.25)',
				handleStyle: { color: '#10b981' },
				textStyle: { color: '#6E6E6E' }
			},
			{
				type: 'inside'
			}
		],
		series: primarySeries
	};
}
