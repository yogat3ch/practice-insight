# **Practice Insight App Specification**

## **1\. Executive Summary**

The Practice Insight app is a performance-oriented, client-side web application designed to ingest and visualize meditation practice data exported from Insight Timer via CSV. The application provides users with actionable insights into their meditation habits by rendering interactive, highly customizable time-series visualizations, period-over-period comparisons, and behavioral distribution heatmaps.

The primary scope includes parsing session timestamps (Started At), session durations (Duration), practice presets (Preset), and practice types (Activity) to compute durations, counts, and trends across various temporal scales. The app is built with **SvelteKit** (Svelte 5\) and **TypeScript**, leveraging client-side execution for privacy, zero server latency, and rapid interactivity.

## **2\. Tech Stack, Engineering Standards & Third-Party Packages**

### **2.1 Core Stack & Target Architecture**

* **Framework:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5\) configured for Single-Page Application (SPA) static output (@sveltejs/adapter-static or @sveltejs/adapter-vercel).  
* **Language:** TypeScript for strict typing across data transformations, schema definitions, and state logic.  
* **Visualization Engine:** [Apache ECharts](https://echarts.apache.org/) integrated via custom Svelte lifecycle actions (use:echartAction).  
* **CSV Processing:** [PapaParse](https://www.papaparse.com/) executing within a dedicated Web Worker to maintain UI responsiveness during large file parsing.  
* **Styling & UI Components:** Tailwind CSS with clsx / tailwind-merge for dynamic CSS class management and Lucide icons (lucide-svelte).  
* **Deployment Target:** [Vercel](https://vercel.com/) CDN / Edge network with zero server overhead.

### **2.2 Engineering & Style Standards**

To maintain a clean, maintainable, and high-performance codebase:

* **Coding Standards:** Follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) and [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html).  
  * Explicit variable types (avoid implicit any).  
  * PascalCase for classes, types, and Svelte components.  
  * camelCase for variables, functions, methods, and module references.  
  * UPPER\_SNAKE\_CASE for global constants.  
  * Explicit return types on public methods in PracticeDataEngine.  
* **Svelte 5 Paradigm:** Leverage modern Svelte 5 Runes ($state, $derived, $props, $effect) rather than legacy Svelte 4 store patterns.  
* **Code Formatting & Linting:** Enforce formatting with Prettier, ESLint (@typescript-eslint), and standard Tailwind class ordering.

### **2.3 Recommended Off-the-Shelf Packages**

To maintain code concision and eliminate custom math/date parsing boilerplate:

| Package | Purpose | Architectural Advantage |
| :---- | :---- | :---- |
| **date-fns** | Date parsing & arithmetic | Lightweight and modular. Handles M/d/yyyy h:mm:ss a parsing, differenceInSeconds, and calendar unit starts (startOfWeek with Monday start, startOfMonth, etc.). |
| **simple-statistics** | Statistical transformations | Mean (![][image1]), standard deviation (![][image2]), median, quantiles, and moving averages out-of-the-box. |
| **echarts-stat** | ECharts statistical plugin | Computes linear regressions, polynomial trendlines, and dynamic histograms directly inside ECharts option payloads. |
| **d3-array** | Tabular data manipulation | High-performance array operations (group, rollup, bin, extent) tailored for multi-dimensional aggregations. |
| **papaparse** | CSV parsing | Robust Web Worker streaming with header mapping and dynamic type conversion. |
| **lucide-svelte** | System iconography | Tree-shakeable SVG icons for UI controls and badges. |
| **clsx** / **tailwind-merge** | Class merging | Prevents string concatenation bugs in interactive Tailwind components. |

## **3\. System Architecture & Data Handling Rules**

 ┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐  
 │   CSV Export    │ \----\> │ PapaParse Web Worker │ \----\> │ PracticeDataEngine     │  
 │ (Insight Timer) │       │ (Non-destructive)    │       │ (Svelte 5 Reactive)    │  
 └─────────────────┘       └──────────────────────┘       └────────────────────────┘  
                                                                       │  
                                                                       ▼  
 ┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐  
 │  ECharts Canvas │ \<---- │ Custom Svelte Action │ \<---- │ Formatted Chart JSON   │  
 │   (DOM Output)  │       │   (\`use:echartAction\`)│       │ Payload & Statistics   │  
 └─────────────────┘       └──────────────────────┘       └────────────────────────┘

### **3.1 Data Ingestion Pipeline & Hygiene Rules**

* **CSV Schema Mapping:**  
  * Started At: Local datetime parsed via M/d/yyyy h:mm:ss tt.  
  * Duration: Parsed into total seconds from h:mm:ss or mm:ss formats.  
  * Preset: Saved practice preset name. Empty or missing entries are normalized to "(No Preset)".  
  * Activity: Practice category string.  
* **Malformed Row Handling:** Rows with unparseable timestamps or non-numeric durations are skipped by the worker thread. The worker returns a skippedCount parameter to render in the UI badge (e.g., 1,428 parsed (2 invalid skipped)).  
* **Privacy-First Execution:** All parsing and transformations occur strictly in-memory within the client's browser session. No session data is transmitted to external servers.

### **3.2 Dynamic Filter Extraction**

To maintain forward-compatibility with Insight Timer updates and user-customized activities or presets:

* **Activity Filters:** Dynamically constructed at runtime by inspecting unique strings in the parsed Activity column (e.g., *Meditation*, *Yoga*, *Tai Chi*, *Walking*, *Breathing*, *Chanting*, *Prayer*, *Healing*, *Massage*, *Manifesting*, *Nap*).  
* **Preset Filters:** Dynamically populated from non-empty string entries in the Preset column.

### **3.3 Temporal Attribution & Seasonal Rules**

* **Session Start Timestamp Dominance:** Sessions spanning across midnight or across seasonal/hourly boundaries are attributed **100% to their Started At timestamp**. A 45-minute practice starting at 11:45 PM on Dec 21 is assigned entirely to Dec 21 and the 23:00 hour bin.  
* **Week Boundary Standard:** Standard calendar weeks start on **Monday** (weekStartsOn: 1 in date-fns).  
* **Seasonal Year Boundary & Naming:** Each full seasonal year runs from **December 22nd to December 21st**, centering the Winter Solstice as the start and end of each complete cycle. A seasonal year spanning Dec 22, 2024 to Dec 21, 2025 is officially labeled by its ending calendar year: **"2025 Seasonal Year"**.  
* **Fixed Solar Milestones (for uniform charting):**  
  * **Winter:** December 22 – March 19  
  * **Spring:** March 20 – June 20 *(Spring Equinox: March 20\)*  
  * **Summer:** June 21 – September 21 *(Summer Solstice: June 21\)*  
  * **Autumn:** September 22 – December 21 *(Autumnal Equinox: September 22\)*

### **3.4 Computational Engine Architecture (PracticeDataEngine)**

The core computational engine is encapsulated within a framework-agnostic TypeScript class (PracticeDataEngine) bound to Svelte 5 runes ($state / $derived):

1. **State Management:** Retains raw SessionEntry arrays, active multi-select filters, active view tab parameters, and time window bounds.  
2. **"Aggregate-then-Split" Pipeline:** Computes summary statistics across the dataset before splitting data into temporal units (Days, Weeks, Months, Quarters, Seasons, Years).  
3. **Statistical Calculation Scope:**  
   * **Context-Relative Overlays:** Mean (![][image1]), Standard Deviation (![][image2]), and Linear Trendlines in *Timeline Mode* are calculated relative to the **currently filtered date window and zoom state**, providing responsive local context.  
   * **Moving Average Boundary Padding:** Moving average calculations use symmetric sliding windows. At dataset boundaries, available trailing/leading points within the window are averaged without zero-padding.  
4. **Unit Switcher Logic:** When the global unit control is toggled to Sessions, every session record is evaluated as a numeric value of 1.0, calculating session counts and frequencies rather than durations.  
5. **ECharts JSON Compiler:** Transforms processed data streams into declarative JSON option payloads optimized for direct consumption by Apache ECharts.

## **4\. User Interface (GUI) & Layout Architecture**

### **4.1 Layout Structure**

The GUI decouples **Global Context** (CSV data, activity/preset filtering, global unit toggles) from **View-Specific Context** (Timeline aggregation vs. Comparison period constructor vs. Distribution heatmaps) using a tabbed viewport layout:

┌─────────────────────────────────────────────────────────────────────────┐  
│  HEADER / TOOLBAR: Logo, Preset Switcher, CSV Status, Export Button     │  
├───────────────────────────────┬─────────────────────────────────────────┤  
│  CONTROL PANEL (Left Drawer)  │  MAIN VISUALIZATION CANVAS (Right Area) │  
│                               │                                         │  
│  \[ GLOBAL FILTERS CARD \]      │  ┌───────────────────────────────────┐  │  
│  \- CSV Upload & Status        │  │ \[Tab Bar: Timeline|Compare|Dist\] │  │  
│  \- Activity & Preset Filters  │  ├───────────────────────────────────┤  │  
│  \- Unit Toggle (Min/Hr/Sess)  │  │                                   │  │  
│  \- Seasonal Time Rule Note    │  │       ACTIVE CHART CANVAS         │  │  
│                               │  │        (ECharts Viewport)         │  │  
│  \[ TAB-SPECIFIC CONTROLS \]    │  │                                   │  │  
│  (Swaps content based on      │  │                                   │  │  
│   the active main tab)        │  │                                   │  │  
│                               │  └───────────────────────────────────┘  │  
│  \[ MINIMIZE CONTROL PANEL ◀ \] │                                         │  
└───────────────────────────────┴─────────────────────────────────────────┘

### **4.2 Persistent Global Controls**

Located at the top of the left drawer panel, persistent across all views:

1. **CSV Ingestion Card:** Drag-and-drop zone with instant row count badge (e.g., 1,428 sessions parsed).  
2. **Activity Filter:** Multi-select chips dynamically populated from CSV Activity values.  
3. **Preset Filter:** Searchable multi-select dropdown dynamically generated from CSV Preset names.  
4. **Unit Switcher:** Segmented toggle (Minutes | Hours | Sessions). Switching units updates active charts reactively without resetting time bounds.

## **5\. View Modes & Analytical Interfaces**

### **5.1 Tab 1: Timeline Mode (Primary Default View)**

* **Objective:** Continuous time-series trend analysis over a connected date range.  
* **Control Panel Inputs:**  
  * **Time Window Selector:** Presets (3M, 6M, 1Y, YTD, All) \+ Custom Date Range Pickers.  
  * **Time Aggregation:** Granularity dropdown (Day, Week, Month, Quarter, Season, Year).  
  * **Time Split:** Split-by dropdown (Week, Month, Quarter, Season, Year), generating discrete chart cards per time segment when active.  
  * **Smoothing Controls:** Dynamic slider for Moving Average window size or Spline Degree (0 to 30 days).  
  * **Statistical Overlays:** Checkboxes for Mean Line (μ), ±1 Standard Deviation (σ), and Linear Trendline.  
* **Canvas Output:** Full-width dynamic time-series line or bar chart with interactive ECharts dataZoom brush controls.

### **5.2 Tab 2: Comparison Mode**

* **Objective:** Multi-period cross-analysis (e.g., Year-over-Year Q1 performance, Season-over-Season volume).  
* **Control Panel Inputs:**  
  * **Comparison Strategy:**  
    * *Period-over-Period (Relative Alignment):* Align multiple distinct time blocks starting at Day 1 to compare habit momentum.  
    * *Sequential Side-by-Side:* Grid of distinct time cards with locked Y-axes.  
  * **Series Constructor:**  
    * *Primary Period (Baseline):* Date range, seasonal year, or year selector (e.g., 2025).  
    * *Comparison Target(s):* Dynamic series list with an **"+ Add Period"** button (Previous Year, Custom Range, etc.) and assigned color pickers.  
  * **Y-Axis Range Locking Toggle (Default: Enabled):** Forces uniform ![][image3] and ![][image4] scale bounds across all active comparison series to prevent visual volume distortion.  
  * **X-Axis Alignment Rule:** Toggle between Calendar Date Alignment (Jan 1 – Dec 31 / Dec 22 – Dec 21\) and Elapsed Days Alignment (Day 1 – Day 365).  
* **Canvas Output:**  
  * *Superimposed Mode:* Multi-line overlay series with integrated legend and differential tooltips (e.g., 2025: 45m | 2024: 30m | Diff: \+15m (+50%)).  
  * *Grid Mode:* Synchronized small-multiple chart cards.

### **5.3 Tab 3: Distribution & Breakdown Mode**

* **Objective:** Behavioral pattern recognition, time-of-day habits, and activity breakdown.  
* **Control Panel Inputs:**  
  * **Category Selector (Dropdown):**  
    1. *Day-of-Week Distribution*  
    2. *Time-of-Day Practice Windows*  
    3. *Activity & Preset Breakdown*  
  * **Chart Style Toggle (Segmented Radio Control):**  
    * *Day-of-Week:* Heatmap Matrix | Bar Chart  
    * *Time-of-Day:* Polar Clock (24h) | Hourly Histogram  
    * *Activity & Preset Breakdown:* Donut Chart | Stacked Bar  
  * **Temporal Grouping:** Dropdown (By Week of the Year, By Month, By Quarter, By Season, By Year).  
  * **Metric Calculation:** Toggle between Total Practice Duration, Number of Sessions, and Average Session Length.  
  * **Threshold Filter:** Numeric input field to exclude short accidental logs (e.g., *Ignore sessions \< 2 minutes*).  
* **Canvas Output Mapping:**  
  1. **Day-of-Week Distribution:**  
     * *Heatmap Matrix:* 7-column grid (Mon–Sun) across temporal periods (weeks, months, seasons) shaded by volume intensity.  
     * *Bar Chart:* 7-bar chart comparing total or average volume per day of the week.  
  2. **Time-of-Day Practice Windows:**  
     * *Polar Clock (24h):* Radial 24-hour clock displaying start-time density around the clock face.  
     * *Hourly Histogram:* 24-bin bar chart rendering practice volume by hour of the day (00:00 to 23:00).  
  3. **Activity & Preset Breakdown:**  
     * *Donut Chart:* Proportional ring graph showing percentage share across activities or presets.  
     * *Stacked Bar:* Time-segmented bar chart illustrating activity/preset mix shifts over time.

## **6\. Visualization & Analytics Engine (ECharts)**

### **6.1 Lifecycle & Directive Architecture**

Charts are bound to Svelte containers using a custom Svelte directive (use:echartAction):

* **Reactivity:** Updates chart instances using chart.setOption(options, true) (notMerge: true) to cleanly update series data during tab or filter changes.  
* **Auto-Resize:** Attached to a ResizeObserver on the parent container to handle drawer collapses and window resizes smoothly.  
* **Disposal:** Automatically invokes chart.dispose() when components unmount to prevent canvas memory leaks.

### **6.2 Axis Consistency & Legibility**

* **Y-Axis Synchronization:** Adjacent or comparison graphs automatically compute and lock to identical Y-axis max bounds (![][image4]).  
* **X-Axis Formatting:** Dynamic label heuristics apply 45° label tilting and font size adjustments to prevent text overlap across dense datasets.  
* **Interactivity:**  
  * ECharts dataZoom slider enabled for granular time zooming with a one-click reset.  
  * Custom HTML tooltips formatted with human-readable units (e.g., 1h 15m / day).  
  * One-click high-resolution PNG/SVG chart export.

## **7\. Implementation Roadmap**

 ┌──────────────────────────────────────────────────────────────────────────────┐  
 │ PHASE 1: Project Setup & Linting (SvelteKit \+ Google TypeScript Style Guide) │  
 └──────────────────────────────────────┬───────────────────────────────────────┘  
                                        │  
                                        ▼  
 ┌──────────────────────────────────────────────────────────────────────────────┐  
 │ PHASE 2: Ingestion & Web Worker Pipeline (PapaParse Worker \+ Data Hygiene)   │  
 └──────────────────────────────────────┬───────────────────────────────────────┘  
                                        │  
                                        ▼  
 ┌──────────────────────────────────────────────────────────────────────────────┐  
 │ PHASE 3: Computational Engine (\`PracticeDataEngine\` \+ Svelte 5 Runes)        │  
 └──────────────────────────────────────┬───────────────────────────────────────┘  
                                        │  
                                        ▼  
 ┌──────────────────────────────────────────────────────────────────────────────┐  
 │ PHASE 4: ECharts Action Binding & UI Viewport Integration (\`use:echartAction\`) │  
 └──────────────────────────────────────────────────────────────────────────────┘

## **8\. Deployment & Build Pipeline**

* **Framework Adapter:** Uses @sveltejs/adapter-static or @sveltejs/adapter-vercel configured for static Single-Page Application (SPA) generation.  
* **Edge CDN Hosting:** Built static assets are served directly from Vercel's Global Edge Network.  
* **Zero Backend Costs:** Because all CSV parsing, statistical modeling, and ECharts rendering run entirely on the browser client, hosting overhead remains zero regardless of user volume.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAbCAYAAABIpm7EAAAAvElEQVR4XmNgGAVDH8jLy/8H4hw0sYtycnIbkMXAQF1dnRekQUVFhQ9ZHCSmoKBQgCwGk+gFSSKLKSsri0HFmJHFwQAo8ReEkcWATpmObggcQN1/Fk3sBl4NQLcGoIsB8RFkMZhEEEjS2NiYFU0cpMELyl6LLHEZKpmNJAbyE8g5TEC6V0ZGhhNZw3+gBx9BNYHwE5A4UGwHiA906iq4YiQNPiiCuADIo1CriQNAxadJ1XAd6JwydPFRgAQA32w7TyzDdvAAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAbCAYAAABIpm7EAAAAlUlEQVR4XmNgGAVDHygoKETIy8v/BeL/6Bgol4iiGCj4Giq5WE5ObgGU/RrILgfSRSiKYQqQxYD8ZnQxMDA2NmYFScjKyuogiwOd0IhVA1DQC5sE0NYV2MRBEjuwSUD98AFdHCSxDF2DlJSUCEhMRUWFD1kcDKSlpYXRNDBBTY9GEkMFQGfZQBWB8E0gXxBdzSgY4gAAAeYyoigYX3IAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAaCAYAAAAwspV7AAABi0lEQVR4Xu1Vyy4EURAdYW3Bsh+3XztWwhJ/4QNs/YJPICIT8UgIFhaW+AA7Kysi8Q0e8zAmMwhO6XulUtMkpmd6LO5JTm5VnZqqyn30lEoWFj2GUuoIbIEfjLcibUjoDaH3B2h0rhsuS43g+/4WtFMZ7ytc1x0zOyG1MAznEL+U8UKQNZQe9onHCgWaH9JQQRCss1jHzhWNEb5bWN+xDIuc4mGGAitxHHtSHwjwytZoKKwLUvsLUGMRrMp4V0Chu17cI8/zJlFnVca7Ar9T/wVfX268vhMpEMzAONoJ5BzDfnMcZxzrBXgG3shcsvWHl/wl8Bq8Qmz/u/BvQPIK/RgN56VmYIqTjSOaNY2NliTJKPeZvafS19yhZQJDHCCpDj6CD2BN/fD/xothqBn4r1zjL1YMtUM7lqXlhmg0Bba4FkWRz31jY6BN+OUsLTfETk3Df+Ea/icV95m9S4NlabmAQs/gPVjVR1dR6XE3wba2KRaq9AqQ38b12Fbp1SBugA1dpyZ7WFhYDBKfpXCVh8wiPG4AAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAaCAYAAADFTB7LAAABt0lEQVR4Xu1Wu0oDURA1KJYWWia7N9lNtXaiWKk/YG3rBwh+gYitIIpgITaihYWg4APETisrW8FGEUuN8RWJD6JnzAyMo6mM2SB74HBnZ86de/bu3WxaWhIkiBnOuTWwDL4rnhpZytQfTf3vgUUPePEJWyP4vr+I2o7NNwyZTKZTdsjWcrncIPLHNt9w/GSQjT/oXGyAkVUymM1m51Xu247GiTa9ixgrGFqNJl6IQbAYhqFn67EDb+scGcQ4YmtNAZi7arZz9wX6DDYjPr8YeIu3bYEg5vH4u6FZR/yWTqe7MB6Bu+CJaD3PG4BmC5xGvmB7yCZIjN9aJ5qagHCGxGg6ZGsCbjhGMZmQhaSWz+c7KEaPKdzIJMUYx8FD0aHWD22Ja/uSrwlMWMGEe/AGLIB3rsb3VhuCwT5cv+qafvOxeITcJvc9kzxr9/TcusHsWA9Y1rUgCHyOL8ENimF0GPG56Di3bG+oLtAGsYO9uH7RNTlLrEtxvABeOP6XRPPoMUdR1K77/RpoVgKvwVt+vEVXPRJP4DPHlMvx+ayQMexWQBqYGnXV40O6JWhC1WPWrpcgQYL/gA/Zup3xBDJy2AAAAABJRU5ErkJggg==>