<script lang="ts">
    import { engine } from '$lib';
    import { format } from 'date-fns';
    import Info from '@lucide/svelte/icons/info';
    import Accordion from './Accordion.svelte';
    import CSVIngestionCard from './CSVIngestionCard.svelte';
    import ComparisonControls from './ComparisonControls.svelte';
    import DistributionControls from './DistributionControls.svelte';
    import TimelineControls from './TimelineControls.svelte';
    import Tooltip from './Tooltip.svelte';

    // Populate activity and preset options from engine reactively ($derived re-runs
    // whenever the engine's underlying $state changes, e.g. after the CSV loads).
    const activities = $derived(engine.availableActivities);
    const presets = $derived(engine.availablePresets);

    // Local state for global controls
    let selectedActivities = $state<string[]>([]);
    let selectedPresets = $state<string[]>([]);
    let unit = $state<'minutes' | 'hours' | 'sessions'>(engine.filters.unit);
    // Global date range picker, initialized from the engine's current filter bounds.
    let dateFrom = $state<string>(
        engine.filters.dateFrom ? format(engine.filters.dateFrom, 'yyyy-MM-dd') : ''
    );
    let dateTo = $state<string>(
        engine.filters.dateTo ? format(engine.filters.dateTo, 'yyyy-MM-dd') : ''
    );

    // Active tab drives which tab-specific control panel is rendered.
    const activeTab = $derived(engine.activeTab);

    // Header label for the tab-specific accordion (e.g. "Timeline Controls").
    const tabControlsTitle = $derived(
        activeTab === 'timeline'
            ? 'Timeline Controls'
            : activeTab === 'comparison'
                ? 'Comparison Controls'
                : 'Distribution Controls'
    );

    // Context-aware subtitle for the tab-specific accordion.
    const tabControlsHint = $derived(
        activeTab === 'timeline'
            ? 'Time window, aggregation, smoothing & overlays'
            : activeTab === 'comparison'
                ? 'Strategy, axis alignment & period constructor'
                : 'Category, chart style, grouping & metric'
    );

    function applyFilters() {
        engine.setActivityFilter(selectedActivities);
        engine.setPresetFilter(selectedPresets);
        engine.setUnit(unit);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;
        engine.setDateRange(from, to);
    }

    // Remove a selected activity (deselects it in both the select and the pills)
    function removeActivity(act: string) {
        selectedActivities = selectedActivities.filter((a) => a !== act);
    }

    // Toggle an option with a plain click (no ⌘/Ctrl needed).
    // Re-clicking a selected item deselects it; clicking an unselected item adds it.
    function toggleActivity(act: string) {
        selectedActivities = selectedActivities.includes(act)
            ? selectedActivities.filter((a) => a !== act)
            : [...selectedActivities, act];
    }

    function selectAllActivities() {
        selectedActivities = [...activities];
    }

    function deselectAllActivities() {
        selectedActivities = [];
    }

    // Toggle a preset option with a plain click.
    function togglePreset(pre: string) {
        selectedPresets = selectedPresets.includes(pre)
            ? selectedPresets.filter((p) => p !== pre)
            : [...selectedPresets, pre];
    }

    function selectAllPresets() {
        selectedPresets = [...presets];
    }

    function deselectAllPresets() {
        selectedPresets = [];
    }

    function removePreset(pre: string) {
        selectedPresets = selectedPresets.filter((p) => p !== pre);
    }
</script>

