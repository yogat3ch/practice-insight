/**
 * @fileoverview Integration unit tests for PracticeDataEngine state management and derived getters.
 */

import {describe, expect, it} from 'vitest';
import type {WorkerResult} from '../../types/session.js';
import {PracticeDataEngine} from '../PracticeDataEngine.svelte.js';

function makeMockWorkerResult(): WorkerResult {
	return {
		sessions: [
			{
				startedAt: new Date(2026, 6, 20, 10, 0, 0),
				durationSeconds: 1800,
				preset: '(No Preset)',
				activity: 'Meditation',
			},
			{
				startedAt: new Date(2026, 6, 21, 15, 0, 0),
				durationSeconds: 3600,
				preset: 'Morning Sit',
				activity: 'Meditation',
			},
			{
				startedAt: new Date(2026, 6, 22, 8, 0, 0),
				durationSeconds: 900,
				preset: '(No Preset)',
				activity: 'Yoga',
			},
		],
		skippedCount: 2,
		activities: ['Meditation', 'Yoga'],
		presets: ['Morning Sit'],
	};
}

describe('PracticeDataEngine Integration', () => {
	it('loads worker data correctly and initializes derived state', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		expect(engine.hasData).toBe(true);
		expect(engine.totalSessionCount).toBe(3);
		expect(engine.skippedCount).toBe(2);
		expect(engine.availableActivities).toEqual(['Meditation', 'Yoga']);
		expect(engine.availablePresets).toEqual(['Morning Sit']);
	});

	it('filters sessions by activity dynamically', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		engine.setActivityFilter(['Yoga']);
		expect(engine.filteredSessions.length).toBe(1);
		expect(engine.filteredSessions[0].activity).toBe('Yoga');

		engine.setActivityFilter([]);
		expect(engine.filteredSessions.length).toBe(3);
	});

	it('computes timeline statistics and generates valid ECharts options', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		expect(engine.timelineBuckets.length).toBeGreaterThan(0);
		expect(engine.timelineMean).toBeGreaterThan(0);

		const opt = engine.timelineOption;
		expect(opt).toHaveProperty('xAxis');
		expect(opt).toHaveProperty('yAxis');
		expect(opt).toHaveProperty('series');
	});

	it('clears state on clearData()', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		engine.clearData();
		expect(engine.hasData).toBe(false);
		expect(engine.totalSessionCount).toBe(0);
		expect(engine.filteredSessions.length).toBe(0);
	});

	it('returns raw dataset date bounds for All Time regardless of filters', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		// Raw bounds: Jul 20 – Jul 22, 2026.
		expect(engine.allSessionDateRange).toEqual([
			new Date(2026, 6, 20, 10, 0, 0),
			new Date(2026, 6, 22, 8, 0, 0),
		]);

		// Filtering must NOT shrink the All Time bounds.
		engine.setActivityFilter(['Yoga']);
		engine.setDateRange(new Date(2026, 6, 21), null);
		expect(engine.filteredSessions.length).toBe(1);
		expect(engine.allSessionDateRange).toEqual([
			new Date(2026, 6, 20, 10, 0, 0),
			new Date(2026, 6, 22, 8, 0, 0),
		]);
	});

	it('returns null All Time bounds when no data is loaded', () => {
		const engine = new PracticeDataEngine();
		expect(engine.allSessionDateRange).toBeNull();
	});

	it('exposes default distribution config with temporal grouping', () => {
		const engine = new PracticeDataEngine();
		expect(engine.distributionConfig.category).toBe('dayOfWeek');
		expect(engine.distributionConfig.chartStyle).toBe('heatmap');
		expect(engine.distributionConfig.metric).toBe('totalDuration');
		expect(engine.distributionConfig.thresholdMinutes).toBe(0);
		expect(engine.distributionConfig.temporalGrouping).toBe('month');
		expect(engine.distributionConfig.distributionStrategy).toBe('period');
		expect(engine.distributionConfig.breakdownMode).toBe('activity');
		expect(engine.distributionConfig.showDayOfWeekLabels).toBe(true);
	});

	it('wires distribution setters and updates derived config', () => {
		const engine = new PracticeDataEngine();
		engine.setDistributionCategory('timeOfDay');
		engine.setDistributionStyle('polar');
		engine.setDistributionMetric('sessionCount');
		engine.setTemporalGrouping('season');
		engine.setDistributionStrategy('grid');
		engine.setBreakdownMode('preset');
		engine.setThresholdMinutes(5);
		engine.setShowDayOfWeekLabels(false);

		expect(engine.distributionConfig.category).toBe('timeOfDay');
		expect(engine.distributionConfig.chartStyle).toBe('polar');
		expect(engine.distributionConfig.metric).toBe('sessionCount');
		expect(engine.distributionConfig.temporalGrouping).toBe('season');
		expect(engine.distributionConfig.distributionStrategy).toBe('grid');
		expect(engine.distributionConfig.breakdownMode).toBe('preset');
		expect(engine.distributionConfig.thresholdMinutes).toBe(5);
		expect(engine.distributionConfig.showDayOfWeekLabels).toBe(false);
	});

	it('generates a grouped heatmap matrix option when heatmap style is selected', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());
		engine.setDistributionCategory('dayOfWeek');
		engine.setDistributionStyle('heatmap');
		engine.setTemporalGrouping('month');

		const opt = engine.distributionOption;
		const series = opt.series as Array<{type: string; data: unknown[]}>;
		expect(series[0].type).toBe('heatmap');
		// One month row in the mock data (Jul 2026), 7 cells.
		expect(series[0].data.length).toBe(7);
	});

	it('switches distribution option to a polar clock for timeOfDay category', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());
		engine.setDistributionCategory('timeOfDay');
		engine.setDistributionStyle('polar');

		const opt = engine.distributionOption;
		expect(opt.polar).toBeDefined();
		const series = opt.series as Array<{coordinateSystem: string}>;
		expect(series[0].coordinateSystem).toBe('polar');
	});

	it('breaks down by preset when breakdownMode is preset', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());
		engine.setDistributionCategory('breakdown');
		engine.setDistributionStyle('donut');
		engine.setBreakdownMode('preset');

		const items = engine.categoryBreakdownItems;
		// "(No Preset)" and "Morning Sit" only — excludes any activity grouping.
		expect(items.map(i => i.name).sort()).toEqual([
			'(No Preset)',
			'Morning Sit',
		]);
	});

	it('suggests comparison colors cycling through the shared palette', () => {
		const engine = new PracticeDataEngine();
		// First period → palette[0] (emerald).
		expect(engine.suggestComparisonColor(0)).toBe('#10b981');
		// Subsequent periods advance through the palette.
		expect(engine.suggestComparisonColor(1)).toBe('#f59e0b');
		expect(engine.suggestComparisonColor(7)).toBe('#6366f1');
		// Repeats after the 8-color palette is exhausted.
		expect(engine.suggestComparisonColor(8)).toBe('#10b981');
		expect(engine.suggestComparisonColor(9)).toBe('#f59e0b');
	});

	it('renders grouped day-of-week comparison bars when bar + period strategy is active', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());
		engine.setDistributionCategory('dayOfWeek');
		engine.setDistributionStyle('bar');
		engine.setTemporalGrouping('month');
		engine.setDistributionStrategy('period');

		const opt = engine.distributionOption;
		const series = opt.series as Array<{name: string; data: number[]}>;
		// One series per temporal period (the mock spans a single month → 1 period).
		expect(series.length).toBeGreaterThanOrEqual(1);
		for (const s of series) expect(s.data.length).toBe(7);
	});

	it('falls back to a single day-of-week bar when grouping yields no periods', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());
		engine.setDistributionCategory('dayOfWeek');
		engine.setDistributionStyle('bar');
		engine.setTemporalGrouping('month');
		engine.setDistributionStrategy('grid');

		// Grid strategy with zero grouped periods → single fallback bar series.
		const opt = engine.distributionOption;
		const series = opt.series as Array<{name: string; data: number[]}>;
		expect(series.length).toBe(1);
	});

	it('returns per-period grid options only for dayOfWeek bar + grid strategy', () => {
		const engine = new PracticeDataEngine();
		engine.loadData(makeMockWorkerResult());

		// Default period strategy → no grid cards.
		engine.setDistributionCategory('dayOfWeek');
		engine.setDistributionStyle('bar');
		engine.setTemporalGrouping('month');
		expect(engine.dayOfWeekPeriodBarOptions).toEqual([]);

		// Grid strategy → one card per temporal period.
		engine.setDistributionStrategy('grid');
		const cards = engine.dayOfWeekPeriodBarOptions;
		expect(cards.length).toBeGreaterThanOrEqual(1);
		for (const card of cards) {
			expect(typeof card.period).toBe('string');
			expect(card.option).toBeDefined();
		}

		// Non-bar styles → empty (grid only applies to bar charts).
		engine.setDistributionStyle('heatmap');
		expect(engine.dayOfWeekPeriodBarOptions).toEqual([]);
	});
});
