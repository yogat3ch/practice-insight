/**
 * @fileoverview Unit tests for the Tab 3 Distribution ECharts compiler:
 * category, chart style, metric, temporal grouping, and threshold flow.
 */

import {describe, expect, it} from 'vitest';
import type {SessionEntry} from '../../../types/session.js';
import {
	computeCategoryPeriodBreakdown,
	computeDayOfWeekPeriodDistribution,
	metricValueOf,
	type CategoryBreakdownItem,
	type DayOfWeekBin,
	type TimeOfDayBin,
} from '../../distribution.js';
import {
	compileCategoryBreakdownOption,
	compileCategoryPeriodBars,
	compileCategoryStackedBar,
	compileDayOfWeekHeatmapMatrix,
	compileDayOfWeekOption,
	compileDayOfWeekPeriodBars,
	compileTimeOfDayOption,
	compileTimeOfDayPeriodHistogram,
	emptyDistributionOption,
	unitAxisName,
} from '../distribution-compiler.js';

/** Builds a 7-bin day-of-week calculation with explicit values. */
function makeDayBins(values: readonly number[]): DayOfWeekBin[] {
	const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	return names.map((name, i) => {
		const totalValue = values[i] ?? 0;
		const sessionCount = totalValue > 0 ? 2 : 0;
		return {
			dayIndex: i,
			dayName: name,
			sessionCount,
			totalValue,
			averageValue: sessionCount > 0 ? totalValue / sessionCount : 0,
		};
	});
}

/** Builds a 24-bin time-of-day calculation with explicit values. */
function makeHourBins(values: readonly number[]): TimeOfDayBin[] {
	return Array.from({length: 24}, (_, hour) => {
		const totalValue = values[hour] ?? 0;
		const sessionCount = totalValue > 0 ? 1 : 0;
		return {
			hour,
			hourLabel: `${hour.toString().padStart(2, '0')}:00`,
			sessionCount,
			totalValue,
			averageValue: totalValue,
		};
	});
}

function makeBreakdownItems(): CategoryBreakdownItem[] {
	return [
		{
			name: 'Meditation',
			sessionCount: 3,
			totalValue: 90,
			averageValue: 30,
			percentage: 60,
		},
		{
			name: 'Yoga',
			sessionCount: 2,
			totalValue: 60,
			averageValue: 30,
			percentage: 40,
		},
	];
}

function makeSession(
	date: Date,
	durationSeconds: number,
	activity: string,
	preset = '(No Preset)',
): SessionEntry {
	return {startedAt: date, durationSeconds, activity, preset};
}

describe('unitAxisName', () => {
	it('title-cases the unit for axis labels', () => {
		expect(unitAxisName('minutes')).toBe('Minutes');
		expect(unitAxisName('hours')).toBe('Hours');
		expect(unitAxisName('sessions')).toBe('Sessions');
	});
});

describe('metricValueOf (§5.3 metric flow)', () => {
	it('returns total duration by default', () => {
		expect(metricValueOf(90, 3, 30, 'totalDuration')).toBe(90);
	});
	it('returns session count for sessionCount metric', () => {
		expect(metricValueOf(90, 3, 30, 'sessionCount')).toBe(3);
	});
	it('returns average session length for averageDuration metric', () => {
		expect(metricValueOf(90, 3, 30, 'averageDuration')).toBe(30);
	});
});

describe('compileDayOfWeekOption — bar chart', () => {
	it('uses total duration values by default', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20, 30]),
			'minutes',
			'bar',
		);
		const series = opt.series as Array<{data: number[]}>;
		expect(series[0].data).toEqual([10, 20, 30, 0, 0, 0, 0]);
	});

	it('switches to session counts when metric is sessionCount', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20, 30]),
			'minutes',
			'bar',
			'sessionCount',
		);
		const series = opt.series as Array<{data: number[]}>;
		// Each non-zero bin has sessionCount 2.
		expect(series[0].data).toEqual([2, 2, 2, 0, 0, 0, 0]);
	});

	it('switches to average duration when metric is averageDuration', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20, 30]),
			'minutes',
			'bar',
			'averageDuration',
		);
		const series = opt.series as Array<{data: number[]}>;
		// totalValue 10 / count 2 = 5; 20/2 = 10; 30/2 = 15.
		expect(series[0].data).toEqual([5, 10, 15, 0, 0, 0, 0]);
	});
});

