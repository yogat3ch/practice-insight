---
name: practice-insight
description: Use when working in the Practice Insight repo (SvelteKit + Svelte 5 runes + TypeScript + Apache ECharts meditation-data dashboard). Covers engine/compiler architecture, control-panel & view conventions, verification workflow, and when to make git commits. Prevents Svelte 4→5 syntax mistakes, ECharts tree-shaking/registration pitfalls, and commit-atomicity errors.
metadata:
  version: '1.0.0'
---

# Practice Insight — Repo Skill

## What This App Is

Client-side SPA (SvelteKit + `@sveltejs/adapter-static`, `ssr=false`, `prerender=true`) that ingests Insight Timer meditation CSV data and renders three analytical tabs:

- **Timeline** (Tab 1): time-series with moving average + statistical overlays (μ, ±1σ, trendline), time-split segments.
- **Comparison** (Tab 2): multi-period overlay / side-by-side grid, Y-axis lock, calendar vs. elapsed-day X alignment.
- **Distribution** (Tab 3): Day-of-Week, Time-of-Day, Activity/Preset breakdown with metric/temporal-grouping/threshold controls.

All parsing/analytics run client-side (privacy-first). Sample CSV auto-loads on mount via `fetchAndParseSampleCSV()`.

## Non-Negotiable Conventions

### Svelte 5 runes ONLY

- Use `$state`, `$derived`, `$derived.by`, `$props`, `$bindable`, `$effect`.
- **No legacy `$:` or plain `let` for reactive state** — triggers `non_reactive_update` warnings.
- `$derived` reassignment is allowed in Svelte 5.25+ but prefer `const` for read-only.
- `$state(defaultOpen)` capture warnings: intentional captures are fine but keep the tree at **0 warnings**. If a prop only seeds initial state, prefer `$state(() => defaultValue)` ONLY where valid; otherwise accept an intentional-capture comment.
- Children/slots: use `{@render children()}` and `{#snippet}` — not `<slot>`.

### TypeScript (Google style)

- Explicit return types on all public functions/methods (especially `PracticeDataEngine` setters — `void`).
- `strict` mode; no `any` (use `unknown` + narrowing); avoid non-null assertions (`!`).
- Prefer `interface` for object shapes, `type` for unions.
- `readonly` on immutable config/type fields.

### ECharts — tree-shaken imports + registration

- Charts are built via **declarative option compilers** in `src/lib/engine/compilers/*.ts` returning `EChartsOption`; rendered via `use:echartAction` (`setOption(option, true)` = `notMerge`, good for structural changes).
- **Any new chart/component type must be registered** in `src/lib/echarts/registry.ts` (`echarts.use([...])`). Missing registration → runtime `console.error` "component not exists" (tests pass silently over it — assert on render/console).
- Registered already: Line/Bar/Pie/Heatmap charts; Grid/Tooltip/DataZoom/Title/Legend/MarkLine/MarkArea/**Polar**/VisualMap; CanvasRenderer.
- Use per-icon subpath imports from `@lucide/svelte`: `import ChevronDown from '@lucide/svelte/icons/chevron-down'` (NOT root import).
- Container must have non-zero size before `echarts.init` (a chart in a hidden/unmounted tab renders blank).

### Architecture (learn from what exists)

- **`PracticeDataEngine.svelte.ts`** is a singleton `engine` exported from `$lib`. All view control state lives here in `$state` config objects (`timelineConfig`, `comparisonConfig`, `distributionConfig`) so it **persists across tab switches**.
- Derived getters compute filtered data → calculators → `compileXOption()` compilers.
- Calculators: `src/lib/engine/aggregators.ts` (bucketing, `convertValue`, `getPeriodForDate`), `statistics.ts`, `distribution.ts` (`metricValueOf`, per-period variants).
- `src/lib/index.ts` is the barrel — export new types/calculators/compilers there for `$lib` consumers.
- UI components: `ControlPanel.svelte` (global filters + CSV card, nest sections in `Accordion.svelte`), per-tab `*Controls.svelte` (Apply-button pattern), per-tab `*View.svelte` (ECharts + PNG/SVG export). `chartDiv` bindings use `$state` + guards.

