# Design Style Guide: Insight Timer Web UI

## 1. Overview & Brand Aesthetic

- **Vibe:** Calm, modern, spacious, and mindful.
- **Core Design Philosophy:** Minimalist interface elements combined with rich, imagery-driven content tiles to promote focus and relaxation.
- **Theme:** Light mode with dark imagery cards and clean contrast.

---

## 2. Typography

| Element                    | Font Weight            | Case                  | Description / Usage                                |
| :------------------------- | :--------------------- | :-------------------- | :------------------------------------------------- |
| **Brand Logo**             | Bold (Serif / Display) | Title Case            | High distinction, organic feel                     |
| **Page Title (`H1`)**      | Bold                   | Title Case            | Main page heading (e.g., "My Courses")             |
| **Section Header (`H2`)**  | Bold / Medium          | Title Case            | Categories/sections (e.g., "Started")              |
| **Subtitle / Kicker**      | Semi-Bold              | UPPERCASE             | Small category label (e.g., "PREMIUM EXPERIENCES") |
| **Card Title (`H3`)**      | Bold / Semi-Bold       | Title Case            | Course or item titles                              |
| **Card Subtitle / Author** | Regular                | Mixed / Lower         | Secondary metadata (e.g., "by Author Name")        |
| **Navigation Links**       | Regular / Medium       | Sentence / Title Case | Header and footer link text                        |

---

## 3. Color Palette

### Base & Backgrounds

- **Primary Background:** White (`#FFFFFF`)
- **Card Overlay / Dark Backgrounds:** Near Black / Dark Charcoal (`#121212` to `#1A1A1A`)
- **Divider / Border Lines:** Light Gray (`#E5E5E5`)

### Primary Text & Accents

- **Primary Text:** Charcoal / Near Black (`#1C1C1C`)
- **Secondary Text:** Medium Gray (`#6E6E6E`)
- **Kicker Text:** Muted Gray (`#8C8C8C`)
- **Accent / Badge Highlight:** Warm Amber / Gold (`#EAA845`) — _Used for tags like "COURSE"_

---

## 4. Cards & Component Specs

### Content Card Structure

- **Border Radius:** Rounded corners (~`12px` to `16px`).
- **Aspect Ratio:** Standard landscape (`16:9` or `4:3`) for cover images.
- **Badge / Tags:**
  - **Top-Left Overlay Tag:** Dark translucent badge showing key metrics (e.g., "DAY 0").
  - **Bottom-Left Pill Badge:** Warm gold pill with bold text and icon (`COURSE`).
- **Card Metadata:**
  - Star Rating with numerical rating (`★ 4.7`) and duration/unit indicator (`• DAYS`).
  - Bold title followed by a lighter, secondary author line.

---

## 5. Layout & Grid

- **Header Bar:**
  - Sticky top bar with high whitespace.
  - Left-aligned logo, right-aligned navigation items, search icon, and circular user profile avatar with dropdown indicator.
- **Container Width:** Max-width centered container (`~1200px`) with generous side margins.
- **Grid System:**
  - **Desktop:** 3-Column Responsive Grid with consistent horizontal and vertical gap (`~24px`).
  - **Mobile / Tablet:** Responsive collapse down to 2-column or 1-column layouts.
- **Footer:** Clean multi-column text navigation grouped into clear categories (Browse, Resources, Company) with a horizontal line separator and social media icon row.
