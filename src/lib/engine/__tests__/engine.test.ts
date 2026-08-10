/**
 * @fileoverview Integration unit tests for PracticeDataEngine state management and derived getters.
 */

import { describe, it, expect } from 'vitest';
import { PracticeDataEngine } from '../PracticeDataEngine.svelte.js';
import type { WorkerResult } from '../../types/session.js';

function makeMockWorkerResult(): WorkerResult {
	return {
		sessions: [
			{
				startedAt: new Date(2026, 6, 20, 10, 0, 0),
				durationSeconds: 1800,
				preset: '(No Preset)',
				activity: 'Meditation'
			},
			{
				startedAt: new Date(2026, 6, 21, 15, 0, 0),
				durationSeconds: 3600,
				preset: 'Morning Sit',
				activity: 'Meditation'
			},
			{
				startedAt: new Date(2026, 6, 22, 8, 0, 0),
				durationSeconds: 900,
				preset: '(No Preset)',
				activity: 'Yoga'
			}
		],
		skippedCount: 2,
		activities: ['Meditation', 'Yoga'],
		presets: ['Morning Sit']
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
});
