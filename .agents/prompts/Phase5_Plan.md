# Plan: Phase 5 — Tab-Specific Controls, CSV Ingestion & Remaining Spec Features

## TL;DR

Complete the remaining App Specification features in three prioritized tiers:

1. **Priority 1 (CSV Ingestion + Timeline Controls):** Build drag-drop CSV ingestion card with row count badge, wire Timeline-specific controls (time window presets, time split/segmentation, moving average slider, statistical overlay toggles).
2. **Priority 2 (Comparison & Distribution Controls):** Implement Comparison period constructor (Add Period, color pickers, Y-axis lock, X-axis alignment), then Distribution category selector and chart style toggles.
3. **Priority 3 (Polish):** Preset filter listbox conversion, threshold filter, metric toggle, seasonal time rule note.

---

## Steps

### Phase 5a: CSV Ingestion Card & Timeline Controls (Priority 1)

**1.1 — CSVIngestionCard Component** `(new: src/lib/components/CSVIngestionCard.svelte)`

- Drag-drop zone with visual indicator + file input fallback
- Reuse existing `parseCSV()` and `fetchAndParseSampleCSV()` from `$lib/parse-csv.ts`
- On drop/select: parse via worker → update `engine.setSessions()` + auto-populate Activities/Presets
- Display badge: **`✓ 1,428 parsed (2 invalid, skipped)`** using `parsedCount` and `skippedCount` from `WorkerResult`
- Include "Load Sample" button for demo data
- _Depends on:_ existing engine setter API ✓

**1.2 — TimelineControls Component** `(new: src/lib/components/TimelineControls.svelte)`

- **Time Window Selector:** Presets (3M, 6M, 1Y, YTD, All) + Custom date range picker → `engine.setDateRange(from, to)`
- **Time Aggregation:** Move "Aggregate By" dropdown from global → here (per spec §5.1)
- **Time Split:** Dropdown (Week, Month, Quarter, Season, Year, None) → `engine.timelineConfig.splitBy`
- **Chart Grid Toggle:** Checkbox (default OFF) → Multi-series overlay (default) or card grid layout → `engine.timelineConfig.useChartGrid`
- **Smoothing Slider:** 0–30 days → `engine.setMovingAverageDays(value)`
- **Statistical Overlays:** 3 checkboxes (Mean μ, ±1 Std Dev σ, Linear Trendline) → `engine.setStatisticalOverlays()`

**1.3 — Engine State** _(modify `src/lib/engine/PracticeDataEngine.svelte.ts`)_

- Add `$state timelineConfig.splitBy: SplitBy | null` (init from defaults)
- Add `setTimeSplit(splitBy)` setter
- Add `timelineOptionsBySegment` getter (returns array when split active, single option otherwise)
- Verify `setDateRange()`, `setMovingAverageDays()`, `setStatisticalOverlays()` are public _[check if already exist from Phase 3]_

**1.4 — Timeline Compiler Split Logic** _(modify `src/lib/engine/compilers/timeline-compiler.ts`)_

- When `splitBy !== null`: compute segment buckets, emit multi-series option (one series per segment with distinct colors)
- When `splitBy === null`: single option as before
- **Recommendation:** Use multi-series overlay (not card grid) — simpler, ECharts legend disambiguates

**1.5 — Apply Moving Average & Statistical Overlays** _(modify `src/lib/engine/compilers/timeline-compiler.ts`)_

- `movingAverageDays > 0` → add smooth `'line'` series from `computeSymmetricMovingAverage()` ✓
- `mean=true` → add `markLine` at average value
- `stdDev=true` → add `markArea` shaded region (μ−σ to μ+σ)
- `trendline=true` → add series from `computeLinearRegression()` ✓

**1.6 — TimelineView Update** _(modify `src/lib/components/TimelineView.svelte`)_

- Detect `engine.timelineOptionsBySegment` type: if array → render multi-chart grid with segment labels; else → single chart
- Maintain export PNG/SVG per chart

**1.7 — ControlPanel Restructuring** _(modify `src/lib/components/ControlPanel.svelte`)_

- Remove "Aggregate By" from global card
- Conditionally render tab-specific controls:
  - `tabId='timeline'` → show `TimelineControls`
  - `tabId='comparison'` → show `ComparisonControls` (new, Phase 5b)
  - `tabId='distribution'` → show `DistributionControls` (new, Phase 5c)
