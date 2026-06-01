# SECompass — Design Specification

> AI-Powered Career Orientation & Learning Roadmap Platform for Software Engineering Students

---

## 1. Product Identity

**Name:** SECompass
**Tagline:** *From Generalist to Job-Ready.*
**Design Philosophy:** Utilitarian clarity over decoration. Dense technical content demands maximum readability. The interface is a precision tool — every visual decision serves comprehension and forward momentum. Inspired by the brutalist, high-contrast approach of roadmap.sh: hard edges, stark contrast, zero ambiguity.

---

## 2. Color Palette

The color system is highly utilitarian. It relies on stark monochrome contrasts for readability, using bright accents primarily for state changes and progress tracking.

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | Slate 900 | `#111827` | Brand identity, main text, node borders, dark buttons, connector lines, sidebar background |
| Secondary | Blue 600 | `#2563EB` | Text links, primary interactive buttons, focus rings, active nav states |
| Tertiary | Yellow 200 | `#FEF08A` | Default background for active/unstarted roadmap nodes — the platform's signature visual |
| Neutral | Gray 50 | `#F9FAFB` | Base page backgrounds, standard containers, input fields |
| Success | Green 500 | `#22C55E` | Background for "Completed" node status |
| Skipped | Purple 500 | `#A855F7` | Background for "Skipped" node status |
| In Progress | Blue 200 | `#BFDBFE` | Background for "InProgress" node status |
| Paused | Orange 200 | `#FED7AA` | Background for "Paused" node status |
| Not Started | White | `#FFFFFF` | Background for "NotStarted" nodes |
| Border | Gray 200 | `#E5E7EB` | Subtle borders on containers, dividers, input outlines |
| Text Muted | Gray 500 | `#6B7280` | Secondary text, timestamps, placeholders, metadata |
| Text Body | Gray 700 | `#374151` | Standard body text, descriptions |
| Surface | White | `#FFFFFF` | Card surfaces, modals, drawer backgrounds |

**No dark mode in v1.0.** The high-contrast monochrome palette provides sufficient differentiation without dual-theme overhead at this stage.

### Node Status Color Map

| `NodeProgressStatus` | Int | Node Background | Text | Label |
|---|---|---|---|---|
| NotStarted | `0` | `#FFFFFF` | `#111827` | Not Started |
| InProgress | `1` | `#BFDBFE` | `#1E3A8A` | In Progress |
| Paused | `2` | `#FED7AA` | `#7C2D12` | Paused |
| Skipped | `3` | `#A855F7` | `#FFFFFF` | Skipped |
| Completed | `4` | `#22C55E` | `#FFFFFF` | Done |
| Default (template) | — | `#FEF08A` | `#111827` | — |

All nodes share `border: 2px solid #111827` and `box-shadow: 4px 4px 0px 0px #111827` regardless of status. Status is communicated through background color only.

### CSS Custom Properties

```css
:root {
  /* Brand Colors */
  --color-slate-900:  #111827;
  --color-blue-600:   #2563EB;
  --color-yellow-200: #FEF08A;
  --color-gray-50:    #F9FAFB;
  --color-green-500:  #22C55E;
  --color-purple-500: #A855F7;

  /* Extended Palette */
  --color-blue-200:   #BFDBFE;
  --color-orange-200: #FED7AA;
  --color-gray-200:   #E5E7EB;
  --color-gray-300:   #D1D5DB;
  --color-gray-500:   #6B7280;
  --color-gray-700:   #374151;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Node Signature Styles */
  --node-border:  2px solid var(--color-slate-900);
  --node-shadow:  4px 4px 0px 0px var(--color-slate-900);
  --radius-sm:    4px;
  --radius-md:    6px;

  /* Connector Lines */
  --line-thickness: 3px;
  --line-color:     #111827;
  --line-dash:      6px 4px;

  /* Extended Shadows */
  --shadow-node-hover:  6px 6px 0px 0px #111827;
  --shadow-node-press:  2px 2px 0px 0px #111827;
  --shadow-card:        2px 2px 0px 0px #E5E7EB;
  --shadow-modal:       8px 8px 0px 0px #111827;
  --shadow-button:      2px 2px 0px 0px #111827;
}
```

