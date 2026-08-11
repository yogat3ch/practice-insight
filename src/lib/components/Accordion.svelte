<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	interface Props {
		/** Heading shown on the always-visible header row. */
		title: string;
		/** Unique id used for the aria-controls/aria-labelledby pairing. */
		id: string;
		/** Whether the section starts expanded. Defaults to true. */
		defaultOpen?: boolean;
		/** Optional count badge shown on the header (e.g. selected item count). */
		count?: number | null;
		children?: import('svelte').Snippet;
	}

	let { title, id, defaultOpen = true, count = null, children }: Props = $props();

	// Local open/closed state. Kept as plain local state — the section content
	// remains mounted so filters and charts keep their values when collapsed.
	// `defaultOpen` only seeds the initial value (its capture is intentional).
	let open = $state(defaultOpen);

	// Derive stable aria ids from the `id` prop for the button/region pairing.
	const panelId = $derived(`${id}-panel`);
	const buttonId = $derived(`${id}-button`);
</script>

<div class="border border-[#E5E5E5] bg-white rounded-md overflow-hidden">
	<h3 class="m-0">
		<button
			id={buttonId}
			type="button"
			aria-expanded={open}
			aria-controls={panelId}
			onclick={() => (open = !open)}
			class="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#1C1C1C] hover:bg-[#F9FAFB] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] focus-visible:ring-inset"
		>
			<span class="inline-flex items-center gap-2">
				{title}
				{#if count !== null && count > 0}
					<span class="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#EAA845]/15 text-[#B45309] text-xs font-medium">
						{count}
					</span>
				{/if}
			</span>
			<ChevronDown
				class="w-4 h-4 shrink-0 text-[#6E6E6E] transition-transform duration-200 {open ? 'rotate-180' : ''}"
				aria-hidden="true"
			/>
		</button>
	</h3>
	{#if open}
		<div id={panelId} role="region" aria-labelledby={buttonId} class="border-t border-[#E5E5E5] p-3">
			{@render children?.()}
		</div>
	{/if}
</div>