### Style Guide

- `.agents/prompts/style_guide.md` — light theme. Tokens: bg `#FFFFFF`, sidebar `#F9FAFB`, text `#1C1C1C`/`#6E6E6E`, borders `#E5E5E5`, accent amber `#EAA845`, CTA emerald `#10B981`. Chart tooltips dark `#1F2937`.
- Chart compilers hardcode these hex colors (a centralized token module is a known improvement, not yet done).

### Seasonal & temporal rules (§3.3)

- Sessions attributed 100% to **Started At** timestamp.
- Weeks start **Monday** (`weekStartsOn: 1`).
- Seasonal years run **Dec 22 → Dec 21**, labeled by end year ("2025 Seasonal Year").
- Fixed solar seasons: Winter Dec 22–Mar 19, Spring Mar 20–Jun 20, Summer Jun 21–Sep 21, Autumn Sep 22–Dec 21. `getSeasonRange()` returns these bounds; `getPeriodForDate(date,'season')` uses them for distribution grouping (NOT the full seasonal-year cycle).

## Verification Workflow (always before finishing)

1. **`npm run check`** → `svelte-check` must be **0 errors AND 0 warnings**.
2. **`npm test`** → `vitest run`, all suites pass. Tests live beside code in `__tests__/` (e.g. `src/lib/engine/compilers/__tests__/distribution-compiler.test.ts`).
3. **`npm run build`** → static output succeeds.
4. **Formatting**: format changed **TS files** with `npx prettier --write <files>`. ⚠️ Repo-wide `npm run lint`/prettier **crashes on `.svelte` files** (`getVisitorKeys is not a function`) — pre-existing plugin incompatibility; don't try to fix it.

## When to Make Commits (workflow guidance)

Follow the user's preference; if they ask for interactive commit-by-commit (as done in Phase 5c delivery), use this pattern:

1. **Chunk logically, not chronologically.** Group by feature/concern: engine+compilers first, then per-tab UI, then polish. Each commit must be **internally coherent** (the staged set compiles/tests together).
2. **Whole-file commits preferred.** When one file contains multiple logical changes (e.g. `ControlPanel.svelte` holding date-picker + accordions + a render branch), prefer combining them into one file-scoped commit rather than surgically splitting with `git add -p` / temp-file swaps — surgical splits are error-prone (shell escaping in heredocs, partial-file staging).
3. **Suggested ordering** (used successfully):
   - Engine/types/calculators/compilers (backend, testable in isolation)
   - Feature UI + its tests
   - Control-panel / shared UI
   - Layout / shell changes (e.g. collapsible sidebar)
4. **Commit messages**: conventional commits, imperative mood, summary in subject — e.g. `feat(engine): ...`, `feat(distribution): ...`, `feat(ui): ...`, `fix(controls): ...`.
5. **Confirm before committing**: stage files, show `git status --short` + `git diff --cached --stat`, present the proposed message, and commit only after user confirms. Verify a clean `git status` after each commit.
6. **Never modify file contents during commit staging** — stage/commit only. If a file's final version differs from what you need to commit, resolve it before staging, not during.

## Key Reference Files

- App spec: `.agents/prompts/Practice Insight App Specification.md`
- Style guide: `.agents/prompts/style_guide.md`
- Phase plans/summaries: `.agents/prompts/Phase5_Plan.md`, `.agents/walkthroughs/phaseX_summary.md` (X = 1..5c)
- Engine: `src/lib/engine/PracticeDataEngine.svelte.ts`; types: `src/lib/types/engine.ts`
- Compilers: `src/lib/engine/compilers/{timeline,comparison,distribution}-compiler.ts`
- ECharts registry: `src/lib/echarts/registry.ts`; binding: `src/lib/echarts/echartAction.ts`
