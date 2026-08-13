# Practice Insight — Meditation Data Analytics

**Turn your Insight Timer export into a private, interactive meditation dashboard.**

Practice Insight is a fully client-side web app that ingests your Insight Timer meditation data (a CSV export) and turns it into three powerful analytical views — **Timeline**, **Comparison**, and **Distribution**. Everything runs locally in your browser: your practice data never leaves your machine.

> 📚 Looking for detailed instructions? See the full [Usage Guide](docs/usage.md).

---

## 🚀 Getting Started

1. **Open the app** — the page loads with a sample dataset (the author's own practice data) so you can explore immediately.
2. **Drop in your CSV** — drag-and-drop your Insight Timer export (or click to browse). Rows that can't be parsed are skipped and counted for you.
3. **Start exploring** — filter, slice, and compare your practice to find real insights:

   - **"Find my most consistent weekday"** — head to the _Distribution_ tab, pick Day-of-Week, and spot where your practice habit is strongest.
   - **"Compare this year's Q1 vs last year's"** — use the _Comparison_ tab to overlay two periods and see the difference, minute by minute.
   - **"Spot my evening slump"** — use the _Time-of-Day_ polar clock in _Distribution_ to see when your practice dips.

Need the full walkthrough? The [Usage Guide](docs/usage.md) covers everything step by step.

---

## 📊 Comprehensive Overview

### Global Filters

- **Activity & Preset multi-select** — filter your practice by activity (Meditation, Yoga, …) and by preset, dynamically built from your data.
- **Unit toggle** — switch between **Minutes**, **Hours**, and **Sessions** on the fly.
- **Time Window presets** — 3M, 6M, 1Y, YTD, All, plus a **custom Date Range** picker.

### 📈 Timeline

- Aggregation from **Day → Year** (Day, Week, Month, Quarter, Season, Year).
- **Time Split** — break the chart into discrete cards per week/month/quarter/season/year.
- **Moving Average** slider and statistical overlays — **μ (mean)**, **±1σ (std dev)**, and **trendline**.
- Interactive **dataZoom** brush for granular time zooming.

### 🔁 Comparison

- **Period-over-Period** overlay (aligned from Day 1) and **Sequential side-by-side** grid.
- **Y-axis lock** so series are never visually distorted.
- **Calendar** vs **Elapsed-days** X-axis alignment.
- **Auto color palette** per added period (fully overridable).
- **Differential tooltips** — e.g. `2025: 45m | 2024: 30m | Diff: +15m (+50%)`.
- One-click **PNG / SVG** chart export.

### 🎯 Distribution

- **Day-of-Week** — heatmap matrix or bar chart.
- **Time-of-Day** — 24-hour polar clock or hourly histogram.
- **Activity & Preset breakdown** — donut or stacked bar.
- **Temporal Grouping** (by week/month/quarter/season/year), **comparison strategy**, **threshold filter** (ignore sessions under a set length), and **label toggles**.

### 🔒 Privacy-first

All parsing, statistics, and charting run **entirely in your browser**. Nothing is uploaded — your data stays yours.

### 📋 CSV Schema

Insight Timer exports use the columns `Started At`, `Duration`, `Preset`, `Activity`. Timestamps use `M/d/yyyy h:mm:ss` format; durations are `h:mm:ss` or `mm:ss`.

### 📅 Seasonal Rules

- Seasonal years run **December 22 → December 21**, labeled by end year (e.g. "2025 Seasonal Year").
- **Weeks start Monday.**

### 🖼️ Chart Export

Every chart supports one-click high-resolution **PNG** and **SVG** export.

---

## 💬 Feedback & Feature Requests

Found a bug or have an idea? Open an issue — bug reports and feature requests both have templates to make it easy:

- [Bug Report](https://github.com/yogat3ch/practice-insight/issues/new?template=bug_report.yml)
- [Feature Request](https://github.com/yogat3ch/practice-insight/issues/new?template=feature_request.yml)

Or browse [all open issues](https://github.com/yogat3ch/practice-insight/issues).

---

## 🤝 Contributing

Contributions are welcome! Here's the flow:

1. **Open an issue first** to discuss the change you'd like to make.
2. **Fork** the repo and create a branch.
3. Make your changes, then verify locally:
   - `npm install`
   - `npm run check` — `svelte-check` (0 errors)
   - `npm test` — Vitest suite
   - `npm run build` — production build
   - `npx prettier --write .` — formatting
4. **Open a pull request.** CI runs `check` → `test` → `build` on every PR, so make sure it's green.

User-facing instructions live in the [`docs/`](docs/) folder — that's the single source of truth for the in-app Usage tab.

---

## ✍️ Attribution

Built with **GitHub Copilot (DeepSeek V4 Flash)**.

© 2026 **Stephen Holsenbeck** — **Buy From Friends LLC dba The Mindful Life**. All rights reserved.

Interested in using or building on Practice Insight? See the [LICENSE](LICENSE.md) — and please reach out, we'd love to talk.

---

## 🛠 Built With

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Apache ECharts](https://echarts.apache.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [PapaParse](https://www.papaparse.com/)
- [date-fns](https://date-fns.org/)
