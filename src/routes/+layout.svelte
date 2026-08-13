<script lang="ts">
	import '../app.css';
	import {onMount} from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import TabBar from '$lib/components/TabBar.svelte';
	import TimelineView from '$lib/components/TimelineView.svelte';
	import ComparisonView from '$lib/components/ComparisonView.svelte';
	import DistributionView from '$lib/components/DistributionView.svelte';
	import UsageView from '$lib/components/UsageView.svelte';
	import {engine, fetchAndParseSampleCSV} from '$lib';

	// Drawer open state (mobile)
	let drawerOpen = $state(false);

	// Track active tab via engine's getter
	const activeTab = $derived.by(() => engine.activeTab);

	// Resizable sidebar width in px. Default 305px (Phase 6); range 200–480px.
	const MIN_SIDEBAR_WIDTH = 200;
	const MAX_SIDEBAR_WIDTH = 480;
	let sidebarWidth = $state(305);

	// Sidebar collapsed state. When collapsed, only the toggle button remains
	// visible (a narrow strip), and the arrow faces right to re-expand.
	let sidebarCollapsed = $state(false);

	// Collapsed strip width — just wide enough to hold the toggle button.
	const COLLAPSED_SIDEBAR_WIDTH = 40;

	let {children} = $props();

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

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	// Horizontal resize of the sidebar via pointer drags on the divider handle.
	function startSidebarResize(event: PointerEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const startWidth = sidebarWidth;

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const next = startWidth + (moveEvent.clientX - startX);
			sidebarWidth = Math.min(
				MAX_SIDEBAR_WIDTH,
				Math.max(MIN_SIDEBAR_WIDTH, next),
			);
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
		<!-- Sidebar (hidden on mobile when closed) -->
		<aside
			class="hidden lg:flex flex-col bg-[#F9FAFB] border-r border-[#E5E5E5] overflow-hidden shrink-0 transition-[width] duration-200"
			class:!flex={drawerOpen}
			style:width={sidebarCollapsed
				? COLLAPSED_SIDEBAR_WIDTH + 'px'
				: sidebarWidth + 'px'}
		>
			<!-- Brand header at top of the sidebar pane (pinned, never scrolls) -->
			<header
				class="flex items-center justify-between gap-2 border-b border-[#E5E5E5] bg-white px-3 py-2 shrink-0"
			>
				{#if !sidebarCollapsed}
					<span
						class="text-lg font-bold tracking-tight text-[#1C1C1C] whitespace-nowrap"
						>Practice Insight</span
					>
				{/if}
				<button
					type="button"
					onclick={toggleSidebar}
					aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					aria-expanded={!sidebarCollapsed}
					title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					class="shrink-0 rounded-md p-1.5 text-[#6E6E6E] hover:bg-[#F9FAFB] hover:text-[#1C1C1C] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAA845] {sidebarCollapsed
						? 'mx-auto'
						: ''}"
				>
					{#if sidebarCollapsed}
						<ChevronRight class="w-5 h-5" aria-hidden="true" />
					{:else}
						<ChevronLeft class="w-5 h-5" aria-hidden="true" />
					{/if}
				</button>
			</header>

			<!-- Scrollable control panel area -->
			{#if !sidebarCollapsed}
				<div class="flex-1 overflow-y-auto">
					<ControlPanel />
				</div>
			{/if}
		</aside>

		<!-- Resize handle: horizontal resize cursor on hover (only when expanded) -->
		{#if !sidebarCollapsed}
			<div
				class="hidden lg:block w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-[#EAA845]/60 transition-colors"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				onpointerdown={startSidebarResize}
			></div>
		{/if}

		<main class="flex-1 flex flex-col overflow-y-auto">
			<!-- Mobile drawer trigger (visible only on mobile) -->
			<div
				class="lg:hidden flex items-center border-b border-[#E5E5E5] px-2 py-1"
			>
				<button
					class="rounded-md p-1.5 text-[#6E6E6E] hover:bg-[#F9FAFB] hover:text-[#1C1C1C] transition-colors"
					onclick={toggleDrawer}
					aria-label="Open menu"
				>
					<svg
						class="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/></svg
					>
				</button>
			</div>
			<TabBar />
			{#if activeTab === 'timeline'}
				<TimelineView />
			{:else if activeTab === 'comparison'}
				<ComparisonView />
			{:else if activeTab === 'usage'}
				<UsageView />
			{:else}
				<DistributionView />
			{/if}
			{@render children()}
		</main>
	</div>
</div>
