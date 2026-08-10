<script lang="ts">
    import { engine } from '$lib';
    import { onMount } from 'svelte';
    // Minimal UI: activity, preset, unit, date range
    // For simplicity we use native select/multiple and input elements.

    // Populate activity and preset options from engine reactively ($derived re-runs
    // whenever the engine's underlying $state changes, e.g. after the CSV loads).
    const activities = $derived(engine.availableActivities);
    const presets = $derived(engine.availablePresets);

    // Local state for controls
    let selectedActivities = $state<string[]>([]);
    let selectedPresets = $state<string[]>([]);
    let unit = $state<'minutes' | 'hours' | 'sessions'>(engine.filters.unit);
    let granularity = $state<'day' | 'week' | 'month' | 'quarter' | 'season' | 'year'>(engine.timelineConfig.granularity);
    let dateFrom = $state('');
    let dateTo = $state('');

    function applyFilters() {
        engine.setActivityFilter(selectedActivities);
        engine.setPresetFilter(selectedPresets);
        engine.setUnit(unit);
        engine.setGranularity(granularity);
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
</script>

<div class="p-4 space-y-4">
    <h2 class="text-lg font-semibold text-[#1C1C1C]">Global Filters</h2>
    <div>
        <span id="activitySelectLabel" class="block text-sm font-medium text-[#1C1C1C] mb-1">Activities</span>
        <div
            id="activitySelect"
            role="listbox"
            aria-multiselectable="true"
            aria-labelledby="activitySelectLabel"
            class="w-full max-h-40 overflow-y-auto bg-white border border-[#E5E7EB] rounded text-sm focus-within:border-[#EAA845] focus-within:ring-2 focus-within:ring-[#EAA845]/40"
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
                            <span class="inline-block w-3 h-3 rounded border {isSelected ? 'bg-[#EAA845] border-[#EAA845]' : 'border-[#9CA3AF]'}"></span>
                            {act}
                        </span>
                    </button>
                {/each}
            {/if}
        </div>
        <div class="mt-1.5 flex items-center gap-3 text-xs">
            <button type="button" onclick={selectAllActivities} class="font-semibold text-[#B45309] hover:text-[#92400E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] rounded transition-colors">
                Select All
            </button>
            <button type="button" onclick={deselectAllActivities} class="font-semibold text-[#B45309] hover:text-[#92400E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] rounded transition-colors">
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
        <label for="presetSelect" class="block text-sm font-medium text-[#1C1C1C] mb-1">Presets</label>
        <select id="presetSelect" multiple bind:value={selectedPresets} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none">
            {#each presets as pre}
                <option value={pre}>{pre}</option>
            {/each}
        </select>
    </div>
    <div>
        <label for="unitSelect" class="block text-sm font-medium text-[#1C1C1C] mb-1">Unit</label>
        <select id="unitSelect" bind:value={unit} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none">
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="sessions">Sessions</option>
        </select>
    </div>
    <div>
        <label for="granularitySelect" class="block text-sm font-medium text-[#1C1C1C] mb-1">Aggregate By</label>
        <select id="granularitySelect" bind:value={granularity} class="w-full min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1.5 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month" selected>Month</option>
            <option value="quarter">Quarter</option>
            <option value="season">Season</option>
            <option value="year">Year</option>
        </select>
    </div>
    <div class="flex space-x-px">
        <div class="flex-1">
            <label for="dateFrom" class="block text-sm font-medium text-[#1C1C1C] mb-1">From</label>
            <input id="dateFrom" type="date" bind:value={dateFrom} class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none" />
        </div>
        <div class="flex-1">
            <label for="dateTo" class="block text-sm font-medium text-[#1C1C1C] mb-1">To</label>
            <input id="dateTo" type="date" bind:value={dateTo} class="w-7/8 min-h-9 bg-white border border-[#E5E7EB] rounded text-[#1C1C1C] p-1 text-sm focus:border-[#EAA845] focus:ring-2 focus:ring-[#EAA845]/40 focus:outline-none" />
        </div>
    </div>
    <button onclick={applyFilters} class="mt-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
        Apply Filters
    </button>
</div>
