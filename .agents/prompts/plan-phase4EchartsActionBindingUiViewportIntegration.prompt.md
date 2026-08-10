## Plan: Phase 4 – ECharts Action Binding & UI Viewport Integration

Implement the final UI layer: a responsive left‑drawer control panel, tab‑based viewports for the three analytical charts, a reusable `use:echartAction` Svelte action that handles chart lifecycle (init, update, resize, disposal), wire the action to the three compiled ECharts options from `PracticeDataEngine`, add PNG/SVG export buttons in each tab’s toolbar, and make the layout fully responsive (mobile drawer). All UI components are Tailwind‑styled and use Svelte 5 runes.

**Steps**

1. **Setup shared ECharts registration module** (`src/lib/echarts/registry.ts`).
   - Import required charts (`BarChart`, `LineChart`, `HeatmapChart`, `PieChart`, etc.) and components (`GridComponent`, `TooltipComponent`, `DataZoomComponent`, `TitleComponent`).
   - Call `echarts.use([...])` and export the configured `echarts` instance.
   - _Parallel with step 2._

2. **Create reusable Svelte action** (`src/lib/echarts/echartAction.ts`).
   - Parameters: `option: EChartsOption`, `theme?: string`.
   - On mount: `echarts.init(node, theme)`; store chart instance.
   - Reactive update: `$: if (chart && option) chart.setOption(option, true);`
   - Resize handling: `ResizeObserver` attached to node; call `chart.resize()` on changes.
   - Disposal: `onDestroy(() => chart.dispose());`
   - Export helper functions `exportPNG(chart)` and `exportSVG(chart)` returning data URLs.
   - Depends on step 1.

3. **Add UI layout** (`src/routes/+layout.svelte`).
   - Replace current simple layout with a responsive drawer using **shadcn‑svelte** components (`Drawer`, `DrawerContent`, `DrawerTrigger`).
   - Include a hamburger button for mobile (visible on `lg:hidden`).
   - Inside drawer: `<ControlPanel />` component (step 4).
   - Main area: `<TabBar />` (step 5) + conditional rendering of viewport components.
   - Ensure Tailwind classes for flex layout, overflow handling.

4. **Implement ControlPanel component** (`src/lib/components/ControlPanel.svelte`).
   - Use **Formsnap** for form state; bind to engine setters via `$engine.setX(...)`.
   - Controls (all per spec):
     - CSV upload badge (reuse existing logic from `parse-csv`).
     - Multi‑select chips for Activity and Preset (shadcn‑svelte `MultiSelect`).
     - Unit toggle (`SegmentedControl`).
     - Date range picker (`DateRangePicker`).
     - Granularity dropdown, Split‑by dropdown.
     - Moving‑average slider (`Slider`).
     - Checkboxes for Mean, StdDev, Trendline.
     - Comparison strategy selector, period add/remove UI.
     - Distribution category selector, chart style toggle, metric toggle, threshold numeric input.
   - Emit changes directly to `PracticeDataEngine` via its public setter methods.
   - Add a “Reset” button that calls `engine.resetAll()`.

5. **Create Tab navigation** (`src/lib/components/TabBar.svelte`).
   - Tabs: Timeline, Comparison, Distribution.
   - Use `$state('timeline')` to store active `TabId`.
   - Clicking a tab updates engine via `engine.setTab(tabId)`.
   - Highlight active tab with Tailwind styling.

6. **Viewport components** (one per tab):
   - `TimelineView.svelte`, `ComparisonView.svelte`, `DistributionView.svelte` under `src/lib/components/`.
   - Each imports `echartAction` and renders `<div use:echartAction={option}>` where `option` comes from the corresponding derived `$engine.timelineOption`, etc.
   - Include a **ChartToolbar** (`src/lib/components/ChartToolbar.svelte`) with export buttons.
   - Export buttons call `exportPNG(chart)` / `exportSVG(chart)` from the action and trigger a download (`<a download>`).
   - Ensure the toolbar is visible above the chart and sticky.

7. **Integrate components in layout**.
   - In `+layout.svelte`, after `<TabBar />`, conditionally render the active viewport component using `$engine.tabId`.
   - Pass the engine instance via context (`setContext('engine', engine)`) or import the singleton `$lib.PracticeDataEngine`.

8. **Responsive adjustments**.
   - Drawer collapses to top sheet on `sm`/`md` breakpoints; use Tailwind utilities (`hidden lg:block`).
   - Ensure chart container takes full width/height of remaining space (`flex-1 w-full h-full`).
   - Provide instructions for manual testing in the output.

9. **Export functionality implementation**.
   - In `ChartToolbar`, add two buttons with icons (lucide-svelte `Download` and `Image`).
   - On click, call the appropriate export helper from the action and create a Blob to download.
   - Name files `timeline-{timestamp}.png` for `Image` or `.svg` for `Download` accordingly.

10. **Update barrel exports**.
    - Add new files to `src/lib/index.ts` (`export * from './echarts/registry'; export * from './echarts/echartAction'; export * from './components/...';`).
    - Ensure TypeScript paths (`$lib`) remain correct.

11. **Testing & Verification**.
    1. **Manual UI test**: run `npm run dev`, open app on desktop and mobile widths. Verify drawer opens/closes, controls update engine, charts refresh instantly.
    2. **Export test**: click PNG and SVG buttons for each tab, confirm downloaded files open and display the chart.
    3. **Resize test**: resize browser window; chart should adapt without flicker.
    4. **Performance check**: large sample CSV (13 k rows) – ensure UI remains responsive.
    5. **Vitest addition** (optional): test `echartAction` lifecycle using JSDOM and mock `echarts.init`.

**Relevant files**

- `src/lib/echarts/registry.ts` – shared ECharts registration.
- `src/lib/echarts/echartAction.ts` – reusable Svelte action.
- `src/lib/components/ControlPanel.svelte` – global filter UI.
- `src/lib/components/TabBar.svelte` – tab navigation.
- `src/lib/components/ChartToolbar.svelte` – export buttons.
- `src/lib/components/TimelineView.svelte`, `ComparisonView.svelte`, `DistributionView.svelte` – chart viewports.
- `src/routes/+layout.svelte` – overall page layout with drawer.
- `src/lib/index.ts` – barrel export updates.

**Verification**

1. `npm run check` – no TypeScript errors.
2. `npm run dev` – UI renders, drawer works, charts display with data.
3. Export PNG/SVG works for all three tabs.
4. Mobile view: drawer toggles via hamburger, chart container resizes correctly.
5. All controls affect the chart in real‑time (e.g., unit toggle, moving‑average slider).

**Decisions**

- Use a **single reusable `echartAction`** as requested.
- UI built with **shadcn‑svelte** + **Tailwind 4** markup; Formsnap for form handling.
- Export both PNG and SVG with toolbar buttons.
- Full responsive layout (mobile drawer).
- No server‑side code changes; all logic stays client‑side.

**Further Considerations**

1. **Accessibility** – ensure all controls have ARIA labels; may need a later pass.
2. **Theming** – consider adding dark‑mode toggle using ECharts theme registration.
3. **Unit tests** – add Vitest suites for the action and control panel once UI is stable.

_Please review this plan. Once approved, implementation can proceed._
