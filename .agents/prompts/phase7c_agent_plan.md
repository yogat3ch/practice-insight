# Phase 7c — Temporal Grouping Comparison + Elapsed-Days Axis Labels

**Purpose:** Implement the two remaining Phase 7 items: (1) make `Temporal Grouping` meaningful for the **Bar Chart** (and eventually other categories) by adding a comparison strategy, and (2) fix Comparison View's **Elapsed Days** axis labels so they reflect the actual aggregation interval instead of always saying "Day N".
**Conventions (read first):** Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`). Engine state lives in `$lib` singleton `engine` (`PracticeDataEngine.svelte.ts`). Styling per `.agents/prompts/style_guide.md` + Google-style Prettier (tabs). Verify with `npm run check` (0 errors), `npm test` (123), `npm run build`. Format with `npx prettier --write <files>` (do **not** re-add `prettier-plugin-tailwindcss`).

---

## Infobox styling (per 7a — locked Tailwind classes)

Reuse the exact infobox styles established in Phase 7a (`phase7_agent_plan.md`):

- **Warning infoboxes** (heatmap-strategy conflict in 1.1; Time-of-Day polar fallback note in 1.2): lucide `triangle-alert` icon, icon color `orange-400`, background `amber-300`.
- **Informational infoboxes** (the `Aggregate By` display note in 2.2): the informational/seasons pattern, background `blue-300`.

---

## Part 1 — Temporal Grouping comparison feature

**Deliberation outcome (adopted from agent recommendation):** build the **MVP (Day-of-Week only)** first — grouped bars for `Period-over-Period` + a per-period card grid for `Sequential Side-by-Side`. Extend to Time-of-Day / Activity-Preset **only after the MVP is validated** (go/no-go gate).

### 1.1 — MVP: Day-of-Week grouped-bar comparison

**Goal:** When `Category = Day-of-Week` and `Chart Style = Bar Chart`, `Temporal Grouping` currently has **no effect** (the engine's `distributionOption` ignores it for `dayOfWeek` + `bar`). Add a **Distribution Comparison Strategy** selector so the grouped data can be compared.

**Files:**
- `src/lib/types/engine.ts` — add type + config fields (below).
- `src/lib/engine/PracticeDataEngine.svelte.ts` — new setter + getter wiring.
- `src/lib/engine/compilers/distribution-compiler.ts` — new `compileDayOfWeekPeriodBars()` compiler + export from barrel.
- `src/lib/components/DistributionControls.svelte` — new strategy selector (rendered contextually).
- `src/lib/components/DistributionView.svelte` — render overlay vs. grid using the new card pattern.
- `src/lib/components/DistributionChartCard.svelte` — **new** dedicated card (decided; avoid entangling comparison-specific labels/export prefixes).

**Type additions (`types/engine.ts`):**
```ts
/** Comparison strategy for temporal-grouped distributions (7c). */
export type DistributionComparisonStrategy = 'period' | 'grid';
```
Add to `DistributionConfig`:
```ts
/** Strategy for comparing temporal-grouped distributions. Ignored when
 *  temporal grouping has no effect (single-period dayOfWeek bar / timeOfDay /
 *  breakdown donut). */
