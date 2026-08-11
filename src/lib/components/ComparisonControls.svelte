<script lang="ts">
	import { engine } from '$lib';
	import type { ComparisonPeriod, ComparisonStrategy, XAxisAlignment } from '$lib';
	import { format } from 'date-fns';
	import Tooltip from './Tooltip.svelte';

	/** Comparison strategy options per §5.2. */
	const STRATEGY_OPTIONS: { value: ComparisonStrategy; label: string }[] = [
		{ value: 'period', label: 'Period-over-Period (Relative)' },
		{ value: 'grid', label: 'Sequential Side-by-Side' }
	];

	/** X-axis alignment options per §5.2. */
	const ALIGNMENT_OPTIONS: { value: XAxisAlignment; label: string }[] = [
		{ value: 'calendar', label: 'Calendar Date' },
		{ value: 'elapsed', label: 'Elapsed Days' }
	];

	// Local control state, initialized from the engine's current config.
	let strategy = $state<ComparisonStrategy>(engine.comparisonConfig.strategy);
	let lockYAxis = $state<boolean>(engine.comparisonConfig.lockYAxis);
	let xAxisAlignment = $state<XAxisAlignment>(engine.comparisonConfig.xAxisAlignment);

	// New-period constructor inputs.
	let newFrom = $state('');
	let newTo = $state('');
	let newColor = $state('#10b981');

	/** Reactive list of active comparison periods from the engine. */
	const periods = $derived(engine.comparisonConfig.periods);

	function applyControls(): void {
		engine.setComparisonStrategy(strategy);
		engine.setLockYAxis(lockYAxis);
		engine.setXAxisAlignment(xAxisAlignment);
	}

	/** Adds a new comparison period from the current constructor inputs. */
	function addPeriod(): void {
		if (!newFrom || !newTo) return;
		engine.addComparisonPeriodRange(new Date(newFrom), new Date(newTo), newColor);
		// Clear the constructor for the next entry.
		newFrom = '';
		newTo = '';
		newColor = '#10b981';
	}

	function removePeriod(id: string): void {
		engine.removeComparisonPeriod(id);
	}

	function updatePeriodColor(id: string, color: string): void {
		engine.updateComparisonPeriod(id, { color });
	}

	function formatBounds(period: ComparisonPeriod): string {
		return `${format(period.dateFrom, 'MMM d, yyyy')} – ${format(period.dateTo, 'MMM d, yyyy')}`;
	}
</script>

<section aria-labelledby="comparisonControlsTitle" class="border border-[#E5E5E5] bg-white rounded-md p-3 space-y-3">
	<h3 id="comparisonControlsTitle" class="text-sm font-semibold text-[#1C1C1C]">Comparison Controls</h3>

	<!-- Comparison Strategy -->
	<fieldset>
		<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			Comparison Strategy
			<Tooltip for="comparisonStrategy" />
		</legend>
		<div class="space-y-1.5">
			{#each STRATEGY_OPTIONS as opt}
				<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
					<input
						type="radio"
						name="comparisonStrategy"
						value={opt.value}
						checked={strategy === opt.value}
						onchange={() => (strategy = opt.value)}
						class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<!-- Y-Axis Lock -->
	<label class="flex items-center justify-between gap-2 text-sm text-[#1C1C1C] cursor-pointer">
		<span class="inline-flex items-center gap-1.5">
			Lock Y-Axis Scale
			<Tooltip for="lockYAxis" />
		</span>
		<span class="inline-flex items-center">
			<input
				type="checkbox"
				bind:checked={lockYAxis}
				class="w-4 h-4 rounded border-[#9CA3AF] text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
			/>
		</span>
	</label>

	<!-- X-Axis Alignment -->
	<fieldset>
		<legend class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
			X-Axis Alignment
			<Tooltip for="xAxisAlignment" />
		</legend>
		<div class="space-y-1.5">
			{#each ALIGNMENT_OPTIONS as opt}
				<label class="flex items-center gap-2 text-sm text-[#1C1C1C] cursor-pointer">
					<input
						type="radio"
						name="xAxisAlignment"
						value={opt.value}
						checked={xAxisAlignment === opt.value}
						onchange={() => (xAxisAlignment = opt.value)}
						class="w-4 h-4 text-emerald-500 focus:ring-emerald-500/40 focus:outline-none"
					/>
					{opt.label}
				</label>
			{/each}
		</div>
		<p class="mt-1 text-xs text-[#6E6E6E]">
			Elapsed Days aligns periods from their first data point (Day 1).
		</p>
	</fieldset>

	<!-- Series Constructor -->
	<div>
		<span class="block text-sm font-medium text-[#1C1C1C] mb-1">Periods</span>

		{#if periods.length === 0}
			<p class="text-xs text-[#6E6E6E] mb-2">No periods yet. Add one below to start comparing.</p>
		{:else}
			<ul class="space-y-2" aria-label="Active comparison periods">
				{#each periods as period}
					<li class="flex items-center gap-2 border border-[#E5E7EB] rounded p-2 bg-[#F9FAFB]">
						<input
							type="color"
							value={period.color || '#10b981'}
							onchange={(e) => updatePeriodColor(period.id, (e.currentTarget as HTMLInputElement).value)}
							aria-label={`Color for ${period.label}`}
							class="w-7 h-7 shrink-0 cursor-pointer border border-[#E5E7EB] rounded bg-white p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
						/>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-[#1C1C1C] truncate">{period.label}</p>
							<p class="text-xs text-[#6E6E6E] truncate">{formatBounds(period)}</p>
						</div>
						<button
							type="button"
							onclick={() => removePeriod(period.id)}
							aria-label={`Remove ${period.label}`}
							class="shrink-0 text-[#6E6E6E] hover:text-[#EF4444] rounded p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<!-- Add Period constructor -->
		<div class="mt-2 border-t border-[#E5E5E5] pt-2 space-y-2">
			<div class="flex space-x-px">
				<div class="flex-1">
					<label for="comparisonFrom" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
						From
						<Tooltip for="comparisonFrom" />
					</label>
					<input
						id="comparisonFrom"
						type="date"
						bind:value={newFrom}
						class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-0.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
					/>
				</div>
				<div class="flex-1">
					<label for="comparisonTo" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
						To
						<Tooltip for="comparisonTo" />
					</label>
					<input
						id="comparisonTo"
						type="date"
						bind:value={newTo}
						class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-0.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
					/>
				</div>
			</div>
			<div>
				<label for="comparisonColor" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
					Color
					<Tooltip for="comparisonColor" />
				</label>
				<input
					id="comparisonColor"
					type="color"
					bind:value={newColor}
					class="w-12 h-9 cursor-pointer border border-[#E5E7EB] rounded bg-white p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
				/>
			</div>
			<button
				type="button"
				onclick={addPeriod}
				disabled={!newFrom || !newTo}
				class="w-full px-3 py-1.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1C1C1C] hover:bg-[#F3F4F6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
			>
				+ Add Period
			</button>
		</div>
	</div>

	<button
		type="button"
		onclick={applyControls}
		class="mt-1 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
	>
		Apply Comparison
	</button>
</section>
