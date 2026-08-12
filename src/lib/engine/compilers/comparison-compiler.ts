/**
 * @fileoverview ECharts JSON compiler for Tab 2: Comparison Mode.
 *
 * Compiles multi-period overlay series with locked Y-axis scaling (§5.2),
 * calendar vs. elapsed-day x-axis alignment, and differential tooltips.
 */

import type {EChartsOption} from 'echarts';
import type {XAxisAlignment} from '../../types/engine.js';
import type {Unit} from '../../types/filters.js';
import type {TimeBucket} from '../../types/temporal.js';

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

/** Default palette used when a comparison period has no explicit color assigned. */
const DEFAULT_SERIES_PALETTE: readonly string[] = [
	'#10b981', // Emerald 500
	'#f59e0b', // Amber 500
	'#3b82f6', // Blue 500
	'#ec4899', // Pink 500
	'#8b5cf6', // Violet 500
	'#14b8a6', // Teal 500
	'#f97316', // Orange 500
	'#6366f1', // Indigo 500
];

/**
 * Converts a bucket's accumulated seconds to a scalar value for the given unit.
 * Per §3.4 Rule 4: when unit is 'sessions', every record evaluates to 1.0.
 *
 * @param bucket - Aggregated time bucket.
 * @param unit - Display unit.
 * @returns Numeric value for charting.
 */
function bucketValue(bucket: TimeBucket, unit: Unit): number {
	if (unit === 'sessions') return bucket.sessionCount;
	if (unit === 'hours') return bucket.totalSeconds / 3600;
	return bucket.totalSeconds / 60;
}

/**
 * Human-readable display label for the selected unit (e.g. "Minutes", "Hours").
 *
 * @param unit - Display unit.
 * @returns Title-cased unit label for axis names.
 */
function unitAxisName(unit: Unit): string {
	if (unit === 'sessions') return 'Sessions';
	if (unit === 'hours') return 'Hours';
	return 'Minutes';
}

/** Shared layout derived once from the series list and alignment mode. */
interface ComparisonLayout {
	/** Locked Y-axis maximum (with headroom) or undefined when not locking. */
	readonly yAxisMax: number | undefined;
	/** X-axis categories (calendar labels or "Day N" slots). */
	readonly xCategories: readonly string[];
	/** Calendar labels aligned to elapsed-day slots for tooltips. */
	readonly elapsedToCalendar: readonly string[];
}

/**
 * Computes the shared x-axis categories, elapsed-day calendar lookup, and
 * locked Y-axis maximum for a set of comparison series.
 *
 * @param seriesList - Comparison series.
 * @param unit - Display unit.
 * @param lockYAxis - Whether to force identical Y-scale bounds (§5.2).
 * @param xAxisAlignment - Calendar date vs. elapsed day alignment.
 * @returns Shared layout for chart compilation.
 */
function computeComparisonLayout(
	seriesList: readonly ComparisonSeriesData[],
	unit: Unit,
	lockYAxis: boolean,
	xAxisAlignment: XAxisAlignment,
): ComparisonLayout {
	// Global maximum Y-value across all series for Y-axis range locking (§5.2).
	let globalMaxY = 0;
	for (const series of seriesList) {
		for (const bucket of series.buckets) {
			const val = bucketValue(bucket, unit);
			if (val > globalMaxY) globalMaxY = val;
		}
	}
	// Add 10% headroom. Floor the Y max at 0 so negative-axis artifacts never appear.
	const yAxisMax =
		lockYAxis && globalMaxY > 0
			? Math.max(0, Math.ceil(globalMaxY * 1.1))
			: undefined;

	// Build X-axis categories.
	// - Calendar alignment: union of every series' bucket labels in chronological order.
	// - Elapsed alignment: relative "Day N" slots up to the longest series (Day 1 … Day 365).
	let xCategories: string[] = [];
	const labelSet = new Set<string>();

	if (xAxisAlignment === 'elapsed') {
		const maxLen = Math.max(...seriesList.map(s => s.buckets.length));
		// Phase-0 relative alignment: each series starts at its own first bucket.
		xCategories = Array.from({length: maxLen}, (_, i) => `Day ${i + 1}`);
		// Build a union map so calendar dates can be shown in the tooltip as well.
		for (const s of seriesList) {
			for (const b of s.buckets) labelSet.add(b.label);
		}
	} else {
		for (const s of seriesList) {
			for (const b of s.buckets) labelSet.add(b.label);
		}
		xCategories = Array.from(labelSet);
	}

	return {yAxisMax, xCategories, elapsedToCalendar: Array.from(labelSet)};
}

