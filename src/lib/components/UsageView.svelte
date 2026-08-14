<script lang="ts">
	import {usageDocuments} from '$lib/usage/usage-content';
	import {consumeUsageDoc} from '$lib/usage/usage-nav.svelte';
	import {onMount} from 'svelte';

	// Selected document. Consume any externally-requested doc (e.g. from the
	// CSV card's help link); default to the Usage Guide.
	let activeDocId = $state(
		consumeUsageDoc() ||
			usageDocuments.find(doc => doc.id === 'usage')?.id ||
			usageDocuments[0]?.id ||
			'',
	);
	// Dropdown open state.
	let docsOpen = $state(false);

	const activeDoc = $derived(
		usageDocuments.find(doc => doc.id === activeDocId) ?? usageDocuments[0],
	);

	function selectDoc(id: string) {
		activeDocId = id;
		docsOpen = false;
	}

	// Intercept in-app cross-doc links (`#/<doc-id>`) so they switch the
	// active document instead of navigating away. A document-level listener
	// keeps the rendered HTML container non-interactive (a11y clean).
	onMount(() => {
		function handleDocLinkClick(event: MouseEvent) {
			const target = event.target as Element | null;
			const anchor = target?.closest?.('a');
			if (!anchor) return;
			const match = anchor.getAttribute('href')?.match(/^#\/([a-z0-9-]+)$/);
			if (!match) return;
			const targetId = match[1];
			if (usageDocuments.some(doc => doc.id === targetId)) {
				event.preventDefault();
				selectDoc(targetId);
			}
		}
		document.addEventListener('click', handleDocLinkClick);
		return () => document.removeEventListener('click', handleDocLinkClick);
	});
</script>

<div class="flex flex-col h-full p-2 space-y-3 overflow-y-auto">
	<div class="flex items-center justify-between gap-2">
		<!-- Document navigation dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => (docsOpen = !docsOpen)}
				aria-haspopup="listbox"
				aria-expanded={docsOpen}
				class="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-[#1C1C1C] transition-colors hover:bg-[#F9FAFB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845]"
			>
				<span>{activeDoc?.title}</span>
				<svg
					class="w-4 h-4 text-[#6E6E6E] transition-transform {docsOpen
						? 'rotate-180'
						: ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/></svg
				>
			</button>

			{#if docsOpen}
				<ul
					role="listbox"
					class="absolute left-0 top-full mt-1 z-10 w-64 max-w-[80vw] overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-md"
				>
					{#each usageDocuments as doc}
						<li>
							<button
								type="button"
								role="option"
								aria-selected={doc.id === activeDocId}
								onclick={() => selectDoc(doc.id)}
								class="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#F9FAFB] focus:outline-none focus-visible:bg-[#F9FAFB] {doc.id ===
								activeDocId
									? 'bg-[#F9FAFB] text-[#1C1C1C] font-medium'
									: 'text-[#6E6E6E]'}"
							>
								{doc.title}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<a
			href="/sample.csv"
			download
			class="rounded-md bg-[#10B981] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#059669] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845]"
		>
			Download sample CSV
		</a>
	</div>

	{#if activeDoc}
		<div class="border border-[#E5E7EB] rounded bg-white">
			{#each activeDoc.sections as section}
				<section class="border-b border-[#E5E7EB] last:border-b-0 px-5 py-4">
					<h2 class="text-lg font-bold text-[#1C1C1C] mb-2">
						{section.title}
					</h2>
					<div class="text-[15px] text-[#1C1C1C] space-y-3 usage-content">
						{@html section.html}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.usage-content :global(h3) {
		font-size: 0.95rem;
		font-weight: 600;
		margin-top: 0.75rem;
		margin-bottom: 0.25rem;
		color: #1c1c1c;
	}
	.usage-content :global(p) {
		margin: 0;
	}
	.usage-content :global(ul),
	.usage-content :global(ol) {
		margin: 0;
		padding-left: 1.25rem;
		list-style-position: outside;
	}
	.usage-content :global(ul) {
		list-style-type: disc;
	}
	.usage-content :global(ol) {
		list-style-type: decimal;
	}
	.usage-content :global(li) {
		margin: 0.25rem 0;
	}
	.usage-content :global(strong) {
		font-weight: 600;
	}
	.usage-content :global(code) {
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		padding: 0.1rem 0.3rem;
		font-size: 0.85em;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		color: #1c1c1c;
	}
	.usage-content :global(pre) {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		padding: 0.75rem;
		overflow-x: auto;
	}
	.usage-content :global(pre code) {
		background: transparent;
		border: none;
		padding: 0;
	}
	.usage-content :global(a) {
		color: #10b981;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.usage-content :global(a:hover) {
		color: #059669;
	}
	.usage-content :global(blockquote) {
		border-left: 3px solid #eaa845;
		background: #fffbeb;
		padding: 0.5rem 0.75rem;
		border-radius: 0 0.25rem 0.25rem 0;
		margin: 0;
	}
	.usage-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.5rem 0;
		font-size: 0.875rem;
	}
	.usage-content :global(th),
	.usage-content :global(td) {
		border: 1px solid #e5e7eb;
		padding: 0.375rem 0.5rem;
		text-align: left;
	}
	.usage-content :global(th) {
		background: #f9fafb;
		font-weight: 600;
	}
	.usage-content :global(hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 0.75rem 0;
	}
	.usage-content :global(img) {
		max-width: 100%;
		height: auto;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		margin: 0.5rem 0;
		display: block;
	}
</style>