---

## 3. Typography

The platform uses clean, highly legible typefaces to handle dense technical content.

### Font Families

**Inter (Sans-Serif)** — all UI text: titles, body, labels, buttons, nav, descriptions.
Weights used: 400, 500, 600, 700, 800.

**System Monospace** — `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
Usage: code blocks in chat, technical skill tags, node sub-labels, resource type badges, IDs.

### Type Scale

| Token | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| `display` | 36px | 800 | 1.1 | -0.03em | Roadmap title, hero |
| `h1` | 28px | 700 | 1.2 | -0.02em | Page titles |
| `h2` | 22px | 700 | 1.25 | -0.01em | Section headers |
| `h3` | 18px | 600 | 1.3 | 0 | Card titles |
| `h4` | 15px | 600 | 1.4 | 0 | Sub-section labels |
| `body-lg` | 16px | 400 | 1.6 | 0 | Main body, descriptions |
| `body` | 14px | 400 | 1.5 | 0 | Standard UI text |
| `body-sm` | 13px | 400 | 1.5 | 0 | Metadata, secondary |
| `label` | 13px | 500 | 1.4 | 0.01em | Buttons, nav, badges |
| `caption` | 11px | 400 | 1.4 | 0.02em | Timestamps, IDs |
| `node-title` | 14px | 600 | 1.3 | 0 | Roadmap node label |
| `node-sub` | 11px | 500 mono | 1.4 | 0 | Node sub-label |
| `code` | 13px mono | 500 | 1.5 | 0 | Code snippets |

---

## 4. Component Design System

### 4.1 Roadmap Nodes (Signature Component)

The node card is the platform's most critical element.

```
┌─────────────────────────┐
│  Node Title             │  ← Inter 14px 600
│  sub-label (optional)   │  ← Mono 11px 500, gray-500
└─────────────────────────┘
```

- Min-width: 160px, max-width: 220px, min-height: 44px
- Padding: `10px 14px`
- **Border:** `2px solid #111827`
- **Border radius:** `4px`
- **Shadow:** `box-shadow: 4px 4px 0px 0px #111827` — hard block, no blur
- **Background:** determined by `NodeProgressStatus` (see color map)
- Hover: `transform: translate(-1px, -1px)`, shadow → `6px 6px 0px 0px #111827`
- Active/press: `transform: translate(2px, 2px)`, shadow → `2px 2px 0px 0px #111827`
- Transition: `all 0.1s ease` (fast, snappy)
- Status dot: 8px filled circle top-right, color matches status bg (hidden on NotStarted)

### 4.2 Connector Lines

- **Main path (required):** solid, `3px`, `#111827`, orthogonal routing
- **Optional path:** dashed `6px 4px`, `2px`, `#111827`
- **Arrowhead:** small filled triangle, `#111827`, at target end
- React Flow edge type: `step` (right-angle turns, not bezier)

### 4.3 Buttons

All: `border-radius: 4px`, Inter 13px 500, padding `8px 16px`, transition `all 0.1s ease`.

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary Dark | `#111827` | White | none | `bg: #1f2937` + `shadow: 2px 2px 0px 0px #374151` |
| Primary Blue | `#2563EB` | White | none | `bg: #1d4ed8` + shadow |
| Secondary | `#F3F4F6` | `#111827` | none | `bg: #E5E7EB` |
| Outlined | transparent | `#111827` | `1px solid #D1D5DB` | border `#111827`, bg `#F9FAFB` |
| Danger | `#EF4444` | White | none | `bg: #DC2626` |

Active press on all: `transform: translate(1px, 1px)`.

### 4.4 Form Inputs

