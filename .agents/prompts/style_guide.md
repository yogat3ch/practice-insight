# Project Style Guide – Practice Insight Dashboard

## 1. Design Philosophy & Aesthetic

- **Vibe:** Calm, modern, and focused on data clarity. The UI should feel spacious, with generous white space and minimal distractions, encouraging users to explore their meditation data.
- **Core Principles:**
  - **Readability first:** Text and chart elements must have high contrast against the background.
  - **Consistent branding:** Use a cohesive color palette and typography throughout the dashboard.
  - **Responsive & accessible:** All components should adapt gracefully to mobile, tablet, and desktop viewports and meet WCAG AA contrast standards.

## 2. Theme & Color Palette

We follow a **light‑mode** base (as per the Insight Timer UI) with occasional dark‑mode components for chart backgrounds.

### 2.1 Base Colors

| Role                          | HEX                    | Usage                                                                                     |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| **Primary Background**        | `#FFFFFF`              | Page, containers, cards                                                                   |
| **Secondary Background**      | `#F9FAFB`              | Sidebar, control panel background                                                         |
| **Card Overlay / Dark Areas** | `#121212` – `#1A1A1A`  | Dark chart backgrounds (when using dark theme)                                            |
| **Divider / Border**          | `#E5E5E5`              | Section dividers, input borders                                                           |
| **Primary Text**              | `#1C1C1C`              | Headings, body copy                                                                       |
| **Secondary Text**            | `#6E6E6E`              | Sub‑headings, helper text                                                                 |
| **Interactive Accent**        | `#10B981` (emerald)    | CTAs, apply buttons, checked radio/checkbox, focus rings, Select All / Deselect All       |
| **Selection / Status Accent** | `#EAA845` (warm amber) | Removable pills, selected-row highlight, count badges, active tab indicator, alerts/notes |
| **Success / Highlight**       | `#10B981` (emerald)    | Success messages, positive data points                                                    |
| **Error**                     | `#EF4444` (red)        | Error states                                                                              |

> **Accent rule (recent change):** Interactive controls use **emerald** (`#10B981`)
> — checked radio/checkbox color, focus rings/borders, range slider accent, and the
> Select All / Deselect All links. Amber (`#EAA845`) is reserved for **non‑interactive**
> selection & status affordances: removable pills, selected-row highlights, count
> badges, the active tab underline, and alert/note callouts.

### 2.2 Chart Colors (ECharts)

- **Line / Area Series:** Use the **emerald palette** (`#10B981`, `#6EE7B7`, `#34D399`).
- **Bar / Column Series:** Use a **gradient of amber** (`#EAA845` → `#F59E0B`).
- **Heatmap:** Use a sequential **cool‑to‑warm** scale (`#3B82F6` → `#EF4444`).
- **Pie / Donut:** Assign distinct pastel hues (`#F59E0B`, `#FBBF24`, `#FCD34D`, `#A7F3D0`).
- **Grid & Axis:** Light gray grid lines (`#E5E7EB`), axis labels in `#1C1C1C`.
- **Tooltip:** Dark background (`#1F2937`) with white text for readability.

## 3. Typography

| Element                   | Font Size | Font Weight | Case          | Usage                          |
| ------------------------- | --------- | ----------- | ------------- | ------------------------------ |
| **Brand Logo**            | 24px      | Bold        | Title Case    | Header logo                    |
| **Page Title (`H1`)**     | 32px      | Bold        | Title Case    | Main dashboard title           |
| **Section Header (`H2`)** | 24px      | Semi‑Bold   | Title Case    | Card/section headings          |
| **Subtitle / Kicker**     | 14px      | Medium      | Uppercase     | Small section labels           |
| **Card Title (`H3`)**     | 18px      | Bold        | Title Case    | Chart titles, filter headings  |
| **Body Text**             | 16px      | Regular     | Sentence case | Descriptions, tooltips         |
| **Navigation Links**      | 16px      | Medium      | Title Case    | Sidebar & top navigation       |
| **Button Text**           | 14px      | Medium      | Title Case    | Action buttons (Apply, Export) |

## 4. Layout & Grid System

- **Container Width:** Max‑width `1200px`, centered with `mx-auto`.
- **Responsive Breakpoints:**
  - **Mobile (<640px):** Single‑column layout, drawer hidden by default, hamburger toggles side panel.
  - **Tablet (640‑1024px):** Two‑column layout – sidebar (1/3) + main content (2/3).
  - **Desktop (>1024px):** Three‑column layout – left sidebar (drawer), central chart area, optional right panel for additional stats.
