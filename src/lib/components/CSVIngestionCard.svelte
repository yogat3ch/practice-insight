<script lang="ts">
	import type {WorkerResult} from '$lib';
	import {engine, parseCSV} from '$lib';

	/** Dragging state drives the drop-target highlight. */
	let isDragging = $state(false);
	/** Inline error message from a failed parse. */
	let errorMessage = $state('');
	/** True while a parse operation is in-flight. */
	let isLoading = $state(false);

	/** Parsed row count badge state, derived from the engine's loaded data. */
	const parsedCount = $derived(engine.totalSessionCount);
	const skippedCount = $derived(engine.skippedCount);
	const hasLoaded = $derived(engine.hasData);

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) void handleFile(file);
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void handleFile(file);
		// Reset input so selecting the same file again re-triggers change.
		input.value = '';
	}

	async function handleFile(file: File): Promise<void> {
		errorMessage = '';
		isLoading = true;
		try {
			const result: WorkerResult = await parseCSV(file);
			applyResult(result);
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'Failed to parse CSV file.';
		} finally {
			isLoading = false;
		}
	}

	function applyResult(result: WorkerResult): void {
		engine.loadData(result);
		// Reset global filters so all newly-loaded activities/presets are visible.
		engine.setActivityFilter([]);
		engine.setPresetFilter([]);
	}

	function formatCount(value: number): string {
		return value.toLocaleString('en-US');
	}
</script>

<section
	aria-labelledby="csvCardTitle"
	class="border border-[#E5E5E5] bg-white rounded-md p-3"
>
	<h3 id="csvCardTitle" class="text-sm font-semibold text-[#1C1C1C] mb-2">
		CSV Data
	</h3>

	<div
		role="button"
		tabindex="0"
		aria-label="Upload an Insight Timer CSV export (drag and drop or click to browse)"
		class="border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] {isDragging
			? 'border-[#EAA845] bg-[#EAA845]/10'
			: 'border-[#E5E7EB] hover:border-[#EAA845]/70 hover:bg-[#F9FAFB]'}"
		ondragover={e => {
			e.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => (isDragging = false)}
		ondrop={handleDrop}
		onclick={() => document.getElementById('csvFileInput')?.click()}
		onkeydown={e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				document.getElementById('csvFileInput')?.click();
			}
		}}
	>
		<input
			id="csvFileInput"
			type="file"
			accept=".csv,text/csv"
			class="hidden"
			onchange={handleFileSelect}
		/>
		{#if isLoading}
			<div
				class="flex items-center justify-center gap-2 text-sm text-[#6E6E6E]"
			>
				<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					></path>
				</svg>
				<span>Parsing CSV…</span>
			</div>
		{:else}
			<svg
				class="w-6 h-6 mx-auto mb-1 text-[#6E6E6E]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 13M9 17h1m4 0h1m-6 4h6m-4-4v4"
				/>
			</svg>
			<p class="text-sm text-[#6E6E6E]">
				Drag &amp; drop your CSV here, or click to browse
			</p>
		{/if}
	</div>

	{#if hasLoaded}
		<p class="mt-2 text-sm text-[#1C1C1C]">
			<span class="inline-flex items-center gap-1 font-medium text-emerald-700">
				<svg
					class="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				{formatCount(parsedCount)} parsed
			</span>
			{#if skippedCount > 0}
				<span class="text-[#6E6E6E]"
					>({formatCount(skippedCount)} invalid, skipped)</span
				>
			{/if}
		</p>
	{:else}
		<p class="mt-2 text-sm text-[#6E6E6E]">No data loaded yet.</p>
	{/if}

	{#if errorMessage}
		<p
			role="alert"
			class="mt-2 text-xs text-[#B45309] bg-amber-100 rounded px-2 py-1.5"
		>
			{errorMessage}
		</p>
	{/if}
</section>