- Background: `#F9FAFB`, border: `1px solid #E5E7EB`, radius: `4px`
- Font: Inter 14px 400, color `#111827`, placeholder `#9CA3AF`
- Height: 40px standard, padding `8px 12px`
- Focus: `border: 1px solid #2563EB`, `outline: 2px solid #BFDBFE`
- Error: `border: 1px solid #EF4444`, bg `#FEF2F2`

**Search bar:** same input specs + left icon slot (16px magnifying glass SVG, `#9CA3AF`), left-padding 36px.

### 4.5 Cards

| Variant | Border | Shadow | Radius | Use |
|---|---|---|---|---|
| Standard | `1px solid #E5E7EB` | none | `6px` | Dashboard widgets, lists |
| Feature | `2px solid #111827` | `4px 4px 0px 0px #111827` | `4px` | Roadmap cards, repo cards |
| Modal | `2px solid #111827` | `8px 8px 0px 0px #111827` | `6px` | Modals, dialogs |

Feature card hover: shadow → `6px 6px 0px 0px #111827`, `transform: translate(-1px, -1px)`.

### 4.6 Badges & Tags

**Status badge** — `border-radius: 4px`, padding `2px 8px`, Inter 11px 600:

| Status | Background | Text |
|---|---|---|
| Not Started | `#F3F4F6` | `#374151` |
| In Progress | `#BFDBFE` | `#1E3A8A` |
| Paused | `#FED7AA` | `#7C2D12` |
| Skipped | `#A855F7` | `#FFFFFF` |
| Completed | `#22C55E` | `#FFFFFF` |

**Skill tag:** `bg: #FEF08A`, `border: 1px solid #111827`, `color: #111827`, `radius: 4px`

**Resource type tag:** mono font, `bg: #F3F4F6`, `color: #374151`, `radius: 4px`

**Role badge:**
- Admin: `bg: #FEE2E2`, text `#991B1B`
- Manager: `bg: #FEF3C7`, text `#92400E`
- RoadmapUser: `bg: #DBEAFE`, text `#1E40AF`

All badges: `4px` radius, Inter 11px 600.

### 4.7 Navigation Sidebar

- Width: 240px expanded / 56px icon-only
- Background: `#111827` (always dark)
- Logo: Inter 700 16px, white
- Section labels: `#6B7280`, Inter 11px 600, UPPERCASE, `letter-spacing: 0.08em`
- Nav items: Inter 14px 500, `#D1D5DB` default, white hover
  - Hover: `bg: rgba(255,255,255,0.08)`
  - Active: `bg: rgba(37,99,235,0.20)`, text `#93C5FD`, `border-left: 2px solid #2563EB`
- Divider: `1px solid rgba(255,255,255,0.08)`
- Bottom: user strip — avatar + name + logout icon
- Collapse toggle: chevron, `rgba(255,255,255,0.4)`

### 4.8 Header Bar

- Height: 52px, bg `#FFFFFF`, `border-bottom: 1px solid #E5E7EB`
- Content: breadcrumb (Inter 14px `#374151`), flex spacer, search bar (240px), bell icon (Lucide 20px), user avatar (28px)
- `position: sticky; top: 0; z-index: 10`

### 4.9 Progress Indicators

**Linear bar:** container `#E5E7EB`, height `6px`, radius `3px`, fill `#22C55E` (completion) / `#2563EB` (general), `transition: width 400ms ease`.

**Fraction text:** Inter 14px 600 `#111827` — "12 / 24 nodes"

### 4.10 Toasts

- Position: bottom-right
- Container: `bg: #111827`, `border-radius: 6px`, `padding: 12px 16px`, white text, Inter 13px
- Left accent bar: `3px solid` (green/red/blue/amber by type)
- Auto-dismiss: 3 seconds
- Enter: `translateY(8px) → 0` + fade, 150ms

### 4.11 Modals