describe('compileDayOfWeekOption — heatmap', () => {
	it('emits a single-row heatmap with cool-to-warm visualMap', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20]),
			'minutes',
			'heatmap',
		);
		const series = opt.series as Array<{
			type: string;
			data: [number, number, number][];
		}>;
		expect(series[0].type).toBe('heatmap');
		expect(series[0].data.length).toBe(7);
		// Row index 0 for all cells.
		expect(series[0].data[0]).toEqual([0, 0, 10]);
		expect(opt.visualMap).toBeDefined();
	});

	it('formats heatmap visualMap labels to one decimal place by default', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20]),
			'minutes',
			'heatmap',
		);
		const vm = opt.visualMap as {show: boolean; precision: number};
		expect(vm.show).toBe(true);
		expect(vm.precision).toBe(1);
	});

	it('hides heatmap visualMap labels when showLabels is false', () => {
		const opt = compileDayOfWeekOption(
			makeDayBins([10, 20]),
			'minutes',
			'heatmap',
			'totalDuration',
			false,
		);
		const vm = opt.visualMap as {show: boolean};
		expect(vm.show).toBe(false);
	});

	it('rounds heatmap series labels to one decimal and toggles via series.label.show', () => {
		// showLabels=true → labels visible, formatter rounds to 1 decimal.
		const shown = compileDayOfWeekOption(
			makeDayBins([10.456, 20]),
			'minutes',
			'heatmap',
			'totalDuration',
			true,
		);
		const shownSeries = shown.series as Array<{
			label: {show: boolean; formatter: (p: any) => string};
		}>;
		expect(shownSeries[0].label.show).toBe(true);
		// Formatter rounds a heatmap [x, y, value] cell to 1 decimal.
		expect(shownSeries[0].label.formatter({value: [0, 0, 10.456]})).toBe(
			'10.5',
		);

		// showLabels=false → series cell labels hidden (the "Show value labels" toggle).
		const hidden = compileDayOfWeekOption(
			makeDayBins([10, 20]),
			'minutes',
			'heatmap',
			'totalDuration',
			false,
		);
		const hiddenSeries = hidden.series as Array<{
			label: {show: boolean};
		}>;
		expect(hiddenSeries[0].label.show).toBe(false);
	});
});

describe('compileDayOfWeekHeatmapMatrix (§5.3 temporal grouping)', () => {
	it('builds one row per temporal period', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10, 20, 30, 0, 0, 0, 0])},
			{period: 'Aug 2026', bins: makeDayBins([40, 50, 60, 0, 0, 0, 0])},
		];
		const opt = compileDayOfWeekHeatmapMatrix(
			periodBins,
			'minutes',
			'totalDuration',
			'month',
		);

		const yAxis = opt.yAxis as {data: string[]};
		expect(yAxis.data).toEqual(['Jul 2026', 'Aug 2026']);

		const series = opt.series as Array<{data: [number, number, number][]}>;
		// 2 rows × 7 columns.
		expect(series[0].data.length).toBe(14);
		// Row 1, col 0 cell carries Aug 2026's Monday value.
		expect(series[0].data[7]).toEqual([0, 1, 40]);
	});

	it('applies the metric to each cell', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10, 20, 0, 0, 0, 0, 0])},
		];
		const opt = compileDayOfWeekHeatmapMatrix(
			periodBins,
			'minutes',
			'sessionCount',
			'month',
		);
		const series = opt.series as Array<{data: [number, number, number][]}>;
		// 10 minutes / 2 sessions = 5 average for Monday.
		const avgOpt = compileDayOfWeekHeatmapMatrix(
			periodBins,
			'minutes',
			'averageDuration',
			'month',
		);
		const avgSeries = avgOpt.series as Array<{
			data: [number, number, number][];
		}>;
		expect(avgSeries[0].data[0]).toEqual([0, 0, 5]);
		// Session-count metric: 2 sessions per non-zero bin.
		expect(series[0].data[0]).toEqual([0, 0, 2]);
	});

	it('formats heatmap matrix visualMap labels to one decimal and honors showLabels', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10, 20, 0, 0, 0, 0, 0])},
		];
		const shown = compileDayOfWeekHeatmapMatrix(
			periodBins,
			'minutes',
			'totalDuration',
			'month',
			true,
		);
		const shownVm = shown.visualMap as {show: boolean; precision: number};
		expect(shownVm.show).toBe(true);
		expect(shownVm.precision).toBe(1);

		// Series cell labels follow the same toggle and round to 1 decimal.
		const shownSeries = shown.series as Array<{
			label: {show: boolean; formatter: (p: any) => string};
		}>;
		expect(shownSeries[0].label.show).toBe(true);
		expect(shownSeries[0].label.formatter({value: [0, 0, 12.345]})).toBe(
			'12.3',
		);

		const hidden = compileDayOfWeekHeatmapMatrix(
			periodBins,
			'minutes',
			'totalDuration',
			'month',
			false,
		);
		const hiddenVm = hidden.visualMap as {show: boolean};
		expect(hiddenVm.show).toBe(false);
		const hiddenSeries = hidden.series as Array<{
			label: {show: boolean};
		}>;
		expect(hiddenSeries[0].label.show).toBe(false);
	});
});

