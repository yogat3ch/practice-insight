/**
 * @fileoverview Unit tests for statistical calculators and symmetric moving average.
 */

import { describe, it, expect } from 'vitest';
import {
	computeMean,
	computeStandardDeviation,
	computeLinearRegression,
	computeSymmetricMovingAverage
} from '../statistics.js';

describe('computeMean', () => {
	it('returns 0 for an empty array', () => {
		expect(computeMean([])).toBe(0);
	});

	it('computes arithmetic mean for positive numbers', () => {
		expect(computeMean([10, 20, 30, 40, 50])).toBe(30);
	});

	it('computes mean for a single element', () => {
		expect(computeMean([42])).toBe(42);
	});
});

describe('computeStandardDeviation', () => {
	it('returns 0 for an empty or single-element array', () => {
		expect(computeStandardDeviation([])).toBe(0);
		expect(computeStandardDeviation([10])).toBe(0);
	});

	it('computes sample standard deviation correctly', () => {
		const std = computeStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
		expect(std).toBeCloseTo(2.138, 2);
	});
});

describe('computeLinearRegression', () => {
	it('returns 0 slope/intercept for empty input', () => {
		const res = computeLinearRegression([]);
		expect(res.slope).toBe(0);
		expect(res.intercept).toBe(0);
		expect(res.trendline).toEqual([]);
	});

	it('computes linear regression line y = 2x + 1', () => {
		// x = [0, 1, 2, 3], y = [1, 3, 5, 7]
		const res = computeLinearRegression([1, 3, 5, 7]);
		expect(res.slope).toBeCloseTo(2, 5);
		expect(res.intercept).toBeCloseTo(1, 5);
		expect(res.trendline[0]).toBeCloseTo(1, 5);
		expect(res.trendline[3]).toBeCloseTo(7, 5);
	});
});

describe('computeSymmetricMovingAverage (§3.4 Rule 3.3)', () => {
	it('returns a copy of array when windowSize <= 1', () => {
		expect(computeSymmetricMovingAverage([10, 20, 30], 1)).toEqual([10, 20, 30]);
		expect(computeSymmetricMovingAverage([10, 20, 30], 0)).toEqual([10, 20, 30]);
	});

	it('averages available boundary points without zero-padding', () => {
		// values: [10, 20, 30, 40, 50], windowSize: 3 (radius = 1)
		// index 0: (10 + 20) / 2 = 15 (boundary: no leading point)
		// index 1: (10 + 20 + 30) / 3 = 20
		// index 2: (20 + 30 + 40) / 3 = 30
		// index 3: (30 + 40 + 50) / 3 = 40
		// index 4: (40 + 50) / 2 = 45 (boundary: no trailing point)
		const smoothed = computeSymmetricMovingAverage([10, 20, 30, 40, 50], 3);

		expect(smoothed[0]).toBe(15);
		expect(smoothed[1]).toBe(20);
		expect(smoothed[2]).toBe(30);
		expect(smoothed[3]).toBe(40);
		expect(smoothed[4]).toBe(45);
	});
});