- Add `CSVIngestionCard` to global filters section

---

### Phase 5b: Comparison Controls & Period Constructor (Priority 2)

**2.1 — ComparisonControls Component** `(new: src/lib/components/ComparisonControls.svelte)`

- **Comparison Strategy:** Radio (Period-over-Period Relative | Sequential Side-by-Side) → `engine.comparisonConfig.strategy`
- **Y-Axis Lock:** Toggle (default ON) → `engine.comparisonConfig.lockYAxis`
- **X-Axis Alignment:** Radio (Calendar Date | Elapsed Days) → `engine.comparisonConfig.xAxisAlignment`
- **Series Constructor:** Primary period selector + dynamic comparison targets list
  - Each target: date range picker + color picker + delete button
  - **"+ Add Period"** button → `engine.addComparisonPeriod(from, to, color?)`

**2.2 — Engine State** _(verify/modify `src/lib/engine/PracticeDataEngine.svelte.ts`)_

- Confirm `comparisonConfig.strategy`, `lockYAxis`, `xAxisAlignment` exist in $state _(check Phase 3)_
- Add setters if missing: `setComparisonStrategy()`, `setLockYAxis()`, `setXAxisAlignment()`
- Verify `addComparisonPeriod()` is public and wired to compiler

**2.3 — Comparison Compiler Enhancements** _(modify `src/lib/engine/compilers/comparison-compiler.ts`)_

- **Y-Axis Lock:** Compute global Y-max across series, apply uniformly (likely already done ✓)
- **X-Axis Alignment:**
  - Calendar → show calendar dates (Jan 1 or Dec 22 start)
  - Elapsed Days → show Day 1, Day 2, …, Day 365
- **Strategy:** Overlay vs. side-by-side (recommend keeping overlay for now; can extend)

**2.4 — ComparisonView Update** _(modify `src/lib/components/ComparisonView.svelte`)_

- If `strategy='side-by-side'` → render grid; else → single overlay chart

---

### Phase 5c: Distribution Controls & Category Selector (Priority 2)

**3.1 — DistributionControls Component** `(new: src/lib/components/DistributionControls.svelte)`

- **Category Selector:** Dropdown → `Day-of-Week`, `Time-of-Day`, `Activity & Preset Breakdown`
- **Chart Style:** Context-dependent radio:
  - Day-of-Week: Heatmap Matrix | Bar Chart
  - Time-of-Day: Polar Clock (24h) | Hourly Histogram
  - Activity/Preset: Donut | Stacked Bar
- **Temporal Grouping:** Dropdown → By Week/Month/Quarter/Season/Year
- **Metric Toggle:** Radio → Total Duration | Session Count | Average Session Length
- **Threshold Filter:** Numeric input → "Ignore sessions < X minutes"

**3.2 — Engine State** _(verify/modify `src/lib/engine/PracticeDataEngine.svelte.ts`)_

- Confirm `distributionConfig.category`, `chartStyle`, `temporalGrouping`, `metric` exist _(check Phase 3)_
- Add setters if missing; ensure `thresholdMinutes` is $state with setter

**3.3 — Distribution Compiler Enhancements** _(modify `src/lib/engine/compilers/distribution-compiler.ts`)_

- Wire `category` → correct calculator call
- Wire `chartStyle` → correct ECharts option shape (heatmap, polar, donut, stacked bar)
- Wire `metric` → parameter flows through `computeDayOfWeekDistribution()`, etc.
- Wire `thresholdMinutes` → filters bins in calculators

**3.4 — DistributionView Update** _(modify `src/lib/components/DistributionView.svelte`)_

- Detect category + chart style → render appropriate canvas

**3.5 - Tab State Preservation**

- Tab State & Control Preservation: Switching tabs preserves all control values (filters, time window, comparison periods, distribution settings, etc.) and previously rendered plots display as they were. Each tab maintains its own chart state independently. This enables seamless navigation and comparison across views without data loss.

- Chart Caching: Previously rendered charts remain in the DOM (or can be cached via Svelte store) to avoid re-compilation on tab re-entry, improving UX responsiveness.

---

### Phase 5d: Polish & Preset Filter (Priority 3)

**4.1 — Preset Filter Listbox** _(modify `src/lib/components/ControlPanel.svelte` or new `PresetFilter.svelte`)_