describe('compileDayOfWeekPeriodBars (7c grouped comparison)', () => {
	it('emits one bar series per temporal period with 7 day values', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10, 20, 30, 0, 0, 0, 0])},
			{period: 'Aug 2026', bins: makeDayBins([40, 50, 60, 0, 0, 0, 0])},
			{period: 'Sep 2026', bins: makeDayBins([70, 80, 90, 0, 0, 0, 0])},
		];
		const opt = compileDayOfWeekPeriodBars(
			periodBins,
			'minutes',
			'totalDuration',
		);

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data).toEqual([
			'Mon',
			'Tue',
			'Wed',
			'Thu',
			'Fri',
			'Sat',
			'Sun',
		]);

		const series = opt.series as Array<{
			name: string;
			data: number[];
		}>;
		expect(series.length).toBe(3);
		expect(series.map(s => s.name)).toEqual([
			'Jul 2026',
			'Aug 2026',
			'Sep 2026',
		]);
		// Each series has exactly 7 day values.
		for (const s of series) expect(s.data.length).toBe(7);
		// First period's Monday/Tuesday/Wednesday values.
		expect(series[0].data).toEqual([10, 20, 30, 0, 0, 0, 0]);
		expect(series[1].data[0]).toBe(40);
		expect(series[2].data[2]).toBe(90);
	});

	it('applies the metric via metricValueOf', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10, 20, 0, 0, 0, 0, 0])},
		];
		// averageDuration: 10/2 = 5, 20/2 = 10.
		const avg = compileDayOfWeekPeriodBars(
			periodBins,
			'minutes',
			'averageDuration',
		);
		const avgSeries = avg.series as Array<{data: number[]}>;
		expect(avgSeries[0].data).toEqual([5, 10, 0, 0, 0, 0, 0]);

		// sessionCount: 2 sessions per non-zero bin.
		const count = compileDayOfWeekPeriodBars(
			periodBins,
			'minutes',
			'sessionCount',
		);
		const countSeries = count.series as Array<{data: number[]}>;
		expect(countSeries[0].data).toEqual([2, 2, 0, 0, 0, 0, 0]);
	});

	it('assigns colors from the shared DEFAULT_SERIES_PALETTE (cycles after 8)', () => {
		const periodBins = Array.from({length: 9}, (_, i) => ({
			period: `P${i + 1}`,
			bins: makeDayBins([10]),
		}));
		const opt = compileDayOfWeekPeriodBars(
			periodBins,
			'minutes',
			'totalDuration',
		);
		const series = opt.series as Array<{
			itemStyle: {color: string};
		}>;
		// Series 0..7 use palette[0..7]; series 8 wraps back to palette[0].
		expect(series[0].itemStyle.color).toBe('#10b981');
		expect(series[7].itemStyle.color).toBe('#6366f1');
		expect(series[8].itemStyle.color).toBe('#10b981');
	});

	it('shows a legend and axis-trigger tooltip for period identification', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeDayBins([10])},
			{period: 'Aug 2026', bins: makeDayBins([20])},
		];
		const opt = compileDayOfWeekPeriodBars(
			periodBins,
			'minutes',
			'totalDuration',
		);
		expect(opt.legend).toBeDefined();
		const tooltip = opt.tooltip as {trigger: string};
		expect(tooltip.trigger).toBe('axis');
	});
});

describe('compileTimeOfDayPeriodHistogram (7c grouped comparison)', () => {
	it('emits one bar series per temporal period across 24 hourly bins', () => {
		const periodBins = [
			{period: 'Jul 2026', bins: makeHourBins([5, 10])},
			{period: 'Aug 2026', bins: makeHourBins([15, 20])},
		];
		const opt = compileTimeOfDayPeriodHistogram(
			periodBins,
			'minutes',
			'totalDuration',
		);

		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data.length).toBe(24);

		const series = opt.series as Array<{name: string; data: number[]}>;
		expect(series.length).toBe(2);
		expect(series.map(s => s.name)).toEqual(['Jul 2026', 'Aug 2026']);
		for (const s of series) expect(s.data.length).toBe(24);
		expect(series[0].data[0]).toBe(5);
		expect(series[0].data[1]).toBe(10);
		expect(series[1].data[0]).toBe(15);
	});

	it('applies the metric and legend', () => {
		const periodBins = [{period: 'Jul 2026', bins: makeHourBins([5, 10])}];
		const opt = compileTimeOfDayPeriodHistogram(
			periodBins,
			'minutes',
			'sessionCount',
		);
		const series = opt.series as Array<{data: number[]}>;
		// sessionCount: 1 per non-zero bin.
		expect(series[0].data[0]).toBe(1);
		expect(opt.legend).toBeDefined();
	});
});

