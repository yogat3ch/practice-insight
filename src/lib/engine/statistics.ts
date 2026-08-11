/**
 * @fileoverview Pure statistical calculators and sliding-window moving averages.
 *
 * Implements context-relative Mean (μ), Standard Deviation (σ), Linear Trendline,
 * and boundary-padded symmetric moving averages per §3.4 of the specification.
 */

import {
	mean,
	sampleStandardDeviation,
	linearRegression,
} from 'simple-statistics';

/**
 * Computes the arithmetic mean (μ) of an array of numeric values.
 *
 * @param values - Array of numeric scalar values.
 * @returns Arithmetic mean, or 0 if array is empty.
 */
export function computeMean(values: number[]): number {
	if (values.length === 0) return 0;
	return mean(values);
}

/**
 * Computes the sample standard deviation (σ) of an array of numeric values.
 *
 * @param values - Array of numeric scalar values.
 * @returns Standard deviation, or 0 if fewer than 2 values exist.
 */
export function computeStandardDeviation(values: number[]): number {
	if (values.length < 2) return 0;
	return sampleStandardDeviation(values);
}

/** Linear regression result structure. */
export interface LinearRegressionResult {
	readonly slope: number;
	readonly intercept: number;
	/** Predicted values `y = slope * x + intercept` for x in 0..N-1. */
	readonly trendline: number[];
}

/**
 * Computes a linear regression trendline `y = slope * x + intercept` over indexed data points.
 *
 * @param values - Array of numeric values (y-coordinates).
 * @returns Slope, intercept, and predicted trendline values for each index.
 */
export function computeLinearRegression(
	values: number[],
): LinearRegressionResult {
	if (values.length === 0) {
		return {slope: 0, intercept: 0, trendline: []};
	}

	if (values.length === 1) {
		return {slope: 0, intercept: values[0], trendline: [values[0]]};
	}

	const points: Array<[number, number]> = values.map((y, x) => [x, y]);
	const line = linearRegression(points);

	const trendline = values.map((_, x) => line.m * x + line.b);

	return {
		slope: line.m,
		intercept: line.b,
		trendline,
	};
}

/**
 * Computes a symmetric sliding-window moving average without zero-padding at boundaries.
 *
 * Per §3.4 Rule 3.3:
 * "Moving average calculations use symmetric sliding windows. At dataset boundaries,
 * available trailing/leading points within the window are averaged without zero-padding."
 *
 * @param values - Array of numeric values.
 * @param windowSize - Moving average window size (number of points). If <= 1, returns values.
 * @returns Array of smoothed moving average values of equal length.
 */
export function computeSymmetricMovingAverage(
	values: number[],
	windowSize: number,
): number[] {
	if (values.length === 0) return [];
	if (windowSize <= 1) return [...values];

	const radius = Math.floor(windowSize / 2);
	const n = values.length;
	const smoothed: number[] = new Array(n);

	for (let i = 0; i < n; i++) {
		const start = Math.max(0, i - radius);
		const end = Math.min(n - 1, i + radius);

		let sum = 0;
		const count = end - start + 1;

		for (let j = start; j <= end; j++) {
			sum += values[j];
		}

		smoothed[i] = sum / count;
	}

	return smoothed;
}
