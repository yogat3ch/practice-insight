# Phase 6 — Interface Polish & Refinement

> **Purpose:** Polish the Practice Insight interface per the action items below.
> Each task is written to be **explicit and verifiable for an agent**: it names
> the exact files/functions to touch, the acceptance criteria, and the open
> questions that need user confirmation before implementation.
>
> **Conventions (read first):** Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`). Engine state lives in `$lib` singleton `engine` (`PracticeDataEngine.svelte.ts`). Styling per `.agents/prompts/style_guide.md` (Google-style Prettier; tabs; emerald interactive accent, amber selection accent). Verify with `npm run check` (0 errors), `npm test` (120), `npm run build`. Format with `npx prettier --write <files>` (do **not** re-add `prettier-plugin-tailwindcss`).

---

## 1. Tab Bar

### 1.1 Starting width of the Tab Bar at 305px on desktop

**File:** `src/routes/+layout.svelte` (the resizable sidebar layout) and `src/lib/components/TabBar.svelte` (the tab strip).

**Current behavior:** The sidebar width is `$state` in `+layout.svelte` with `MIN_SIDEBAR_WIDTH = 200`, `MAX_SIDEBAR_WIDTH = 480`, default `270`. `TabBar.svelte` renders only the tab buttons — it does not own layout width.

**Decision (from review):** "Tab Bar starting width 305px" = the **entire sidebar's default width** — not a fixed width on the tab strip.

**Required change:**

- Change the default sidebar width from `270` to `305` in `src/routes/+layout.svelte` (the `sidebarWidth` `$state` initial value).
- No change to the tab strip itself in `TabBar.svelte`.

**Acceptance criteria:**

- On desktop load, the left sidebar (Tab Bar + controls) is `305px` wide.
- Dragging the divider still resizes within `200–480px`.
- Collapse/expand toggle still works.

### 1.2 Date Range pickers wrap when the calendar button oversets the container

**File:** `src/lib/components/ControlPanel.svelte` (Global Filters → Date Range section) and `src/app.css` (any responsive helpers).

**Current behavior:** The From/To date inputs are in a `flex -space-x-px` row with `flex-1` children. At narrow widths the right edge of the `To` `<input type="date">` (its native calendar button) can overflow the container.

**Decision (from review):** Use the conventional, least-computational approach — `flex-wrap` (option A).

**Required change:**

- Add `flex-wrap` to the From/To row in `ControlPanel.svelte` and set a sensible per-input basis/min-width so the two date pickers stack vertically when there isn't enough width.
- Ensure the `To` input's native calendar button never oversets the sidebar container.

**Acceptance criteria:**

- At the default 305px sidebar (and down to `MIN_SIDEBAR_WIDTH` 200px), the From/To pickers fit without the `To` calendar button overflowing or being clipped.
- No horizontal scrollbar is introduced in the sidebar.

---

## 2. Global Filters — Time Window

**Goal:** Promote the `Time Window` selector from `TimelineControls.svelte` into the **Global Filters** section of `ControlPanel.svelte` so it is available across all tabs.

### 2.1 Move the `Time Window` input above `Date Range` in Global Filters

**Files:**

- `src/lib/components/ControlPanel.svelte` — add the Time Window selector into the Global Filters `<Accordion>`, positioned **above** the `Date Range` block (and logically near the top, before Activities/Presets/Unit per UX).
- `src/lib/components/TimelineControls.svelte` — remove the Time Window block + its `TIME_WINDOW_OPTIONS`, `selectPreset`, `formatRangeLabel`, `rangeLabel`, and the `TimeWindowPreset`/`computeTimeWindowDateRange`/`format` imports that become unused.

**Current behavior (grounding):**

- `TimelineControls.svelte` holds `TIME_WINDOW_OPTIONS`, a local `timePreset` `$state`, `selectPreset()` which calls `engine.setDateRange()` immediately, `formatRangeLabel()`/`rangeLabel` used to render a `<p>` below the select, and the Apply button calls `engine.setTimePreset(timePreset)`.
- `ControlPanel.svelte` holds the global `dateFrom`/`dateTo` `$state`, the `Date Range` pickers, and `applyFilters()` which calls `engine.setDateRange(from, to)`.

**Required change:**

- Move the Time Window `<select>` (with its `<Tooltip for="timeWindow" />`) into `ControlPanel.svelte`'s Global Filters accordion, above the `Date Range` heading.
- **Default to `All Time` selected** — `DEFAULT_TIMELINE_CONFIG.timePreset` is already `'All'`; initialize local state from `engine.timelineConfig.timePreset` (consistent with current pattern).
- **Remove the `<p>` date-range label** beneath the Time Window select (`formatRangeLabel`/`rangeLabel`).
- Instead of showing the label, **populate the `Date Range` pickers** (`dateFrom`/`dateTo` `$state`) with the dates implied by the selected preset, using `computeTimeWindowDateRange(preset, engine.filteredSessions)`.
- **Do not auto-apply.** Selecting a preset only updates the local `dateFrom`/`dateTo` fields; the user clicks **Apply Filters** to commit via `engine.setDateRange(from, to)`.

**Decisions (from review):**

- The global Time Window is **Option B** — it does **not** call `engine.setTimePreset()` anymore. It interfaces directly with the singular global Date Range filter (populates `dateFrom`/`dateTo`; `applyFilters()` calls `engine.setDateRange()`).
- The Time Window select sits **immediately above the `Date Range` block** in Global Filters.
- Resulting cleanup: the `timePreset` local state and `setTimePreset` wiring are removed from `TimelineControls.svelte` along with the Time Window block.

**Acceptance criteria:**

- Time Window select appears in Global Filters immediately above Date Range, on all three tabs.
- Default value is `All Time` on first load.
- Selecting e.g. `Last 6 Months` fills the From/To date inputs with the computed range; no `<p>` range text is shown.
- Nothing is applied until **Apply Filters** is clicked; clicking it sets the engine date range only (no `timePreset` change).

---

## 3. Distribution Controls — Day-of-Week chart labels

### 3.1 Round Day-of-Week chart labels to one decimal place

**File:** `src/lib/engine/compilers/distribution-compiler.ts`.

**Current behavior (grounding):** Tooltips already use `.toFixed(1)` (e.g. `value.toFixed(1)`). The chart **axis labels** on value axes currently have no formatter, so they may render many decimals.

**Decision (from review):** Only the **embedded `visualMap` labels on the Day-of-Week heatmap**. Axis labels are fine and unchanged.

**Required change:**

- In `compileDayOfWeekHeatmapMatrix` (and the single-row heatmap variant in `compileDayOfWeekOption` if it embeds numeric `visualMap` labels), format the `visualMap` numeric labels to **one decimal place** so they match the tooltip (which already uses `.toFixed(1)`).
- Do **not** change bar-chart axis labels.

**Acceptance criteria:**

- Day-of-Week heatmap `visualMap` labels show at most 1 decimal place (e.g. `12.5`), matching the tooltip.
- No regression to other distribution charts.

### 3.2 Add a checkbox to toggle Day-of-Week chart labels on/off

**File:** `src/lib/components/DistributionControls.svelte` (UI) + `src/lib/engine/PracticeDataEngine.svelte.ts` / `src/lib/types/engine.ts` (new config flag) + `src/lib/engine/compilers/distribution-compiler.ts` (consume flag).

**Current behavior (grounding):** `DistributionControls.svelte` renders a `dayOfWeek` category with styles `heatmap`/`bar`. `applyControls()` calls engine setters (`setDistributionCategory`, `setDistributionStyle`, etc.). There is **no** existing flag for toggling axis labels.

**Decision (from review):** The checkbox toggles **only the embedded `visualMap` labels on the Day-of-Week heatmap** — not axis labels (axis labels are fine, no change needed).

**Required change:**

- Add a boolean config field, e.g. `showDayOfWeekLabels` (default `true`), to `DistributionConfig` in `src/lib/types/engine.ts` + `DEFAULT_DISTRIBUTION_CONFIG`.
- Add a setter `setShowDayOfWeekLabels(show: boolean): void` on the engine (explicit `void` return, runes `$state` update pattern).
- In `DistributionControls.svelte`, render a checkbox **only when** `category === 'dayOfWeek' && chartStyle === 'heatmap'`, bound to local `$state` and sent via `applyControls()`.
- In the compiler, when the flag is `false`, hide the heatmap `visualMap` labels (e.g. `visualMap: {label: {show: false}}` on `compileDayOfWeekHeatmapMatrix` and the single-row heatmap variant).

**Acceptance criteria:**

- The "Show Labels" checkbox appears in Distribution Controls only when Day-of-Week **heatmap** is selected.
- Toggling it off + Apply hides the heatmap `visualMap` labels; toggling on restores them.
- Axis labels are unaffected.
- Value persists across tab switches (lives in `engine.distributionConfig`).

---

## 4. Chart View Area — Download icon

**Goal:** Add a lucide `download` icon to the left of the PNG/SVG export buttons in the top-right of the active chart view area.

**Files (all three chart views + the shared chart cards):**

- `src/lib/components/TimelineView.svelte` (top-right PNG/SVG buttons; grid mode uses `TimelineChartCard`)
- `src/lib/components/ComparisonView.svelte` (top-right PNG/SVG buttons; grid mode uses `ComparisonChartCard`)
- `src/lib/components/DistributionView.svelte` (top-right PNG/SVG buttons)
- `src/lib/components/TimelineChartCard.svelte` (per-segment PNG/SVG buttons)
- `src/lib/components/ComparisonChartCard.svelte` (per-period PNG/SVG buttons)

**Decisions (from review):**

- The download icon is a **decorative grouping indicator** — it is not a separate actionable button; it signals that the PNG/SVG buttons initiate a download.
- **Refactor:** `exportPNG`/`exportSVG` are already defined once in `src/lib/echarts/echartAction.ts` and imported by each file — that part is already shared. The **button-container markup is duplicated** across the views/cards, so extract it into a **shared `ExportControls.svelte` component** to remove duplication.

**Current behavior (grounding):** Each view renders `PNG` and `SVG` pill buttons (`bg-emerald-600`) in a `flex justify-end space-x-2` (or `space-x-1` in cards). There is no download icon.

**Required change:**

- **New component** `src/lib/components/ExportControls.svelte`:
  - Props: a reference to the chart DOM element (needed for `exportPNG`/`exportSVG`), a filename prefix, and an optional `label` for titles/aria.
  - Renders the decorative `Download` icon (from `@lucide/svelte/icons/download`) to the left of the `PNG` / `SVG` buttons, calling the shared `exportPNG`/`exportSVG` from `$lib/echarts/echartAction`.
  - Reuses the existing emerald pill styling; the icon is decorative (`aria-hidden` on the icon, with an accessible `aria-label` describing the group), keyboard-focusable per the style guide.
- **Refactor the 5 files** to use `ExportControls.svelte` instead of inlining the buttons:
  - `TimelineView.svelte`, `ComparisonView.svelte`, `DistributionView.svelte`
  - `TimelineChartCard.svelte`, `ComparisonChartCard.svelte`

**Acceptance criteria:**

- A `download` icon appears to the left of the PNG/SVG buttons in the active chart view area and in grid-mode cards.
- The PNG/SVG buttons and icon are rendered from the single shared `ExportControls.svelte` component across all 5 sites; no duplicate button markup remains.
- Export behavior is unchanged (same `exportPNG`/`exportSVG`).
- Icon is accessible and follows the emerald accent / style guide.

---

## Verification Summary (for each task)

1. `npm run check` → `svelte-check` 0 errors (1 pre-existing intentional `Accordion.svelte` capture warning).
2. `npm test` → `Test Files 8 passed (8), Tests 120 passed (120)`.
3. `npm run build` → static SPA output succeeds.
4. Format changed files: `npx prettier --write <files>`.

## Suggested commit structure

Chunk logically, one commit per concern:

1. `feat(controls): promote global time window & populate date range` (Task 2)
2. `feat(distribution): round day-of-week labels + show/hide labels toggle` (Task 3)
3. `feat(ui): add download icon to chart export controls` (Task 4)
4. `style(ui): tab bar width + responsive date range wrap` (Task 1)

Each commit must be internally coherent (compiles + tests together) and confirm before committing (stage, show `git status --short` + `git diff --cached --stat`, present message, commit after user confirms).

---

## Decisions from Review (all open questions resolved)

| #   | Question                             | Decision                                                                                                                                                  |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tab Bar width scope                  | **Entire sidebar default width** → `305px` (`sidebarWidth` init in `+layout.svelte`). Not a fixed tab-strip width.                                        |
| 2   | Date-range wrap approach             | **`flex-wrap`** (conventional, least compute).                                                                                                            |
| 3   | Time Window `setTimePreset` on Apply | **No** — Option B. It interfaces directly with the global Date Range filter; `timePreset` wiring removed from `TimelineControls`.                         |
| 4   | Time Window placement                | **Immediately above `Date Range`** in Global Filters.                                                                                                     |
| 5   | Label rounding scope                 | **Only the embedded heatmap `visualMap` labels**; axis labels unchanged.                                                                                  |
| 6   | Labels toggle scope                  | **Only the heatmap `visualMap` labels** (checkbox shown for Day-of-Week heatmap only); axis labels unchanged.                                             |
| 7   | Download icon                        | **Decorative grouping indicator**; plus extract a shared `ExportControls.svelte` component (`exportPNG`/`exportSVG` already shared in `echartAction.ts`). |

## General Cleanup (from overall review)

- `TimelineControls.svelte`: remove the Time Window block, `TIME_WINDOW_OPTIONS`, `selectPreset`, `formatRangeLabel`, `rangeLabel`, and the `TimeWindowPreset` / `computeTimeWindowDateRange` / `format` imports once no longer used.
- The 5 view/card files: remove inlined PNG/SVG button markup in favor of `ExportControls.svelte`.
- Remove any imports/setters left unused after the refactors (e.g. unused `setTimePreset` call sites, unused Lucide imports).
- After cleanup, run `npm run check` + `npm test` + `npm run build` + prettier to confirm nothing breaks.

## Remaining implementation details (no blocking questions)

- `ExportControls.svelte` prop interface: it needs a reference to the chart DOM element (for `exportPNG`/`exportSVG`) plus a filename prefix. Exact prop names are a design detail to confirm during implementation.
- New config flag name `showDayOfWeekLabels` — adjust naming if preferred.
