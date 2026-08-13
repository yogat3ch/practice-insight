<script lang="ts">
	import {usageSections} from '$lib/usage/usage-content';
</script>

<div class="flex flex-col h-full p-2 space-y-3 overflow-y-auto">
	<div class="flex justify-end">
		<a
			href="/sample.csv"
			download
			class="rounded-md bg-[#10B981] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#059669] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845]"
		>
			Download sample CSV
		</a>
	</div>

	<div class="border border-[#E5E7EB] rounded bg-white">
		{#each usageSections as section}
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
</style>