- **Spacing:** Use Tailwind’s `space-y-4` / `p-4` for vertical rhythm; `gap-6` for grid gaps.
- **Sidebar / Control Panel:** Background `#F9FAFB`, rounded corners, subtle shadow `shadow-sm`. Inputs and selects should have a light border (`#E5E7EB`) and an **emerald** focus ring (`focus:ring-emerald-500/40`).

## 5. Component Guidelines

### 5.1 Header & Navigation

- Sticky top bar with logo on the left, navigation links on the right.
- Height `56px`, background `#FFFFFF`, bottom border `#E5E5E5`.
- Use `aria‑pressed` for tab buttons to indicate active state.

### 5.2 Tabs (Timeline / Comparison / Distribution)

- Horizontal tab bar with clear active indicator:
  - Active tab: underline `2px` solid `#EAA845` (amber — a _status_ accent, kept intentionally), text `#1C1C1C`.
  - Inactive tabs: text `#6E6E6E`, hover `#1C1C1C`.
- Tabs should be keyboard‑focusable and have appropriate `role="tablist"` semantics.

### 5.3 Control Panel (Filters)

- Group related controls (Activities, Presets, Unit, Date range) with clear headings.
- Use `<label for="...">` for accessibility; inputs/selects have a minimum height of `36px`.
- Buttons: primary `bg-emerald-600` with white text, hover `bg-emerald-500`.
- **Form controls (radios, checkboxes, selects, date/number inputs, sliders):**
  - Checked/filled state uses emerald (`text-emerald-500` / `accent-emerald-500`).
  - Focus ring and focus border are emerald (`focus:ring-emerald-500/40`, `focus:border-emerald-500`).
- **Select All / Deselect All:** emerald text links (`text-emerald-600`, hover `text-emerald-500`).
- **Removable pills** (selected Activities/Presets) and the **selected-row highlight** in listboxes remain amber (`bg-[#EAA845]/15`–`/30`, `border-[#EAA845]/40`).
- Add subtle transition `transition-colors` for interactive elements.
- Help icons: render a superscript `circle-question-mark` next to each input title via `Tooltip.svelte`; the trigger icon is neutral gray (`text-[#1C1C1C]`, hover `#9e9e9e`) with an emerald focus ring.

### 5.4 Chart Container

- Wrapper `div` with `flex-1 w-full h-full` and a light gray border `border border-[#E5E7EB]`.
- Provide a minimum height of `400px` to ensure chart visibility.
- Background for chart area: `#FFFFFF` (or dark when using dark mode – use `bg-slate-950` and set ECharts theme to `dark`).

### 5.5 Chart Toolbar (Export PNG / SVG)

- Buttons placed top‑right of chart container.
- Small pill style: `px-2 py-1 bg-emerald-600 text-white rounded-md text-xs`.
- Hover state: `bg-emerald-500`.
- Provide tooltip on hover describing the export action.

### 5.6 Data Visualisation Specifics

- **Axis Labels:** Font size `12px`, color `#1C1C1C`.
- **Legends:** Horizontal layout below chart, text `#1C1C1C`.
- **Gridlines:** Light gray `#E5E7EB`, dashed style for minor lines.
- **Tooltips:** Dark semi‑transparent background (`rgba(31,41,55,0.9)`), padding `8px`, rounded corners `rounded`.
- **Accessibility:** Ensure chart colors have a contrast ratio ≥ 4.5:1; provide ARIA `role="img"` with descriptive `aria-label` on chart container.

## 6. Interaction & Feedback

- **Loading States:** Show a spinner (`animate-spin`) centered within chart container while data loads.
- **Error States:** Display an inline alert with amber background (`bg-amber-100`) and text `#B45309`.
- **Success Notifications:** Subtle toast (`bg-emerald-100`), auto‑dismiss after 3 seconds.

## 7. Accessibility Checklist

- All interactive elements must have visible focus outlines (`focus:outline-none focus:ring-2 focus:ring-emerald-500`).
- Form controls must be associated with `<label>` elements (already addressed in the component code).
- Ensure color contrast meets WCAG AA for normal text and UI components.
- Keyboard navigation should allow tabbing through the sidebar, tabs, filters, and chart toolbar.

---

_This style guide adapts the Insight Timer visual language to the Practice Insight data‑visualisation dashboard, providing concrete specifications for layout, typography, colors, and chart styling to ensure a cohesive, accessible, and pleasant user experience._
