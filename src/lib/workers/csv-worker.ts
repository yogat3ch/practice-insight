/**
 * @fileoverview PapaParse CSV Web Worker.
 *
 * Runs entirely off the main thread. Receives a File object or CSV text string
 * via postMessage, parses it with PapaParse, validates each row, and posts a
 * typed WorkerMessage back to the main thread.
 *
 * Instantiated by parse-csv.ts using Vite's ?worker import syntax.
 */

import Papa from 'papaparse';
import { validateRow, extractFilters } from '../utils/csv-parser.js';
import type { CsvRow, SessionEntry, WorkerMessage } from '../types/session.js';

type IncomingMessage = { file: File } | { text: string };

self.onmessage = (event: MessageEvent<IncomingMessage>): void => {
	const data = event.data;

	try {
		const sessions: SessionEntry[] = [];
		let skippedCount = 0;

		const onComplete = (results: Papa.ParseResult<CsvRow>): void => {
			for (const row of results.data) {
				const entry = validateRow(row);
				if (entry !== null) {
					sessions.push(entry);
				} else {
					skippedCount++;
				}
			}

			const { activities, presets } = extractFilters(sessions);

			const message: WorkerMessage = {
				type: 'result',
				payload: { sessions, skippedCount, activities, presets }
			};

			self.postMessage(message);
		};

		const onError = (error: Error): void => {
			const message: WorkerMessage = {
				type: 'error',
				message: error.message
			};
			self.postMessage(message);
		};

		if ('file' in data) {
			Papa.parse<CsvRow, File>(data.file, {
				header: true,
				skipEmptyLines: true,
				complete: onComplete,
				error: onError
			});
		} else {
			Papa.parse<CsvRow>(data.text, {
				header: true,
				skipEmptyLines: true,
				complete: onComplete,
				error: onError
			});
		}
	} catch (err) {
		const message: WorkerMessage = {
			type: 'error',
			message: err instanceof Error ? err.message : 'Unknown worker error'
		};
		self.postMessage(message);
	}
};
