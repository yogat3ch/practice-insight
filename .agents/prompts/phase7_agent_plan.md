## Plan: Phase 7 — Visualization Fixes

**TL;DR:** Fix three concrete bugs/behaviors (All Time reset, Time Split option filtering, heatmap label rounding/toggle), polish the Comparison View (X-axis label density + auto color palette), and **defer** the large Temporal Grouping comparison feature for deliberation.

I've separated the work into **3 phases** so each is independently verifiable and commitable. Phases 7a and 7b are well-scoped fixes with clear code paths. Phase 7c (Temporal Grouping) is held back for your deliberation.

---

### Phase 7a — Fixes (Control Panel + Distribution heatmap)

**7a.1 — All Time resets the Date Range picker**
- **Root cause found:** ControlPanel.svelte `selectPreset()` calls `computeTimeWindowDateRange(value, engine.filteredSessions)`. For `'All'` the helper computes min/max from **`engine.filteredSessions`** (already filtered by the *current* date range), so switching back to All Time never expands past the currently-applied window.
- **Fix (decided: raw dataset):** compute against the **raw** dataset, ignoring the current activity/preset/date filters — "All Time" always means everything in the file. Add an engine getter (e.g. `allSessionDateRange(): [Date, Date] | null`) that scans `#sessions` for min/max `startedAt`, and have `selectPreset` use it for `'All'`. Add tests in `date-utils`/engine.
- **File:** ControlPanel.svelte, PracticeDataEngine.svelte.ts, date-utils.ts (test).

**7a.2 — Time Split options filtered by Aggregate By**
- **Ordinal interpretation (decided):** `day < week < month < quarter < season < year`; TimelineControls.svelte shows only `Time Split` intervals **strictly greater** than the selected `Aggregate By` granularity, and `No Split` is **always** available.
- **Reset behavior:** if the current `splitBy` is smaller than (or equal to) the selected granularity, **reset it to `No Split`** before filtering the options.
- **Warning infobox (decided — Tailwind classes):** show it **directly under the Time Split select** (matching the existing seasons-note pattern), using the lucide `triangle-alert` icon with color `orange-400` and background `amber-300`.
- **Exact wording (decided):** `Time Split reset to No Split because selection was smaller than Aggregate By`
- **Also:** change the existing Seasons infobox background from `amber-100` to `blue-300` (both TimelineControls.svelte and DistributionControls.svelte).
- **Files:** TimelineControls.svelte, DistributionControls.svelte. Add a granularity-rank helper (probably in aggregators.ts or a new small util) with tests.

