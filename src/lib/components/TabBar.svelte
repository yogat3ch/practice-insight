<script lang="ts">
	import { engine } from '$lib';
	import type { TabId } from '$lib';
	const tabs: { id: TabId; label: string }[] = [
		{ id: 'timeline', label: 'Timeline' },
		{ id: 'comparison', label: 'Comparison' },
		{ id: 'distribution', label: 'Distribution' }
	];

	function selectTab(id: TabId) {
		engine.setTab(id);
	}
</script>

<div class="border-b border-[#E5E5E5] bg-white" role="tablist" aria-label="Dashboard views">
	<ul class="flex space-x-1 px-4">
		{#each tabs as { id, label }}
			<li>
				<button
					role="tab"
					aria-selected={engine.activeTab === id}
					class="py-2.5 px-4 rounded-t-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] {engine.activeTab ===
					id
						? 'border-b-2 border-[#EAA845] text-[#1C1C1C]'
						: 'border-b-2 border-transparent text-[#6E6E6E] hover:text-[#1C1C1C]'}"
					onclick={() => selectTab(id)}
				>
					{label}
				</button>
			</li>
		{/each}
	</ul>
</div>
