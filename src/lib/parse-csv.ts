/**
 * @fileoverview Worker bridge — spawns the CSV Web Worker and provides a
 * typed async API for the main thread.
 *
 * Two entry points:
 *   - parseCSV(source)           — parse a user-uploaded File or raw CSV string
 *   - fetchAndParseSampleCSV()   — fetch /sample.csv and parse it on boot
 */

import type {WorkerMessage, WorkerResult} from './types/session.js';

/** Timeout in milliseconds before a parse operation is considered failed. */
const PARSE_TIMEOUT_MS = 30_000;

/**
 * Spawns a fresh CSV Web Worker, sends `source`, and returns the parsed result.
 * The worker is terminated after completion or error.
 *
 * @param source - A user-supplied File object or raw CSV text string.
 * @returns Promise resolving to a WorkerResult.
 * @throws Error if the worker times out or reports a parse error.
 */
export function parseCSV(source: File | string): Promise<WorkerResult> {
	return new Promise<WorkerResult>((resolve, reject) => {
		// Vite bundles the worker at build time via ?worker URL pattern
		const worker = new Worker(
			new URL('./workers/csv-worker.ts', import.meta.url),
			{
				type: 'module',
			},
		);

		const timer = setTimeout(() => {
			worker.terminate();
			reject(new Error('CSV parse timed out after 30 seconds'));
		}, PARSE_TIMEOUT_MS);

		worker.onmessage = (event: MessageEvent<WorkerMessage>): void => {
			clearTimeout(timer);
			worker.terminate();

			const msg = event.data;
			if (msg.type === 'result') {
				resolve(msg.payload);
			} else {
				reject(new Error(msg.message));
			}
		};

		worker.onerror = (event: ErrorEvent): void => {
			clearTimeout(timer);
			worker.terminate();
			reject(new Error(event.message ?? 'Unknown worker error'));
		};

		if (typeof source === 'string') {
			worker.postMessage({text: source});
		} else {
			worker.postMessage({file: source});
		}
	});
}

/**
 * Fetches the bundled `/sample.csv` static asset and parses it via the worker.
 * Called on application boot to populate the engine with default data.
 * Users can replace this data by uploading their own CSV file.
 *
 * @returns Promise resolving to the parsed WorkerResult from the sample dataset.
 * @throws Error if the fetch fails or parsing fails.
 */
export async function fetchAndParseSampleCSV(): Promise<WorkerResult> {
	const response = await fetch('/sample.csv');
	if (!response.ok) {
		throw new Error(
			`Failed to fetch sample CSV: ${response.status} ${response.statusText}`,
		);
	}
	const text = await response.text();
	return parseCSV(text);
}
