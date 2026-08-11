/**
 * @fileoverview Unit tests for the i18n tooltip lookup helper.
 */

import { describe, expect, it } from 'vitest';
import { labelFor, tooltipFor } from '../Tooltips';

describe('tooltipFor', () => {
	it('returns the tooltip text for a known key', () => {
		const text = tooltipFor('timeWindow');
		expect(text).toContain('Quick presets');
		expect(text.length).toBeGreaterThan(0);
	});

	it('returns the display label for a known key', () => {
		expect(labelFor('timeWindow')).toBe('Time Window');
	});

	it('returns the tooltip text for every key in the catalog', () => {
		// Every key must have non-empty tooltip + label text.
		const keys = [
			'activities',
			'presets',
			'unit',
			'dateFrom',
			'dateTo',
			'timeWindow',
			'timelineFrom',
			'timelineTo',
			'granularity',
			'splitBy',
			'movingAverage',
			'statisticalOverlays',
			'comparisonStrategy',
			'lockYAxis',
			'xAxisAlignment',
			'comparisonFrom',
			'comparisonTo',
			'comparisonColor',
			'category',
			'chartStyle',
			'breakdownMode',
			'temporalGrouping',
			'metric',
			'threshold'
		] as const;

		for (const key of keys) {
			expect(tooltipFor(key).trim().length, `${key} tooltip`).toBeGreaterThan(0);
			expect(labelFor(key).trim().length, `${key} label`).toBeGreaterThan(0);
		}
	});
});