- Convert native `<select multiple>` to visible listbox (copy Activity filter pattern from Phase 4) with clickable options, removable pills, Select All / Deselect All

**4.2 — Seasonal Time Rule Note** _(modify `src/lib/components/ControlPanel.svelte`)_

- Add info text in Global Filters: _"Seasonal years run Dec 22 – Dec 21. Sessions attributed to Start Time."_
- Lucide `Info` icon (amber color)

**4.3 — Help Icons & Tooltips** _(create `src/lib/i18n/Tooltips.ts` and `src/lib/i18n/en.json`; modify `src/lib/components/ControlPanel.svelte`)_

- Create a `Tooltip` component that renders a superscript `circle-question-mark` icon next to each input's title
- Look up tooltip text in `en.json` using the input component's title as the key
- Make tooltips mobile-friendly. Use a popular library or suggest a library for this purpose and await input if `npm i` doesn't work.
- Add a helpful description entry to `en.json` for every input component
- Apply the tooltip to each input title

---

## Relevant Files

**New Components to Create:**

- `src/lib/components/CSVIngestionCard.svelte`
- `src/lib/components/TimelineControls.svelte`
- `src/lib/components/ComparisonControls.svelte`
- `src/lib/components/DistributionControls.svelte`

**New Test Files:**

- `src/lib/engine/compilers/timeline-compiler.test.ts` — split, moving avg, overlays
- `src/lib/engine/compilers/comparison-compiler.test.ts` — strategy, Y-axis lock, x-axis alignment
- `src/lib/engine/compilers/distribution-compiler.test.ts` — category, chart style, metric, threshold, zero-filled bins edge case

**Files to Modify:**

- `src/lib/engine/PracticeDataEngine.svelte.ts` — add state + setters for Tab controls
- `src/lib/engine/compilers/timeline-compiler.ts` — split, moving avg, statistical overlays
- `src/lib/engine/compilers/comparison-compiler.ts` — verify/enhance strategy & alignment
- `src/lib/engine/compilers/distribution-compiler.ts` — verify/enhance category & styles
- `src/lib/components/ControlPanel.svelte` — restructure for tab-specific controls + CSV card + Preset listbox
- `src/lib/components/TimelineView.svelte`, `ComparisonView.svelte`, `DistributionView.svelte` — detect & handle new option shapes
- `src/lib/utils/date-utils.ts` — _optional:_ add `computeTimeWindowDateRange(preset, sessions)` helper
- `src/lib/index.ts` — export new components

---

## Verification Strategy

**Type Safety:**

- `npm run check` → 0 errors/warnings
- All new setters: explicit return types (`void`)
- All components pass TypeScript checks

**Unit Tests (`npm test`):**

- Timeline compiler: single vs. split, moving avg, statistical overlays
- Comparison compiler: Y-axis lock, x-axis alignment, strategy
- Distribution compiler: category selection, metric/threshold flow
- All existing tests continue to pass (72 tests + new ones)

**Integration Testing (Manual dev server):**

- CSV card drag-drop + badge accuracy
- Timeline: time window presets, custom range, split rendering, moving avg appearance, overlay toggles
- Comparison: strategy toggle, Y-axis sync, x-axis label change, Add Period, color picker, delete
- Distribution: category & style swap, temporal grouping, metric calculation, threshold filtering
- Tab switching → control panels swap correctly
- Export PNG/SVG on all charts

**Build:**

- `npm run build` → static output succeeds
- No console errors/warnings
- Prerender check passes

---

## Key Decisions

1. **Time Split:** Multi-series overlay (not card grid) — simpler, ECharts legend disambiguates segments. Can extend to grid if spec clarification required.
2. **Comparison Strategy:** Keep overlay as default MVP. Side-by-side is an extension.
3. **Color Picker:** Use native HTML5 `<input type="color">` for simplicity.
4. **Time Window Presets:** Recommend helper `computeTimeWindowDateRange(preset, sessions)` in `date-utils.ts`.
5. **Preset Filter:** Phase 5c (not blocking earlier phases).

---

**Status:** This plan is comprehensive and ready for implementation. Phases 5a and 5b are highest priority; Phase 5c (Preset listbox + Polish) can follow. All dependencies are documented, test coverage is specified, and file structure is clear.