describe('compileCategoryPeriodBars (7c grouped comparison)', () => {
	it('emits one bar series per category across temporal periods', () => {
		const periodItems = [
			{
				period: 'Jul 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 3,
						totalValue: 90,
						averageValue: 30,
						percentage: 60,
					},
					{
						name: 'Breathwork',
						sessionCount: 1,
						totalValue: 10,
						averageValue: 10,
						percentage: 40,
					},
				],
			},
			{
				period: 'Aug 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 2,
						totalValue: 60,
						averageValue: 30,
						percentage: 60,
					},
					{
						name: 'Yoga',
						sessionCount: 2,
						totalValue: 40,
						averageValue: 20,
						percentage: 40,
					},
				],
			},
		];
		const opt = compileCategoryPeriodBars(
			periodItems,
			'minutes',
			'totalDuration',
		);

		const xAxis = opt.xAxis as {data: string[]};
		// Union of categories: Meditation, Breathwork, Yoga.
		expect(xAxis.data).toEqual(['Meditation', 'Breathwork', 'Yoga']);

		const series = opt.series as Array<{name: string; data: number[]}>;
		expect(series.length).toBe(3);
		// Each series spans both periods (one value per period).
		expect(series[0].data.length).toBe(2);
	});

	it('fills missing periods with 0 for a category absent in that period', () => {
		const periodItems = [
			{
				period: 'Jul 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 3,
						totalValue: 90,
						averageValue: 30,
						percentage: 60,
					},
					{
						name: 'Breathwork',
						sessionCount: 1,
						totalValue: 10,
						averageValue: 10,
						percentage: 40,
					},
				],
			},
			{
				period: 'Aug 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 2,
						totalValue: 60,
						averageValue: 30,
						percentage: 60,
					},
					{
						name: 'Yoga',
						sessionCount: 2,
						totalValue: 40,
						averageValue: 20,
						percentage: 40,
					},
				],
			},
		];
		const opt = compileCategoryPeriodBars(
			periodItems,
			'minutes',
			'totalDuration',
		);
		const series = opt.series as Array<{name: string; data: number[]}>;
		// Breathwork exists in Jul only → 0 in Aug.
		const breathwork = series.find(s => s.name === 'Breathwork');
		expect(breathwork?.data).toEqual([10, 0]);
		// Yoga exists in Aug only → 0 in Jul.
		const yoga = series.find(s => s.name === 'Yoga');
		expect(yoga?.data).toEqual([0, 40]);
	});
});

describe('compileTimeOfDayOption', () => {
	it('emits an hourly histogram with 24 bins', () => {
		const opt = compileTimeOfDayOption(
			makeHourBins([5, 10]),
			'hours',
			'histogram',
		);
		const xAxis = opt.xAxis as {data: string[]};
		expect(xAxis.data.length).toBe(24);
		const series = opt.series as Array<{data: number[]}>;
		expect(series[0].data[0]).toBe(5);
		expect(series[0].data[1]).toBe(10);
	});

	it('emits a polar clock with coordinateSystem polar', () => {
		const opt = compileTimeOfDayOption(makeHourBins([5, 10]), 'hours', 'polar');
		expect(opt.polar).toBeDefined();
		const series = opt.series as Array<{coordinateSystem: string}>;
		expect(series[0].coordinateSystem).toBe('polar');
	});

	it('applies the metric to histogram values', () => {
		const opt = compileTimeOfDayOption(
			makeHourBins([5, 10]),
			'minutes',
			'histogram',
			'sessionCount',
		);
		const series = opt.series as Array<{data: number[]}>;
		expect(series[0].data[0]).toBe(1); // one session per non-zero bin
	});
});

