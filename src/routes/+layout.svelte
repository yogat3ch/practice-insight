<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import TimelineView from '$lib/components/TimelineView.svelte';
	import ComparisonView from '$lib/components/ComparisonView.svelte';
	import DistributionView from '$lib/components/DistributionView.svelte';
	import { engine, fetchAndParseSampleCSV } from '$lib';

	// Drawer open state (mobile)
	let drawerOpen = $state(false);

	// Track active tab via engine's getter
	const activeTab = $derived.by(() => engine.activeTab);

	// Resizable sidebar width in px. Default ~5% wider than the previous fixed 256px.
	const MIN_SIDEBAR_WIDTH = 200;
	const MAX_SIDEBAR_WIDTH = 480;
	let sidebarWidth = $state(270);

	let { children } = $props();

	// Load sample dataset on boot so charts have data to render.
	onMount(async () => {
		if (!engine.hasData) {
			try {
				const result = await fetchAndParseSampleCSV();
				engine.loadData(result);
			} catch (err) {
				console.error('Failed to load sample CSV:', err);
			}
		}
	});

	function toggleDrawer() {
		drawerOpen = !drawerOpen;
	}

	// Horizontal resize of the sidebar via pointer drags on the divider handle.
	function startSidebarResize(event: PointerEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = sidebarWidth;

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const next = startWidth + (moveEvent.clientX - startX);
			sidebarWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, next));
		};

		const handlePointerUp = () => {
			window.removeEventListener('pointermove', handlePointerMove);
			window.removeEventListener('pointerup', handlePointerUp);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};

		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
	}
</script>

<div class="flex h-screen overflow-hidden bg-white text-[#1C1C1C]">
	<!-- Body: sidebar + main content -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Drawer (hidden on mobile when closed) -->
		<aside
			class="hidden lg:block bg-[#F9FAFB] border-r border-[#E5E5E5] overflow-y-auto shrink-0"
			class:!block={drawerOpen}
			style:width={sidebarWidth + 'px'}
		>
			<!-- Brand header at top of the sidebar pane -->
			<header class="flex items-center gap-2 border-b border-[#E5E5E5] bg-white px-3 py-2">
				<span class="text-lg font-bold tracking-tight text-[#1C1C1C]">Practice Insight</span>
			</header>
			<ControlPanel />
		</aside>

		<!-- Resize handle: horizontal resize cursor on hover -->
		<div
			class="hidden lg:block w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-[#EAA845]/60 transition-colors"
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize sidebar"
			onpointerdown={startSidebarResize}
		></div>

		<main class="flex-1 flex flex-col overflow-y-auto">
			<!-- Mobile drawer trigger (visible only on mobile) -->
			<div class="lg:hidden flex items-center border-b border-[#E5E5E5] px-2 py-1">
				<button class="rounded-md p-1.5 text-[#6E6E6E] hover:bg-[#F9FAFB] hover:text-[#1C1C1C] transition-colors" onclick={toggleDrawer} aria-label="Open menu">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
				</button>
			</div>
			<TabBar />
			{#if activeTab === 'timeline'}
				<TimelineView />
			{:else if activeTab === 'comparison'}
				<ComparisonView />
			{:else}
				<DistributionView />
			{/if}
			{@render children()}
		</main>
	</div>
</div>