- Backdrop: `rgba(0,0,0,0.5)`, no blur
- Container: `bg: #FFFFFF`, `border: 2px solid #111827`, `box-shadow: 8px 8px 0px 0px #111827`, `border-radius: 6px`
- Header: Inter 18px 700, bottom border `1px solid #E5E7EB`, padding `20px 24px`
- Footer: top border `1px solid #E5E7EB`, padding `16px 24px`, buttons right-aligned
- Animation: `scale(0.97) → scale(1)` + fade, 150ms ease-out

### 4.12 Skeleton Loaders

- Color: `#F3F4F6`, shimmer gradient `#F3F4F6 → #E5E7EB → #F3F4F6`
- Animation: 1.5s infinite sweep
- Shapes match content they replace, radius matches component

---

## 5. Layout System

### 5.1 Application Shell

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (240px)  │ Header (sticky 52px)              │
│ bg: #111827      ├───────────────────────────────────┤
│                  │ Page Content                      │
│ [Logo]           │ padding: 32px                     │
│ [Nav]            │ max-width: 1280px                 │
│ [User]           │                                   │
└──────────────────────────────────────────────────────┘
```

- Sidebar: `position: fixed`, full height, `z-index: 20`
- Main: `margin-left: 240px` (56px collapsed)
- Content: `padding: 32px`, bg `#F9FAFB`

### 5.2 Responsive Breakpoints

| Breakpoint | Change |
|---|---|
| < 768px | Sidebar hidden, hamburger top bar, full-width content |
| 768px–1024px | Sidebar collapsed to icon-only (56px) |
| > 1024px | Sidebar full (240px) |

### 5.3 Page Templates

- **Dashboard:** `grid-cols-4` KPI strip → `grid-cols-3` widgets
- **Roadmap canvas:** full bleed (viewport minus sidebar + header), no padding, React Flow fills space
- **Chat:** fixed 2-panel — 260px sessions list left, flex-1 messages right
- **Admin tables:** full-width with filter bar above, pagination below
- **Profile/Settings:** centered single-column, `max-width: 640px`

---

## 6. Module UI Designs

### 6.1 Auth Pages

**Login / Register** — centered card (`max-width: 400px`):
- Card: `border: 2px solid #111827`, `box-shadow: 8px 8px 0px 0px #111827`, `border-radius: 6px`, white bg
- Logo + Inter 22px 700 heading
- Standard inputs (40px)
- Primary dark button, full-width — "Sign in" / "Create account"
- `or` divider with gray lines
- Google button: white bg, `border: 1px solid #D1D5DB`, full-width
- Link below card (blue-600)

### 6.2 Dashboard

**KPI strip (4 cards):** white bg, `border: 1px solid #E5E7EB`, `radius: 6px`, padding 16px 20px. Large Inter 700 number + label per card.

**Below KPI (col-span-2 / col-span-1):**
- Left: Recharts `AreaChart` — `#BFDBFE` fill, `#2563EB` stroke, gray-200 grid lines
- Right: mini radar chart teaser + "View full analysis" blue link

**Recent activity:** session list, gray-700 text, timestamps right. Quick Actions row: 4 dark (`#111827`) buttons.

### 6.3 Roadmap Module

**List page:** Feature cards with hard shadow. "Generate Roadmap" dark button top-right.

**Generator modal:** Career Role grid — `border: 2px solid #111827`, selected = `bg: #FEF08A`. Confirm step shows node count.

**Roadmap canvas:**
- Background: `#F9FAFB` + SVG dot grid (`#E5E7EB`, 20px spacing)
- Nodes: brutalist spec from §4.1
- Edges: `step` type, `3px`, `#111827`
- Floating controls (top-left): zoom in/out/fit, white bg, `border: 1px solid #E5E7EB`, stacked
- Node legend (bottom-left): color swatches + labels, white bg, `border: 1px solid #E5E7EB`

