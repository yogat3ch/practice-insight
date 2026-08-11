/**
 * @fileoverview Core session data types for the Practice Insight ingestion pipeline.
 */

/** A validated, parsed row from an Insight Timer CSV export. */
export interface SessionEntry {
	/** Parsed from "Started At" column. Attribution is 100% to this timestamp. */
	readonly startedAt: Date;
	/** Total practice duration in seconds, parsed from "Duration" (h:m:s, non-zero-padded). */
	readonly durationSeconds: number;
	/**
	 * Practice preset name. Empty or missing values are normalized to the
	 * constant NO_PRESET sentinel.
	 */
	readonly preset: string;
	/** Practice category (e.g. "Meditation", "Yoga"). */
	readonly activity: string;
}

/** Sentinel value for sessions with no preset assigned. */
export const NO_PRESET = '(No Preset)' as const;

/** Raw header-mapped row object produced by PapaParse (header: true). */
export interface CsvRow {
	readonly 'Started At': string;
	readonly Duration: string;
	readonly Preset: string;
	readonly Activity: string;
}

/** Successful result payload posted back from the CSV Web Worker. */
export interface WorkerResult {
	readonly sessions: SessionEntry[];
	readonly skippedCount: number;
	/** Unique activity strings present in the dataset, sorted ascending. */
	readonly activities: string[];
	/**
	 * Unique named preset strings, sorted ascending.
	 * Does NOT include the NO_PRESET sentinel.
	 */
	readonly presets: string[];
}

/** Union type for all messages the CSV Web Worker can post to the main thread. */
export type WorkerMessage =
	| {readonly type: 'result'; readonly payload: WorkerResult}
	| {readonly type: 'error'; readonly message: string};