**7a.3 — Heatmap labels: rounding + show/hide actually works**
- **Root cause found:** Phase 6's fix targeted the `visualMap` component's `show`/`precision`, but the **cell labels are the `series.label`**, not the visualMap labels. The `series.label` has no formatter (so no rounding) and `series.label.show` is hardcoded `true` (so the toggle doesn't work).
- **Fix:** apply a `formatter` to `series.label` (round value to 1 decimal) and drive `series.label.show` from `showDayOfWeekLabels`, in **both** heatmap variants (`compileDayOfWeekOption` heatmap branch and `compileDayOfWeekHeatmapMatrix`). Keep the visualMap `show`/`precision` as-is.
- **Files:** distribution-compiler.ts + tests in distribution-compiler.test.ts.

---

### Phase 7b — Comparison View polish

**7b.1 — X-axis label density**
- **Why Comparison crowds but Timeline doesn't:** both use dense category axes, but Comparison builds a **union** of all periods' bucket labels (up to ~N× more labels), while its `axisLabel.interval` is hardcoded (`>24 ? 1 : 0`, rotate `>30 ? 45 : 0`).
- **Solution (decided — accepted):** use `axisLabel: {interval: 'auto', hideOverlap: true}` so ECharts skips/hides overlapping labels, keep the existing `dataZoom` slider for panning/zooming, and keep rotate for extreme density. This matches how Timeline already relies on auto layout + zoom.
- **Files:** comparison-compiler.ts (both `compileComparisonOption` and `compileComparisonGridOptions`).

**7b.2 — Auto-populated comparison colors**
- ComparisonControls.svelte currently defaults `newColor = '#10b981'` for every added period (emerald for all).
- **Solution (decided):** reuse the existing **8-color `DEFAULT_SERIES_PALETTE`** (emerald, amber, blue, pink, violet, teal, orange, indigo). Auto-fill the color picker with `palette[periods.length % 8]`; **after the 8 colors are used, just repeat** (no random generation). The user can still override any period color.
- **Implementation:** export `DEFAULT_SERIES_PALETTE` from comparison-compiler.ts (single source of truth, avoid a second palette); add a testable engine helper `suggestComparisonColor(index): string` returning `DEFAULT_SERIES_PALETTE[index % 8]`; in ComparisonControls.svelte initialize `newColor` from it based on `periods.length` and refresh it after each add.
- **Files:** PracticeDataEngine.svelte.ts (helper), comparison-compiler.ts (export palette), ComparisonControls.svelte (auto-populate `newColor`).

---

### Phase 7c — (Deferred) Temporal Grouping comparison feature

**Deliberation reserved — not planned yet.** I'll draft this only after 7a/7b are finalized and you've weighed in on the design questions at the bottom. My initial read on the risks (so you can start thinking):
1. **Heavy overlap with Comparison View** — "Period-over-Period (relative)" and "Sequential Side-by-Side" already exist on Tab 2 (compilers `compileComparisonOption` / `compileComparisonGridOptions`).
2. **Dual X-axes** for bar charts (primary day-of-week + secondary date-range axis) and **dual-axis radial plots** are both awkward in ECharts and would need custom, fragile layout.
3. **Scope** — applying it across Day-of-Week, Time-of-Day, and Activity/Preset breakdown is a large surface area.

---

## Verification (all phases)
1. `npm run check` → `svelte-check` **0 errors, 0 warnings**
2. `npm test` → all suites pass (currently 123)
3. `npm run build` → static SPA succeeds
4. Format changed files with `npx prettier --write <files>` (Google style; do **not** re-add `prettier-plugin-tailwindcss`)
5. Manual visual check per the skill (prompt user; don't run `npm run dev` in the sandbox)

## Commit structure (pre-approved — commit as each task completes)
- Phase 7a → one commit per fix (engine+compiler first, then UI):
  1. `fix(controls): reset date range to full span on All Time` (7a.1)
  2. `fix(controls): filter Time Split options & reset to No Split` (7a.2)
  3. `style(ui): restyle warning & season infoboxes` (7a.2 styling)
  4. `fix(distribution): round + toggle heatmap series labels` (7a.3)
- Phase 7b:
  5. `fix(comparison): auto-hide overlapping x-axis labels` (7b.1)
  6. `feat(comparison): auto-populate period colors from palette` (7b.2)


---

## Decisions Summary (locked)

| # | Topic | Decision |
|---|-------|----------|
| 1 | X-axis density (7b.1) | OK — `interval: 'auto'` + `hideOverlap: true`; keep `dataZoom` + rotate for extremes |
| 2 | Palette (7b.2) | Reuse existing 8-color `DEFAULT_SERIES_PALETTE`; auto-fill `palette[periods.length % 8]`; repeat after 8 (no random) |
| 3 | Time Split (7a.2) | Ordinal `day < week < month < quarter < season < year`; only strictly-greater intervals + `No Split` always; warning infobox under Time Split; wording "Time Split reset to No Split because selection was smaller than Aggregate By" |
| 4 | All Time (7a.1) | Raw dataset min/max (ignore current filters) |
| 5 | Commits | Pre-approved; commit as each task completes |
| 6 | Infobox colors | Warning: `triangle-alert` icon, color `orange-400`, bg `amber-300`; Seasons infobox bg `amber-100` → `blue-300` (both Timeline + Distribution controls) |
