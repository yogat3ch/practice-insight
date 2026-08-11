<script lang="ts">
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
	import { tooltipFor, labelFor } from '../i18n/Tooltips';
	import type { TooltipKey } from '../i18n/Tooltips';

	interface Props {
		/** i18n key used to look up the tooltip text and accessible label. */
		for: TooltipKey;
		/** Optional explicit label for the accessible name; falls back to the JSON label. */
		label?: string;
	}

	let { for: tooltipKey, label }: Props = $props();

	/** Open/closed state; toggled by click/tap and hover/focus on desktop. */
	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);
	let tooltipEl = $state<HTMLDivElement | null>(null);

	const text = $derived(tooltipFor(tooltipKey));
	const accessibleLabel = $derived(label ?? labelFor(tooltipKey));

	const tooltipId = $derived(`tooltip-${tooltipKey}`);

	/**
	 * Keeps the tooltip positioned relative to its trigger while open. The
	 * effect re-runs when the tooltip element mounts (via `bind:this`), and
	 * cleans up the `autoUpdate` watcher when closed or unmounted.
	 */
	$effect(() => {
		if (!open) return;
		const trigger = triggerEl;
		const tooltip = tooltipEl;
		if (!trigger || !tooltip) return;

		const update = () => {
			void computePosition(trigger, tooltip, {
				placement: 'top',
				middleware: [offset(6), flip(), shift({ padding: 8 })]
			}).then(({ x, y }) => {
				tooltip.style.left = `${x}px`;
				tooltip.style.top = `${y}px`;
			});
		};
		update();
		return autoUpdate(trigger, tooltip, update);
	});

	/** Close the tooltip when tapping/clicking elsewhere (mobile-friendly). */
	$effect(() => {
		if (!open) return;
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (triggerEl && target && !triggerEl.contains(target)) {
				open = false;
			}
		};
		document.addEventListener('pointerdown', handlePointerDown);
		return () => document.removeEventListener('pointerdown', handlePointerDown);
	});

	function toggle(): void {
		open = !open;
	}

	function show(): void {
		open = true;
	}

	function hide(): void {
		open = false;
	}
</script>

<button
	type="button"
	bind:this={triggerEl}
	aria-label={accessibleLabel ? `${accessibleLabel}: ${text}` : text}
	aria-describedby={open ? tooltipId : undefined}
	aria-expanded={open}
	onclick={toggle}
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
	class="inline-flex align-super text-[#1C1C1C] hover:text-[#9e9e9e] rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
>
	<CircleQuestionMark class="w-3.5 h-3.5" aria-hidden="true" />
</button>

{#if open}
	<div
		id={tooltipId}
		bind:this={tooltipEl}
		role="tooltip"
		class="pointer-events-none fixed z-50 max-w-xs rounded-md bg-[#1F2937] px-2.5 py-1.5 text-xs text-white shadow-lg"
	>
		{text}
	</div>
{/if}
