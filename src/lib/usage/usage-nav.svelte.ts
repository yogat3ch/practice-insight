/**
 * Shared reactive state for in-app documentation navigation.
 *
 * Lets any component (e.g. the CSV card's help link) request the Usage tab to
 * open a specific document (e.g. the Insight Timer export guide). Because the
 * UsageView component mounts fresh on each tab switch, it reads the pending
 * request during initialization and clears it after consuming.
 */
import {engine} from '../engine/PracticeDataEngine.svelte.js';

/**
 * The doc id currently requested for display in the Usage tab, or an empty
 * string if none is pending.
 */
let pendingDocId = $state('');

/**
 * Sets the doc to show in the Usage tab and switches to that tab.
 * @param {string} docId
 * @returns {void}
 */
export function openUsageDoc(docId: string): void {
	pendingDocId = docId;
	engine.setTab('usage');
}

/**
 * Reads and clears the pending doc id (called by UsageView on mount).
 * @returns {string}
 */
export function consumeUsageDoc(): string {
	const id = pendingDocId;
	pendingDocId = '';
	return id;
}
