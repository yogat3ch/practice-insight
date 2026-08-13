# Practice Insight — Usage Guide

Everything you need to know about loading your data and exploring your meditation practice with Practice Insight.

<!-- app-usage:start -->

## Getting started

Practice Insight is a fully client-side meditation analytics dashboard. It ingests your Insight Timer CSV export and turns it into interactive **Timeline**, **Comparison**, and **Distribution** views — all computed locally in your browser, so your data never leaves your machine.

When you open the app, a sample dataset (the author's own practice data) auto-loads so you can explore immediately. Swap in your own data whenever you're ready.

**Three tabs, three questions:**

- **Timeline** — "How has my practice changed over time?"
- **Comparison** — "How does this period stack up against that one?"
- **Distribution** — "What patterns shape my practice — by day, by time, by activity?"

## Load your data

1. **Get your export** — in Insight Timer, export your practice history as a CSV file.
2. **Upload it** — drag-and-drop the CSV onto the app (or click to browse). Parsing happens in a background worker, so the UI stays responsive even for large files.
3. **Check the count** — a badge shows how many sessions were parsed. Rows that couldn't be parsed are skipped and counted for you (e.g. "1,428 parsed, 2 invalid skipped").

### CSV schema

Insight Timer exports use these columns:

| Column       | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| `Started At` | Local session start time (`M/d/yyyy h:mm:ss`)        |
| `Duration`   | Session length (`h:mm:ss` or `mm:ss`)                |
| `Preset`     | The preset used (empty entries become "No Preset")   |
| `Activity`   | Practice category (e.g. Meditation, Yoga, Breathing) |

### Global filters

The control panel gives you persistent, app-wide controls:

- **Activity & Preset** — multi-select filters, dynamically built from the values in your data.
- **Unit toggle** — view everything in **Minutes**, **Hours**, or **Sessions**.
- **Time window** — quick presets (3M, 6M, 1Y, YTD, All Time) or a **custom date range**.

## Timeline

The Timeline tab shows your practice as a continuous time series.

- **Aggregate by** — choose the granularity: **Day, Week, Month, Quarter, Season, or Year**.
- **Time Split** — break the chart into separate cards per week/month/quarter/season/year to compare segments side by side.
- **Moving average** — smooth out daily noise with a sliding average window.
- **Statistical overlays** — toggle the **mean (μ)**, **±1 standard deviation**, and a **linear trendline** to see the bigger picture.
- **Zoom** — use the dataZoom brush at the bottom to focus on any time range.

> **Seasonal rule:** Seasonal years run **December 22 → December 21** and are labeled by their end year (e.g. "2025 Seasonal Year"). Weeks start on **Monday**.

## Comparison

The Comparison tab answers "how does this period compare to that one?".

- **Strategy** — choose **Period-over-Period** (align several ranges from Day 1) or **Sequential side-by-side** (a grid of cards).
- **Add periods** — set a baseline period, then add comparison targets (previous year, custom range, etc.). Each period gets its own color, which you can override.
- **Y-axis lock** — keep the scale identical across series so volumes aren't visually distorted.
- **X-axis alignment** — switch between **Calendar** dates and **Elapsed days** (Day 1, Day 2, …).
- **Differential tooltips** — hover to see the difference between series, e.g. `2025: 45m | 2024: 30m | Diff: +15m (+50%)`.
- **Export** — save any chart as a high-resolution **PNG** or **SVG**.

**Example:** "Compare this year's Q1 vs last year's" — add a period for this year's Q1, then one for last year's Q1, and overlay them.

## Distribution

The Distribution tab reveals behavioral patterns.

- **Day-of-Week** — a 7-column heatmap matrix (Mon–Sun) across weeks/months/seasons, or a simple bar chart. Great for finding your most consistent day.
- **Time-of-Day** — a 24-hour **polar clock** or an **hourly histogram**. Spot your morning practice vs your evening slump.
- **Activity & Preset breakdown** — a **donut** (proportional share) or **stacked bar** (mix over time).
- **Temporal grouping** — compare by week, month, quarter, season, or year.
- **Metric** — switch between **total duration**, **session count**, and **average session length**.
- **Threshold filter** — ignore sessions under a set length to exclude accidental quick logs.
- **Comparison strategy** — for grouped charts, overlay multiple periods or view them side by side.

**Example:** "Find my most consistent weekday" — open Day-of-Week, and the heatmap/bar shows exactly which day your practice habit is strongest.

## Privacy

Practice Insight is **privacy-first by design**:

- All parsing, statistics, and chart rendering run **entirely in your browser**.
- No data is uploaded, transmitted, or stored on any server.
- Close the tab and your data is gone.

Your meditation practice is personal — it stays on your device.

## FAQ / Troubleshooting

**My CSV won't load / shows skipped rows.**
Rows with unparseable timestamps or durations are skipped and counted. Check that your file follows the schema above (`Started At`, `Duration`, `Preset`, `Activity`) and that timestamps use `M/d/yyyy h:mm:ss`.

**The chart is blank.**
Make sure you have data loaded and that your filters (activity, preset, date range) aren't excluding everything. Try the **All Time** preset to reset the date window.

**Where does the sample data come from?**
It's the author's own practice data, bundled to auto-load for demonstration. You can replace it with your own CSV at any time.

**Do you store my data?**
No. Everything runs locally in your browser — see [Privacy](#privacy).

**How can I request a feature or report a bug?**
Open an issue on [GitHub](https://github.com/yogat3ch/practice-insight/issues) — there are templates for both.

<!-- app-usage:end -->

---

### Download a sample CSV

Want to see how the app behaves with realistic data before using your own? [Download the sample CSV](/sample.csv) — the same dataset that auto-loads on open.