**Node Details Drawer (400px, right slide-over):**
- bg white, `border-left: 2px solid #111827`
- Node name Inter 18px 700 + × close
- Status: segmented button group (5 options) — selected `bg: #111827, text: white`
- Note textarea (standard input styles)
- Save button: dark full-width
- Resources: cards with `border: 1px solid #E5E7EB`, type tag (mono), IsFree chip, "Open →" blue link
- Slide-in: `translateX(100%) → 0`, 200ms ease-out

### 6.4 Chat

**Sessions panel (260px):** white bg, `border-right: 1px solid #E5E7EB`. "+ New" outlined button top. Session rows: Inter 13px 500, active = `bg: #DBEAFE`, `border-left: 2px solid #2563EB`.

**Messages panel:** bg `#F9FAFB`. User bubble: right, `bg: #111827`, white text, `radius: 6px`. Assistant bubble: left, white bg, `border: 1px solid #E5E7EB`. Code blocks: `bg: #111827`, mono font, `radius: 4px`. Input bar: white bg, `border-top: 1px solid #E5E7EB`. Send button dark.

### 6.5 Skill Gap Analysis

Career Role cards — selected = `bg: #FEF08A`. Radar chart: current skills (`fill: #BFDBFE, stroke: #2563EB`) vs required (`fill: rgba(254,240,138,0.6), stroke: #111827`). Gap list below with priority badges.

### 6.6 Market Pulse

Recharts `AreaChart` — `#BFDBFE` fill, `#2563EB` stroke, Inter 12px axes. Skills card grid: Inter 15px 700 skill name, TrendScore large number, `#2563EB` progress bar, mono source tag.

### 6.7 E-Portfolio

Repo cards: `border: 2px solid #111827`, `shadow: 4px 4px 0px 0px #111827`. AI summary section: `bg: #F9FAFB`, italic Inter 13px. Public view (`/portfolio/{userId}`): no sidebar, skill tags `bg: #FEF08A`, `border: 1px solid #111827`.

---

## 7. Interaction & Motion

**Guiding principle:** Motion is functional, not decorative. Transitions confirm actions.

| Pattern | Duration | Easing | Effect |
|---|---|---|---|
| Button press | 100ms | ease | `translate(1px,1px)` + shadow shrink |
| Node hover | 100ms | ease | `translate(-1px,-1px)` + shadow grow |
| Node click | 100ms | ease | `translate(2px,2px)` + shadow minimum |
| Drawer open | 200ms | ease-out | `translateX(100%) → 0` |
| Modal open | 150ms | ease-out | `scale(0.97→1)` + fade |
| Toast enter | 150ms | ease-out | `translateY(8px) → 0` + fade |
| Route change | 150ms | ease-out | opacity 0→1 |
| Progress bar | 400ms | ease | `width` CSS transition |

**What does not animate:** sidebar collapse, node status color change (instant — decision felt, not eased), skeleton → content swap.

---

## 8. Accessibility

- WCAG AA minimum on all text/bg pairs. `#111827` on `#F9FAFB` = 16.1:1 (AAA).
- Focus ring: `outline: 2px solid #2563EB; outline-offset: 2px` on all interactive elements.
- `aria-label` on all icon-only buttons.
- Semantic HTML throughout: `<nav>`, `<main>`, `<aside>`, `<article>`, `<section>`.
- React Flow nodes: `aria-label` with name + status.
- Modals trap focus; drawers close on Escape.

---

## 9. Tailwind Config Reference

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        slate:  { 900: '#111827' },
        blue:   { 200: '#BFDBFE', 600: '#2563EB' },
        yellow: { 200: '#FEF08A' },
        green:  { 500: '#22C55E' },
        purple: { 500: '#A855F7' },
        orange: { 200: '#FED7AA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'node':        '4px 4px 0px 0px #111827',
        'node-hover':  '6px 6px 0px 0px #111827',
        'node-press':  '2px 2px 0px 0px #111827',
        'card':        '2px 2px 0px 0px #E5E7EB',
        'button':      '2px 2px 0px 0px #111827',
        'modal':       '8px 8px 0px 0px #111827',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
};
```