readonly distributionStrategy: DistributionComparisonStrategy;
```
Default in `DEFAULT_DISTRIBUTION_CONFIG`: `distributionStrategy: 'period'`.

**Engine setter:**
```ts
setDistributionStrategy(strategy: DistributionComparisonStrategy): void {
	this.#distributionConfig = {...this.#distributionConfig, distributionStrategy: strategy};
}
```

**Compiler — `compileDayOfWeekPeriodBars()`:**
- Input: `periodBins` (the existing `dayOfWeekPeriodBins`), `unit`, `metric`.
- x-axis = `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`.
- One `bar` series per period, `data` = the 7 metric values for that period.
- Palette: reuse `DEFAULT_SERIES_PALETTE` (8 colors, consistent with 7b.2) — **export it** from `comparison-compiler.ts` (single source of truth) and import here.
- `legend` (scroll, bottom), `tooltip` (axis trigger), `grid` with `containLabel`, emerald/amber styling per style guide.
- **No dual X-axis** — period is conveyed via legend + tooltip.

**Engine `distributionOption` change:**
- In the `category === 'dayOfWeek' && chartStyle === 'bar'` branch, if `dayOfWeekPeriodBins.length > 0`:
  - `distributionStrategy === 'grid'` → return the **array** of per-period options (see getter below).
  - `distributionStrategy === 'period'` → return `compileDayOfWeekPeriodBars(dayOfWeekPeriodBins, unit, metric)`.
  - Fallback to existing `compileDayOfWeekOption(..., 'bar', metric)` when no grouping periods exist.
- Add engine getter `dayOfWeekPeriodBarOptions(): {period: string; option: EChartsOption}[]` (mirrors `comparisonGridOptions` pattern) for the grid mode.

**View (`DistributionView.svelte`):**
- When `category === 'dayOfWeek' && chartStyle === 'bar' && distributionStrategy === 'grid'`, render a `grid grid-cols-1 md:grid-cols-2 gap-3` of per-period cards using the **new `DistributionChartCard.svelte`** (decided).
- Otherwise render the single-chart `chartDiv` as today.

**Controls (`DistributionControls.svelte`):**
- Render the **Distribution Comparison Strategy** radio group only when `category === 'dayOfWeek' && chartStyle === 'bar'` (and temporal grouping is active — i.e. the grouped path is used).
- Options: `Period-over-Period (Relative)` | `Sequential Side-by-Side` (labels mirror `ComparisonControls` for familiarity).
- Bound to local `$state`, sent via `applyControls()` → `engine.setDistributionStrategy(...)`.
- **Heatmap conflict (decided):** if the user has the Strategy selector toggled to a non-default strategy (or is on the strategy group) and then selects the `heatmap` chart style, show an **ephemeral warning infobox** with the text: `Heatmap is incompatible with variable Comparison Strategies`. Styling: per 7a warning pattern — lucide `triangle-alert` icon (color `orange-400`) on `amber-300` background.

**Tests:**
- `distribution-compiler.test.ts`: new cases for `compileDayOfWeekPeriodBars` (correct number of series = period count; each series has 7 points; palette assignment).
- `engine.test.ts`: default `distributionStrategy === 'period'`; setter round-trip; `dayOfWeekPeriodBarOptions` returns per-period options.

### 1.2 — Extension (go/no-go, AFTER MVP validated)

- **Time-of-Day:** add `computeTimeOfDayPeriodDistribution()` calculator (per-period 24-bin). Grouped-histogram overlay for `Period-over-Period`; **polar overlay is not supported by ECharts** (all series share one `angleAxis`) → grid-only fallback + notify user with a **warning infobox** (per 7a warning pattern: `triangle-alert`, `orange-400` on `amber-300`).
- **Activity/Preset Breakdown:** grouped-bar overlay using existing `categoryPeriodItems` (already computed) + `distributionStrategy`.
- **Heatmap matrix:** leave as-is (it already renders per-period rows); do not add an overlay. If the heatmap chart style is selected while the comparison Strategy is toggled, show the ephemeral infobox: `Heatmap is incompatible with variable Comparison Strategies` (decided, see Controls above).

---

## Part 2 — Fix: Elapsed Days axis labels reflect the actual interval

**Problem:** When `X-Axis Alignment = Elapsed Days` and large time scales are compared (e.g. one year vs another year), the x-axis labels are hardcoded `Day 1 … Day N`, even though each tick is actually a week/month/quarter bucket depending on `Aggregate By` granularity.

**Root cause (grounded):** In `comparison-compiler.ts`, `computeComparisonLayout()` builds:
```ts
xCategories = Array.from({length: maxLen}, (_, i) => `Day ${i + 1}`);
```
This never consults the bucket interval. `TimeBucket` already carries `startDate`/`endDate`, and the aggregator produces sensical labels (`W34 (Aug 18)`, `Sep 2025`, `Q3 2025`, `2025`) — so the fix is to derive the elapsed label from the **bucket's own interval**, not a fixed `Day N`.

**Fix (elapsed label format — decided: relative + natural label in tooltip):**
- Pass the **granularity** into `computeComparisonLayout` / `compileComparisonOption` / `compileComparisonGridOptions` (new `granularity` field on `ComparisonCompilerInput`), sourced from `engine.timelineConfig.granularity` (**Option A — decided**).
- For elapsed mode, build `xCategories` by mapping each **slot index** to a **relative** label reflecting the actual elapsed interval:
  - `day` → `Day N` (unchanged, correct for daily data).
  - `week` → `Week N`.
  - `month` → `Month N`.
  - `quarter` → `Q N`.
  - `season`/`year` → natural bucket label (e.g. `2025 Seasonal Year`, `2025`).
- Keep the **natural bucket label** (e.g. `W34 (Aug 18)`, `Sep 2025`, `Q3 2025`) in the **tooltip** via the existing `elapsedToCalendar` lookup (slot → calendar label).
- Ensure `axisLabel.interval` / `hideOverlap` (7b.1) still apply — the label count is unchanged, only the text.

**2.2 — New: expose `Aggregate By` in Comparison Controls (decided — user proposal)**
- **Why:** Comparison implicitly inherits the Timeline `Aggregate By` granularity (it buckets periods with `timelineConfig.granularity`), but the input lives on a non-visible tab. That hidden coupling is confusing.
- **Add to `src/lib/components/ComparisonControls.svelte`:**
  - A **read-only static display** labeled **`Aggregate By`** (exact same label as the Timeline Controls input to avoid ambiguity) showing the current interval.
  - Value derived reactively: `const aggregateBy = $derived(engine.timelineConfig.granularity)` → display the human label (Day/Week/Month/Quarter/Season/Year).
  - Render as a **non-interactive styled value** (not a `<select>`), so it can't be mistaken for a control.
  - An **informational infobox** beneath it (per 7a informational pattern — background `blue-300`) with text: `Modify Aggregate By via Timeline Controls`.
- **Placement:** near the **X-Axis Alignment** group (elapsed-mode labels depend on this interval).
- **Files:** `src/lib/components/ComparisonControls.svelte`. No engine changes needed (pure derived display).

**Files:** `src/lib/engine/compilers/comparison-compiler.ts`, `src/lib/engine/PracticeDataEngine.svelte.ts` (pass `granularity` into both compiler calls).

**Tests:** `comparison-compiler.test.ts` — elapsed mode with `granularity: 'month'` yields `Month N` labels (not `Day N`); day granularity still yields `Day N`; grid + overlay variants both covered.

**Test note (2.2):** `ComparisonControls.svelte` is UI-only (no logic tests needed beyond existing component conventions); the reactive `aggregateBy` display derives from `engine.timelineConfig.granularity` — covered by existing engine granularity tests + visual check.

---

## Verification (both parts)

1. `npm run check` → `svelte-check` **0 errors, 0 warnings**
2. `npm test` → all suites pass (123 + new tests)
3. `npm run build` → static SPA succeeds
4. Format changed files with `npx prettier --write <files>`
5. Manual visual check per the skill (prompt user; don't run `npm run dev` in the sandbox)

## Implementation order (proposed)

1. **Part 1.1 engine+compiler** → commit `feat(distribution): add temporal-grouped day-of-week comparison bars`
2. **Part 1.1 UI** (strategy selector, `DistributionChartCard`, grid view, heatmap-strategy warning) → commit `feat(ui): add distribution comparison strategy selector & grid cards`
3. **Part 2** (elapsed-label granularity fix) → commit `fix(comparison): use actual interval in elapsed-days axis labels`
4. **Part 2.2** (`Aggregate By` read-only display + informational infobox) → commit `feat(ui): surface aggregate-by inheritance in comparison controls`
5. **Part 1.2** (Time-of-Day / Breakdown extension) → **only after MVP validated** (go/no-go) → commit `feat(distribution): extend temporal-grouped comparison to time-of-day & breakdown`

## Suggested commit structure (pre-approved per 7a/7b pattern; confirm before each)

- `feat(distribution): add temporal-grouped day-of-week comparison bars` (Part 1.1 engine+compiler)
- `feat(ui): add distribution comparison strategy selector & grid cards` (Part 1.1 UI)
- `fix(comparison): use actual interval in elapsed-days axis labels` (Part 2)
- `feat(ui): surface aggregate-by inheritance in comparison controls` (Part 2.2 display + infobox)
- `feat(distribution): extend temporal-grouped comparison to time-of-day & breakdown` (Part 1.2, only if MVP approved)

---

## Decisions Summary (locked)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Card component | **New dedicated `DistributionChartCard.svelte`** (avoid comparison-specific entanglement) |
| 2 | Elapsed label format | **Relative** (`Week N` / `Month N` / `Q N`) on axis; **natural** bucket label (`W34 (Aug 18)`, `Sep 2025`) in the tooltip |
| 3 | Strategy selector scope | `dayOfWeek` + `bar` only (MVP); Time-of-Day / Breakdown gated on post-MVP approval |
| 4 | Heatmap | Leave matrix as-is; if heatmap selected while Strategy is toggled → ephemeral infobox `Heatmap is incompatible with variable Comparison Strategies` |
| 5 | Palette | Reuse `DEFAULT_SERIES_PALETTE` (consistent with 7b.2) |
| 6 | `distributionStrategy` default | `'period'` (backward-compatible) |
| 7 | Elapsed granularity source | **Option A — `engine.timelineConfig.granularity`** (explicit inheritance). Add a **read-only `Aggregate By` display + infobox** (`Modify Aggregate By via Timeline Controls`) in Comparison Controls to surface the hidden coupling |

---

## Open Questions / Decisions (await feedback)

1. ~~**Card component:** reuse `ComparisonChartCard.svelte`... or a dedicated `DistributionChartCard.svelte`?~~ → **Decided:** dedicated `DistributionChartCard.svelte`.

2. ~~**Elapsed label format:** relative vs natural?~~ → **Decided:** relative on axis, natural in tooltip.

3. ~~**Strategy selector scope:**~~ → **Confirmed:** `dayOfWeek` + `bar` only (MVP); extension gated.

4. ~~**Heatmap:**~~ → **Confirmed:** leave as-is + ephemeral infobox when Strategy toggled with heatmap selected (`Heatmap is incompatible with variable Comparison Strategies`).

5. ~~**Palette:**~~ → **Confirmed:** reuse `DEFAULT_SERIES_PALETTE`.

6. ~~**`distributionStrategy` default:**~~ → **Confirmed:** `'period'`.

7. **Elapsed fix granularity source — DECIDED (Option A):** derive from `engine.timelineConfig.granularity` (the active `Aggregate By`), matching how the comparison series are already bucketed. Add a read-only **`Aggregate By` display + infobox** (`Modify Aggregate By via Timeline Controls`) to Comparison Controls so the inherited setting is visible to the user.