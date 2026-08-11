/**
 * @fileoverview Centralized tooltip lookup for control-panel inputs.
 *
 * Tooltip text lives in `en.json`, keyed by a stable camelCase id per input.
 * Components pass the key to `Tooltip.svelte`, which renders the help icon and
 * resolves the text via `tooltipFor()`.
 */

import en from './en.json';

/**
 * Union of every tooltip key present in `en.json`. Kept in sync with the JSON
 * file — adding a new key here both documents the key and type-checks lookups.
 */
export type TooltipKey = keyof typeof en;

/**
 * Returns the tooltip text for a given input key. Falls back to an empty
 * string if the key is missing (so a missing translation never crashes the UI).
 */
export function tooltipFor(key: TooltipKey): string {
	const entry = en[key];
	return entry?.tooltip ?? '';
}

/** Returns the display label for a given input key (used for testing). */
export function labelFor(key: TooltipKey): string {
	const entry = en[key];
	return entry?.label ?? '';
}
