/**
 * @fileoverview Unit tests for the Tab 2 Comparison ECharts compiler:
 * strategy, Y-axis locking, x-axis alignment, and grid mode.
 */

import {describe, expect, it} from 'vitest';
import {
	compileComparisonGridOptions,
	compileComparisonOption,
	type ComparisonSeriesData,
} from '../comparison-compiler.js';

/** Helper to build a comparison series with explicit bucket values. */
function makeSeries(
	id: string,
	label: string,
	color: string,
	labels: readonly string[],
	values: readonly [number, number][],
): ComparisonSeriesData {
	return {
		id,
		label,
		color,
		buckets: labels.map((label, i) => {
			const [totalSeconds, sessionCount] = values[i] ?? [0, 0];
			return {
				label,
				startDate: new Date(2026, 0, 1),
				endDate: new Date(2026, 0, 31),
				totalSeconds,
				sessionCount,
			};
		}),
	};
}

const seriesA = makeSeries(
	'a',
	'2025',
	'#10b981',
	['Jan 2025', 'Feb 2025'],
	[
		[1800, 10],
		[3600, 20],
	],
);

const seriesB = makeSeries(
	'b',
	'2026',
	'#f59e0b',
	['Jan 2026', 'Feb 2026', 'Mar 2026'],
	[
		[900, 5],
		[1800, 8],
		[2700, 12],
	],
);

describe('compileComparisonOption — empty state', () => {
	it('returns an empty-state option when no periods exist', () => {
		const opt = compileComparisonOption({
			seriesList: [],
			unit: 'minutes',
			lockYAxis: true,
			xAxisAlignment: 'calendar',
		});
		expect(opt.title).toBeDefined();
		expect(opt.series).toBeUndefined();
	});
});

describe('compileComparisonOption — calendar alignment', () => {
	it('builds the union of labels as x categories in order', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual([
			'Jan 2025',
			'Feb 2025',
			'Jan 2026',
			'Feb 2026',
			'Mar 2026',
		]);

		const series = opt.series as Array<{data: (number | null)[]}>;
		// Series A has nulls where it has no bucket (Jan 2026, Feb 2026, Mar 2026).
		expect(series[0].data).toEqual([30, 60, null, null, null]);
		// Series B has nulls for 2025 slots.
		expect(series[1].data).toEqual([null, null, 15, 30, 45]);
	});

	it('auto-skips and hides overlapping x-axis labels for dense dates', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const xAxis = opt.xAxis as {
			axisLabel: {
				interval: string | number;
				hideOverlap?: boolean;
				rotate?: number;
			};
		};
		expect(xAxis.axisLabel.interval).toBe('auto');
		expect(xAxis.axisLabel.hideOverlap).toBe(true);
	});
});

describe('compileComparisonOption — elapsed alignment', () => {
	it('uses Day N categories up to the longest series', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual(['Day 1', 'Day 2', 'Day 3']);

		const series = opt.series as Array<{data: (number | null)[]}>;
		// Each series aligns from its own first bucket; the shorter series is
		// padded with trailing nulls to match the axis length (regression fix).
		expect(series[0].data).toEqual([30, 60, null]);
		expect(series[1].data).toEqual([15, 30, 45]);
	});
});

describe('compileComparisonOption — elapsed padding regression (7c)', () => {
	it('pads a shorter series with trailing nulls so both series render', () => {
		// seriesA has 2 buckets, seriesB has 3 → axis is length 3 (longest).
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'month',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual(['Month 1', 'Month 2', 'Month 3']);

		const series = opt.series as Array<{data: (number | null)[]}>;
		// Both series must have the SAME length as the axis (3).
		expect(series[0].data.length).toBe(3);
		expect(series[1].data.length).toBe(3);
		// The shorter series keeps its values then pads with null.
		expect(series[0].data).toEqual([30, 60, null]);
		// The longest series fills the whole axis.
		expect(series[1].data).toEqual([15, 30, 45]);
	});

	it('pads a shorter series with nulls in grid mode too', () => {
		const cards = compileComparisonGridOptions({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'month',
		});

		const x0 = cards[0].option.xAxis as {data: string[]};
		expect(x0.data).toEqual(['Month 1', 'Month 2', 'Month 3']);

		const s0 = cards[0].option.series as Array<{data: (number | null)[]}>;
		expect(s0[0].data).toEqual([30, 60, null]);
	});
});