/**
 * Aligns a single series' bucket values to the shared x-axis categories.
 *
 * @param series - One comparison series.
 * @param unit - Display unit.
 * @param xAxisAlignment - Alignment mode.
 * @param xCategories - Shared x-axis categories.
 * @returns Value array with null at slots where the series has no bucket.
 */
function alignSeriesData(
	series: ComparisonSeriesData,
	unit: Unit,
	xAxisAlignment: XAxisAlignment,
	xCategories: readonly string[],
): (number | null)[] {
	if (xAxisAlignment === 'elapsed') {
		return series.buckets.map(b => bucketValue(b, unit));
	}
	const indexByLabel = new Map(xCategories.map((label, i) => [label, i]));
	return xCategories.map(label => {
		const bucket = series.buckets.find(b => b.label === label);
		return bucket === undefined ? null : bucketValue(bucket, unit);
	});
}

/** Shared tooltip formatter for overlay charts (differential vs baseline). */
function buildTooltipFormatter(
	unit: Unit,
	xAxisAlignment: XAxisAlignment,
	elapsedToCalendar: readonly string[],
): (params: any) => string {
	return (params: any) => {
		if (!Array.isArray(params) || params.length === 0) return '';

		// Elapsed mode: show both the elapsed day and (when resolvable) its
		// calendar date for the first series, mirroring §5.2 alignment rules.
		let header = `${params[0].axisValue}`;
		if (xAxisAlignment === 'elapsed' && params[0].dataIndex !== undefined) {
			const cal = elapsedToCalendar[params[0].dataIndex];
			if (cal) header = `${header} · ${cal}`;
		}

		let html = `<div style="font-weight:600;margin-bottom:4px;color:#cbd5e1;">${header}</div>`;

		// Render each period value and compute differential vs baseline (first series).
		const baselineVal =
			params.length > 0 && typeof params[0].value === 'number'
				? params[0].value
				: null;

		params.forEach((p: any, idx: number) => {
			// Null values (a gap in one period) are skipped, not treated as 0.
			if (p.value === null || p.value === undefined) return;
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
	};
}

/** Empty-state option shown when no comparison periods are configured. */
function emptyComparisonOption(): EChartsOption {
	return {
		backgroundColor: 'transparent',
		title: {
			text: 'No Comparison Periods Selected',
			subtext: 'Click "+ Add Period" to compare time windows',
			left: 'center',
			top: 'middle',
			textStyle: {color: '#6E6E6E'},
		},
	};
}

/**
 * Compiles Tab 2 Comparison parameters into a multi-series overlay ECharts option.
 *
 * @param input - Series list, unit, y-axis lock toggle, and x-axis alignment mode.
 * @returns Complete EChartsOption object ready for chart.setOption().
 */
export function compileComparisonOption(
	input: ComparisonCompilerInput,
): EChartsOption {
	const {seriesList, unit, lockYAxis, xAxisAlignment} = input;

	if (seriesList.length === 0) return emptyComparisonOption();

	const {yAxisMax, xCategories, elapsedToCalendar} = computeComparisonLayout(
		seriesList,
		unit,
		lockYAxis,
		xAxisAlignment,
	);

	// Construct series array. Data is aligned to the union x-axis: null = no
	// bucket at that slot, so ECharts renders a gap instead of a false zero.
	const echartsSeries = seriesList.map((s, seriesIndex) => {
		const color =
			s.color ||
			DEFAULT_SERIES_PALETTE[seriesIndex % DEFAULT_SERIES_PALETTE.length];
		return {
			name: s.label,
			type: 'line' as const,
			data: alignSeriesData(s, unit, xAxisAlignment, xCategories),
			smooth: true,
			symbolSize: 6,
			lineStyle: {color, width: 2.5},
			itemStyle: {color},
			connectNulls: false,
			emphasis: {focus: 'series' as const},
		};
	});

	return {
		backgroundColor: 'transparent',
		textStyle: {
			fontFamily: 'system-ui, -apple-system, sans-serif',
			color: '#1C1C1C',
		},
		legend: {
			top: '2%',
			textStyle: {color: '#1C1C1C'},
		},
		tooltip: {
			trigger: 'axis',
			backgroundColor: '#1F2937',
			borderColor: '#334155',
			borderWidth: 1,
			textStyle: {color: '#f8fafc'},
			axisPointer: {type: 'cross', crossStyle: {color: '#9CA3AF'}},
			formatter: buildTooltipFormatter(unit, xAxisAlignment, elapsedToCalendar),
		},
		grid: {
			left: '3%',
			right: '4%',
			bottom: '18%',
			top: '12%',
			containLabel: true,
		},
		xAxis: {
			type: 'category',
			data: [...xCategories],
			axisLine: {lineStyle: {color: '#E5E7EB'}},
			axisLabel: {
				color: '#1C1C1C',
				// Auto-skip + hide overlapping labels when many dates are present
				// (comparison unions all periods' labels, so this can get dense).
				interval: 'auto',
				hideOverlap: true,
				rotate: xCategories.length > 30 ? 45 : 0,
			},
		},
		yAxis: {
			type: 'value',
			max: yAxisMax,
			min: 0,
			name: unitAxisName(unit),
			nameTextStyle: {color: '#1C1C1C', padding: [0, 0, 0, 10]},
			axisLine: {lineStyle: {color: '#E5E7EB'}},
			splitLine: {lineStyle: {color: '#E5E7EB'}},
			axisLabel: {color: '#1C1C1C'},
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
				handleStyle: {color: '#10b981'},
				textStyle: {color: '#6E6E6E'},
			},
			{
				type: 'inside',
			},
		],
		series: echartsSeries,
	};
}

/**
 * Compiles Tab 2 Comparison parameters into one standalone chart card per
 * period (Sequential Side-by-Side strategy). Each card shows a single series
 * for its own period. When Y-axis locking is enabled (§5.2), every card shares
 * the same Y maximum so volumes are visually comparable across the grid.
 *
 * @param input - Series list, unit, y-axis lock toggle, and x-axis alignment mode.
 * @returns Array of { period, option } entries for rendering as a grid.
 */
export function compileComparisonGridOptions(
	input: ComparisonCompilerInput,
): {period: string; option: EChartsOption}[] {
	const {seriesList, unit, lockYAxis, xAxisAlignment} = input;

	if (seriesList.length === 0) {
		return [{period: 'Comparison', option: emptyComparisonOption()}];
	}

	const {yAxisMax, xCategories, elapsedToCalendar} = computeComparisonLayout(
		seriesList,
		unit,
		lockYAxis,
		xAxisAlignment,
	);

	return seriesList.map((s, seriesIndex) => {
		const color =
			s.color ||
			DEFAULT_SERIES_PALETTE[seriesIndex % DEFAULT_SERIES_PALETTE.length];
		const data = alignSeriesData(s, unit, xAxisAlignment, xCategories);

		return {
			period: s.label,
			option: {
				backgroundColor: 'transparent',
				textStyle: {
					fontFamily: 'system-ui, -apple-system, sans-serif',
					color: '#1C1C1C',
				},
				tooltip: {
					trigger: 'axis',
					backgroundColor: '#1F2937',
					borderColor: '#334155',
					borderWidth: 1,
					textStyle: {color: '#f8fafc'},
					axisPointer: {type: 'cross', crossStyle: {color: '#9CA3AF'}},
					formatter: buildTooltipFormatter(
						unit,
						xAxisAlignment,
						elapsedToCalendar,
					),
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '10%',
					top: '8%',
					containLabel: true,
				},
				xAxis: {
					type: 'category',
					data: [...xCategories],
					axisLine: {lineStyle: {color: '#E5E7EB'}},
					axisLabel: {
						color: '#1C1C1C',
						// Auto-skip + hide overlapping labels when many dates are present
						// (comparison unions all periods' labels, so this can get dense).
						interval: 'auto',
						hideOverlap: true,
						rotate: xCategories.length > 30 ? 45 : 0,
					},
				},
				yAxis: {
					type: 'value',
					max: yAxisMax,
					min: 0,
					name: unitAxisName(unit),
					nameTextStyle: {color: '#1C1C1C', padding: [0, 0, 0, 10]},
					axisLine: {lineStyle: {color: '#E5E7EB'}},
					splitLine: {lineStyle: {color: '#E5E7EB'}},
					axisLabel: {color: '#1C1C1C'},
				},
				series: [
					{
						name: s.label,
						type: 'line' as const,
						data,
						smooth: true,
						symbolSize: 6,
						lineStyle: {color, width: 2.5},
						itemStyle: {color},
						connectNulls: false,
					},
				],
			},
		};
	});
}