describe('compileCategoryBreakdownOption', () => {
	it('emits a donut when style is donut', () => {
		const opt = compileCategoryBreakdownOption(
			makeBreakdownItems(),
			'minutes',
			'donut',
		);
		const series = opt.series as Array<{
			type: string;
			data: {name: string; value: number}[];
		}>;
		expect(series[0].type).toBe('pie');
		expect(series[0].data).toEqual([
			{name: 'Meditation', value: 90},
			{name: 'Yoga', value: 60},
		]);
	});

	it('emits stacked bar segments per category when style is stackedBar', () => {
		const opt = compileCategoryBreakdownOption(
			makeBreakdownItems(),
			'minutes',
			'stackedBar',
		);
		const series = opt.series as Array<{
			name: string;
			stack: string;
			data: number[];
		}>;
		expect(series.length).toBe(2);
		expect(series[0].name).toBe('Meditation');
		expect(series[0].stack).toBe('total');
		expect(series[0].data).toEqual([90]);
	});

	it('applies the metric to the donut values', () => {
		const opt = compileCategoryBreakdownOption(
			makeBreakdownItems(),
			'minutes',
			'donut',
			'sessionCount',
		);
		const series = opt.series as Array<{data: {value: number}[]}>;
		expect(series[0].data[0].value).toBe(3);
	});
});

describe('compileCategoryStackedBar (§5.3 temporal grouping)', () => {
	it('emits one stacked bar per temporal period with per-period segments', () => {
		const periodItems = [
			{
				period: 'Jul 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 3,
						totalValue: 90,
						averageValue: 30,
						percentage: 60,
					},
					{
						name: 'Yoga',
						sessionCount: 2,
						totalValue: 60,
						averageValue: 30,
						percentage: 40,
					},
				],
			},
			{
				period: 'Aug 2026',
				items: [
					{
						name: 'Meditation',
						sessionCount: 1,
						totalValue: 30,
						averageValue: 30,
						percentage: 100,
					},
				],
			},
		];
		const opt = compileCategoryStackedBar(
			periodItems,
			'minutes',
			'totalDuration',
			'month',
		);

		const yAxis = opt.yAxis as {data: string[]};
		expect(yAxis.data).toEqual(['Jul 2026', 'Aug 2026']);

		const series = opt.series as Array<{name: string; data: number[]}>;
		expect(series.length).toBe(2); // Meditation + Yoga
		expect(series[0].name).toBe('Meditation');
		// Meditation: 90 in Jul, 30 in Aug. Yoga: 60 in Jul, 0 in Aug.
		expect(series[0].data).toEqual([90, 30]);
		expect(series[1].data).toEqual([60, 0]);
	});
});

describe('emptyDistributionOption', () => {
	it('returns a title-only empty state', () => {
		const opt = emptyDistributionOption();
		expect(opt.title).toBeDefined();
		expect(opt.series).toBeUndefined();
	});
});

describe('per-period calculator integration', () => {
	const sessions: SessionEntry[] = [
		makeSession(new Date(2026, 6, 20, 10, 0, 0), 1800, 'Meditation'), // Mon Jul 20
		makeSession(new Date(2026, 6, 21, 15, 0, 0), 3600, 'Meditation'), // Tue Jul 21
		makeSession(new Date(2026, 6, 23, 8, 0, 0), 900, 'Yoga'), // Thu Jul 23
	];

	it('groups day-of-week bins by month into periods', () => {
		const periods = computeDayOfWeekPeriodDistribution(
			sessions,
			'minutes',
			0,
			'month',
		);
		expect(periods.length).toBe(1);
		expect(periods[0].period).toBe('Jul 2026');
		const bins = periods[0].bins;
		// Monday 30 min, Tuesday 60 min, Thursday 15 min (Mon=0).
		expect(bins[0].totalValue).toBe(30);
		expect(bins[1].totalValue).toBe(60);
		expect(bins[3].totalValue).toBe(15);
	});

	it('groups category breakdown by quarter into periods', () => {
		const periods = computeCategoryPeriodBreakdown(
			sessions,
			'minutes',
			'activity',
			0,
			'quarter',
		);
		expect(periods.length).toBe(1);
		expect(periods[0].period).toBe('Q3 2026');
		const meditation = periods[0].items.find(i => i.name === 'Meditation');
		const yoga = periods[0].items.find(i => i.name === 'Yoga');
		expect(meditation?.totalValue).toBe(90);
		expect(yoga?.totalValue).toBe(15);
	});

	it('honors the threshold by excluding short sessions', () => {
		// Threshold of 20 minutes excludes the 15-minute Yoga session.
		const periods = computeCategoryPeriodBreakdown(
			sessions,
			'minutes',
			'activity',
			20,
			'month',
		);
		expect(periods.length).toBe(1);
		const yoga = periods[0].items.find(i => i.name === 'Yoga');
		expect(yoga).toBeUndefined();
		const meditation = periods[0].items.find(i => i.name === 'Meditation');
		expect(meditation?.totalValue).toBe(90);
	});
});