describe('compileComparisonOption — elapsed labels reflect granularity (7c)', () => {
	it('uses Month N labels when granularity is month', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'month',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual(['Month 1', 'Month 2', 'Month 3']);
	});

	it('uses Week N labels when granularity is week', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'week',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual(['Week 1', 'Week 2', 'Week 3']);
	});

	it('uses QN labels when granularity is quarter', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'quarter',
		});

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual(['Q1', 'Q2', 'Q3']);
	});

	it('keeps the natural label for season/year granularity', () => {
		// Season/year have no standard relative prefix → use the longest
		// series' natural bucket labels for the shared slots.
		const seasonOpt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'season',
		});
		const seasonAxis = seasonOpt.xAxis as {data: string[]};
		// seriesB is the longest (3 buckets) → its natural labels.
		expect(seasonAxis.data).toEqual(['Jan 2026', 'Feb 2026', 'Mar 2026']);
	});
});

describe('compileComparisonGridOptions — elapsed granularity (7c)', () => {
	it('uses the granularity-based relative labels in grid mode', () => {
		const cards = compileComparisonGridOptions({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'elapsed',
			granularity: 'month',
		});

		const x0 = cards[0].option.xAxis as {data: string[]};
		expect(x0.data).toEqual(['Month 1', 'Month 2', 'Month 3']);
	});
});

describe('compileComparisonOption — Y-axis lock', () => {
	it('locks the Y-axis max across all series when lockYAxis is true', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: true,
			xAxisAlignment: 'calendar',
		});

		const yAxis = opt.yAxis as {max: number | undefined; min: number};
		// Global max = 60 minutes; 10% headroom → ceil(66) = 66.
		expect(yAxis.max).toBe(66);
		expect(yAxis.min).toBe(0);
	});

	it('leaves the Y-axis max undefined when lockYAxis is false', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const yAxis = opt.yAxis as {max: number | undefined; min: number};
		expect(yAxis.max).toBeUndefined();
		expect(yAxis.min).toBe(0);
	});
});

describe('compileComparisonOption — unit conversion', () => {
	it('computes session values as session counts', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA],
			unit: 'sessions',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const series = opt.series as Array<{data: (number | null)[]}>;
		expect(series[0].data).toEqual([10, 20]);
	});

	it('computes hour values from totalSeconds', () => {
		const opt = compileComparisonOption({
			seriesList: [seriesA],
			unit: 'hours',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const series = opt.series as Array<{data: (number | null)[]}>;
		expect(series[0].data).toEqual([0.5, 1]);
	});
});

describe('compileComparisonGridOptions — side-by-side strategy', () => {
	it('emits one chart per period with a locked shared Y max', () => {
		const cards = compileComparisonGridOptions({
			seriesList: [seriesA, seriesB],
			unit: 'minutes',
			lockYAxis: true,
			xAxisAlignment: 'calendar',
		});

		expect(cards.length).toBe(2);
		expect(cards[0].period).toBe('2025');
		expect(cards[1].period).toBe('2026');

		const y0 = cards[0].option.yAxis as {max: number | undefined};
		const y1 = cards[1].option.yAxis as {max: number | undefined};
		// Both cards share the global max with 10% headroom (max 60 → 66).
		expect(y0.max).toBe(66);
		expect(y1.max).toBe(66);

		// Each card's x-axis auto-skips/hides overlapping labels.
		const x0 = cards[0].option.xAxis as {
			axisLabel: {interval: string | number; hideOverlap?: boolean};
		};
		expect(x0.axisLabel.interval).toBe('auto');
		expect(x0.axisLabel.hideOverlap).toBe(true);
	});

	it('returns a single empty-state card when no periods exist', () => {
		const cards = compileComparisonGridOptions({
			seriesList: [],
			unit: 'minutes',
			lockYAxis: true,
			xAxisAlignment: 'calendar',
		});

		expect(cards.length).toBe(1);
		expect(cards[0].option.title).toBeDefined();
	});
});

describe('compileComparisonOption — defaults for missing color', () => {
	it('falls back to a palette color when a period has no explicit color', () => {
		const noColor = makeSeries(
			'c',
			'Default Color',
			'',
			['Jan 2026'],
			[[3600, 6]],
		);
		const opt = compileComparisonOption({
			seriesList: [seriesA, noColor],
			unit: 'minutes',
			lockYAxis: false,
			xAxisAlignment: 'calendar',
		});

		const series = opt.series as Array<{lineStyle: {color: string}}>;
		// Series A keeps its explicit color; the second falls back to palette[1].
		expect(series[0].lineStyle.color).toBe('#10b981');
		expect(series[1].lineStyle.color).toBe('#f59e0b');
	});
});