<div class="p-4 space-y-4">
    <!-- CSV Data (§4.2.1) -->
    <Accordion id="csvSection" title="CSV Data" defaultOpen={true}>
        <CSVIngestionCard />
    </Accordion>

    <!-- Global Filters -->
    <Accordion id="filtersSection" title="Global Filters" defaultOpen={true} count={selectedActivities.length + selectedPresets.length}>
    <div>
        <span id="activitySelectLabel" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
            Activities
            <Tooltip for="activities" />
        </span>
        <div
            id="activitySelect"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby="activitySelectLabel"
            class="w-full max-h-40 overflow-y-auto bg-white border border-[#E5E7EB] rounded text-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40"
        >
            {#if activities.length === 0}
                <p class="px-2 py-1.5 text-xs text-[#6E6E6E]">No activities available</p>
            {:else}
                {#each activities as act}
                    {@const isSelected = selectedActivities.includes(act)}
                    <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onclick={() => toggleActivity(act)}
                        class="block w-full text-left px-2 text-sm transition-colors focus:outline-none focus-visible:bg-[#EAA845]/20 {isSelected ? 'bg-[#EAA845]/15 text-[#1C1C1C]' : 'text-[#1C1C1C] hover:bg-[#F9FAFB]'}"
                    >
                        <span class="inline-flex items-center gap-2">
                            <span class="inline-block w-3 h-3 rounded border {isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-[#9CA3AF]'}"></span>
                            {act}
                        </span>
                    </button>
                {/each}
            {/if}
        </div>
        <div class="mt-1.5 flex items-center gap-3 text-xs">
            <button type="button" onclick={selectAllActivities} class="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded transition-colors">
                Select All
            </button>
            <button type="button" onclick={deselectAllActivities} class="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded transition-colors">
                Deselect All
            </button>
        </div>
        {#if selectedActivities.length > 0}
            <ul class="mt-2 flex flex-wrap gap-1.5" aria-label="Selected activities">
                {#each selectedActivities as act}
                    <li>
                        <button
                            type="button"
                            onclick={() => removeActivity(act)}
                            class="inline-flex items-center gap-1 rounded-full bg-[#EAA845]/15 text-[#1C1C1C] border border-[#EAA845]/40 px-2.5 py-0.5 text-xs font-medium hover:bg-[#EAA845]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] transition-colors"
                            aria-label={`Remove ${act} from selected activities`}
                        >
                            {act}
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <div>
        <span id="presetSelectLabel" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
            Presets
            <Tooltip for="presets" />
        </span>
        <div
            id="presetSelect"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby="presetSelectLabel"
            class="w-full max-h-40 overflow-y-auto bg-white border border-[#E5E7EB] rounded text-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40"
        >
            {#if presets.length === 0}
                <p class="px-2 py-1.5 text-xs text-[#6E6E6E]">No presets available</p>
            {:else}
                {#each presets as pre}
                    {@const isSelected = selectedPresets.includes(pre)}
                    <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onclick={() => togglePreset(pre)}
                        class="block w-full text-left px-2 text-sm transition-colors focus:outline-none focus-visible:bg-[#EAA845]/20 {isSelected ? 'bg-[#EAA845]/15 text-[#1C1C1C]' : 'text-[#1C1C1C] hover:bg-[#F9FAFB]'}"
                    >
                        <span class="inline-flex items-center gap-2">
                            <span class="inline-block w-3 h-3 rounded border {isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-[#9CA3AF]'}"></span>
                            {pre}
                        </span>
                    </button>
                {/each}
            {/if}
        </div>
        <div class="mt-1.5 flex items-center gap-3 text-xs">
            <button type="button" onclick={selectAllPresets} class="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded transition-colors">
                Select All
            </button>
            <button type="button" onclick={deselectAllPresets} class="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded transition-colors">
                Deselect All
            </button>
        </div>
        {#if selectedPresets.length > 0}
            <ul class="mt-2 flex flex-wrap gap-1.5" aria-label="Selected presets">
                {#each selectedPresets as pre}
                    <li>
                        <button
                            type="button"
                            onclick={() => removePreset(pre)}
                            class="inline-flex items-center gap-1 rounded-full bg-[#EAA845]/15 text-[#1C1C1C] border border-[#EAA845]/40 px-2.5 py-0.5 text-xs font-medium hover:bg-[#EAA845]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] transition-colors"
                            aria-label={`Remove ${pre} from selected presets`}
                        >
                            {pre}
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <div>
        <label for="unitSelect" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
            Unit
            <Tooltip for="unit" />
        </label>
        <select id="unitSelect" bind:value={unit} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none">
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="sessions">Sessions</option>
        </select>
    </div>
    <div>
        <span class="block text-sm font-medium text-[#1C1C1C] mb-1">Date Range</span>
        <div class="flex space-x-px">
            <div class="flex-1">
                <label for="dateFrom" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
                    From
                    <Tooltip for="dateFrom" />
                </label>
                <input id="dateFrom" type="date" bind:value={dateFrom} class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
            </div>
            <div class="flex-1">
                <label for="dateTo" class="flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C] mb-1">
                    To
                    <Tooltip for="dateTo" />
                </label>
                <input id="dateTo" type="date" bind:value={dateTo} class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none" />
            </div>
        </div>
    </div>
    <p class="mt-2 flex items-start gap-1.5 rounded-md bg-amber-100 px-2.5 py-2 text-xs text-[#B45309]">
        <Info class="w-4 h-4 shrink-0 text-[#B45309]" aria-hidden="true" />
        <span>Seasonal years run Dec 22 – Dec 21. Sessions attributed to Start Time.</span>
    </p>
    <button onclick={applyFilters} class="mt-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
        Apply Filters
    </button>
    </Accordion>

    <!-- Tab-Specific Controls (§4.1) -->
    <Accordion id="tabControlsSection" title={tabControlsTitle} defaultOpen={true}>
        <p class="mb-3 text-xs text-[#6E6E6E]">{tabControlsHint}</p>
        {#if activeTab === 'timeline'}
            <TimelineControls />
        {:else if activeTab === 'comparison'}
            <ComparisonControls />
        {:else if activeTab === 'distribution'}
            <DistributionControls />
        {/if}
    </Accordion>
</div>
