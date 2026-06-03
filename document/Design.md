# SECompass — Design Specification

> AI-Powered Career Orientation & Learning Roadmap Platform for Software Engineering Students

---

## 1. Product Identity

**Name:** SECompass
**Tagline:** *From Generalist to Job-Ready.*
**Design System:** Google Material Design 3 (MD3)
**Design Philosophy:** Clean, purposeful, and information-dense. MD3's elevation, color roles, and typographic hierarchy carry the interface — every visual decision supports comprehension and student forward momentum. The platform is a precision career tool, not a marketing site. The UI uses MD3's expressive-but-restrained language: tonal surfaces, pill-shaped interactive elements, floating labels, and role-based color tokens applied consistently across all 19 screens.

---

## 2. Design System — Google Material Design 3

The entire frontend is implemented against the MD3 specification using its official color role vocabulary, typography scale, shape scale, elevation system, and component patterns.

---

## 3. Color System

All colors are expressed as MD3 color roles. The primary brand color is Google Blue (#1A73E8), paired with a neutral gray surface family.

### 3.1 Core Color Roles

| MD3 Role | Hex | Primary Usage |
|---|---|---|
| Primary | `#1A73E8` | Filled buttons, FABs, active nav indicator, links, focus rings |
| On Primary | `#FFFFFF` | Text and icons placed on Primary |
| Primary Container | `#E8F0FE` | Chip backgrounds, tonal card fills, selected state backgrounds |
| On Primary Container | `#041E49` | Text/icons on Primary Container |
| Surface | `#FFFFFF` | Card backgrounds, modal backgrounds, panel backgrounds |
| Surface Variant | `#F1F3F4` | Input field backgrounds, hover row fills, inactive tab backgrounds |
| Surface Container | `#F8F9FA` | Page background, content area fill |
| On Surface | `#202124` | Primary body text, headings |
| On Surface Variant | `#5F6368` | Muted text, input labels, placeholders, secondary metadata |
| Outline | `#DADCE0` | Input field borders, card borders, dividers |
| Outline Variant | `#E8EAED` | Subtle separators, table row dividers |
| Error | `#D93025` | Error states, validation failures, danger actions |
| Error Container | `#FCE8E6` | Error background fills |
| Scrim | `rgba(0,0,0,0.32)` | Modal/overlay backdrops |

### 3.2 Semantic Semantic Colors

| Role | Hex | Hex (Container) | Usage |
|---|---|---|---|
| Success | `#1E8E3E` | `#E6F4EA` | Completion, positive states, green progress |
| Warning | `#E37400` | `#FEF7E0` | Caution states, paused progress, alerts |
| Info | `#1A73E8` | `#E8F0FE` | Informational chips and highlights |
| Purple | `#7B1FA2` | `#F3E8FD` | Skipped node status, specialty accents |

### 3.3 Node Status Color Map

Node status is communicated through background fill, text color, and stroke. All five statuses map directly to `NodeProgressStatus` enum integer values.

| Status | Int | Node Fill | Text Color | Stroke |
|---|---|---|---|---|
| NotStarted | `0` | `#F1F3F4` | `#5F6368` | `#DADCE0` |
| InProgress | `1` | `#E8F0FE` | `#1A73E8` | `#4285F4` |
| Paused | `2` | `#FEF7E0` | `#E37400` | `#FBBC04` |
| Skipped | `3` | `#F3E8FD` | `#7B1FA2` | `#AB47BC` |
| Completed | `4` | `#E6F4EA` | `#1E8E3E` | `#34A853` |

### 3.4 CSS Custom Properties

```css
:root {
  /* MD3 Color Roles */
  --md-primary:              #1A73E8;
  --md-on-primary:           #FFFFFF;
  --md-primary-container:    #E8F0FE;
  --md-on-primary-container: #041E49;
  --md-surface:              #FFFFFF;
  --md-surface-variant:      #F1F3F4;
  --md-surface-container:    #F8F9FA;
  --md-on-surface:           #202124;
  --md-on-surface-variant:   #5F6368;
  --md-outline:              #DADCE0;
  --md-outline-variant:      #E8EAED;
  --md-error:                #D93025;
  --md-error-container:      #FCE8E6;
  --md-scrim:                rgba(0, 0, 0, 0.32);

  /* Semantic */
  --md-success:              #1E8E3E;
  --md-success-container:    #E6F4EA;
  --md-warning:              #E37400;
  --md-warning-container:    #FEF7E0;
  --md-purple:               #7B1FA2;
  --md-purple-container:     #F3E8FD;

  /* Node Status */
  --node-not-started-fill:   #F1F3F4;
  --node-not-started-text:   #5F6368;
  --node-not-started-stroke: #DADCE0;
  --node-in-progress-fill:   #E8F0FE;
  --node-in-progress-text:   #1A73E8;
  --node-in-progress-stroke: #4285F4;
  --node-paused-fill:        #FEF7E0;
  --node-paused-text:        #E37400;
  --node-paused-stroke:      #FBBC04;
  --node-skipped-fill:       #F3E8FD;
  --node-skipped-text:       #7B1FA2;
  --node-skipped-stroke:     #AB47BC;
  --node-completed-fill:     #E6F4EA;
  --node-completed-text:     #1E8E3E;
  --node-completed-stroke:   #34A853;

  /* Typography */
  --font-sans: 'Google Sans', 'Roboto', system-ui, sans-serif;
  --font-mono: 'Roboto Mono', ui-monospace, monospace;
}
```

---

## 4. Typography

The platform uses Google Sans for display and UI text and Roboto as the fallback. Roboto Mono is used exclusively for code content and technical tags.

### 4.1 Font Families

| Family | Usage |
|---|---|
| Google Sans / Roboto | All UI text: display, headlines, titles, body, labels, buttons, nav |
| Roboto Mono | Code blocks in chat, resource type badges, technical skill tags, IDs |

### 4.2 MD3 Type Scale

| Token | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| Display Large | 48px | 700 | 1.1 | -0.25px | Landing page hero headline |
| Display Medium | 36px | 700 | 1.15 | 0 | Roadmap canvas title, stats |
| Headline Large | 32px | 600 | 1.2 | 0 | Page-level titles |
| Headline Medium | 28px | 600 | 1.25 | 0 | Feature section titles |
| Headline Small | 24px | 600 | 1.3 | 0 | Card titles, dialog headers |
| Title Large | 22px | 500 | 1.35 | 0 | Section titles |
| Title Medium | 16px | 500 | 1.4 | 0.15px | Card headers, nav items, breadcrumbs |
| Title Small | 14px | 500 | 1.4 | 0.1px | Sub-section labels, node titles |
| Body Large | 16px | 400 | 1.6 | 0.5px | Main body, descriptions |
| Body Medium | 14px | 400 | 1.5 | 0.25px | Standard UI text, form fields |
| Body Small | 12px | 400 | 1.5 | 0.4px | Metadata, timestamps, captions |
| Label Large | 14px | 500 | 1.4 | 0.1px | Buttons, nav labels |
| Label Medium | 12px | 500 | 1.5 | 0.5px | Chips, badges |
| Label Small | 11px | 500 | 1.4 | 0.5px | Overlines, status labels, captions |

---

## 5. Elevation System

MD3 uses drop-shadow layering to communicate elevation level. No colored tints on elevated surfaces.

| Level | CSS Value | Usage |
|---|---|---|
| Level 0 | none | Flat surfaces, page background |
| Level 1 | `drop-shadow(0 1px 2px rgba(0,0,0,0.10))` | Cards, chips, input fields at rest |
| Level 2 | `drop-shadow(0 1px 2px rgba(0,0,0,0.10)) drop-shadow(0 2px 6px rgba(0,0,0,0.08))` | Floating action buttons, auth cards |
| Level 3 | `drop-shadow(0 4px 8px rgba(0,0,0,0.12)) drop-shadow(0 1px 3px rgba(0,0,0,0.08))` | Drawers, side sheets, nav rail |
| Level 4 | `drop-shadow(0 6px 12px rgba(0,0,0,0.14))` | Modals, dialogs |

---

## 6. Shape Scale (Corner Radius)

| Name | Value | Usage |
|---|---|---|
| Extra Small | 4px | Text fields, resource type badges, data table rows |
| Small | 8px | Chips, filter chips, status badges, assist chips |
| Medium | 12px | Cards, node detail drawer sections, snackbars |
| Large | 16px | Public portfolio cards, feature cards |
| Extra Large | 28px | Dialogs, auth cards, modals |
| Full | 9999px | All buttons (pill shape), FABs, avatar circles |

---

## 7. Spacing Scale

All layout spacing follows the MD3 4px base grid.

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px`

---

## 8. Component Design System

### 8.1 Roadmap Nodes

The roadmap node is the platform's most critical visual component. Unlike the previous brutalist style, nodes now use MD3 soft radius, subtle elevation, and status-driven fill colors.

```
┌────────────────────────────┐
│ ● Node Title               │  ← Title Small 14px/500, On Surface
│   sub-label (optional)     │  ← Label Small 11px mono, On Surface Variant
└────────────────────────────┘
```

- Min-width: 160px, max-width: 220px, min-height: 44px
- Padding: `12px 16px`
- Border radius: `12px` (MD3 Medium)
- Border stroke: `1.5px` matching status stroke color
- Elevation: Level 1 at rest, Level 3 on selected
- Status dot: 8px filled circle, top-right inside padding, fill matches status stroke color (hidden on NotStarted)
- Background: determined by `NodeProgressStatus` color map (§3.3)
- Hover: Elevation 2, cursor pointer
- Selected: Elevation 3, stroke 2px Primary `#1A73E8`
- Transition: `all 150ms ease-out`

### 8.2 Connector Lines (React Flow Edges)

- **Main edge:** 2px, `#DADCE0`, smooth bezier curve, arrowhead (small triangle `#DADCE0`) at target end
- **Active edge (to InProgress node):** 2px, `#1A73E8`
- Edge type: `smoothstep` (soft right-angle, not hard orthogonal)

### 8.3 Buttons

All buttons are pill-shaped (`border-radius: 9999px`), height 40px. Label Large 14px/500.

| Variant | Fill | Text | Border | Usage |
|---|---|---|---|---|
| Filled | `#1A73E8` | `#FFFFFF` | none | Primary CTA, save, generate |
| Tonal | `#E8F0FE` | `#1A73E8` | none | Secondary actions, "Open", "Edit" |
| Outlined | transparent | `#1A73E8` | `1px solid #DADCE0` | "Export", "Cancel", tertiary |
| Text | transparent | `#1A73E8` | none | Inline links, "View all", "Reset" |
| Danger Filled | `#D93025` | `#FFFFFF` | none | Destructive: Deactivate, Delete |
| Disabled Filled | `#F1F3F4` | `#DADCE0` | none | Loading or no-selection states |

FAB (Floating Action Button):
- Extended FAB: `border-radius: 28px`, height 56px, padding `0 20px`, fill `#1A73E8`, icon + label, Elevation 3
- Mini FAB: 40px circle, fill `#1A73E8`, Elevation 3

### 8.4 Text Fields — MD3 Outlined Variant

- Container: `border-radius: 4px`, height 56px, padding `8px 12px`
- Stroke: `1px solid #DADCE0` at rest
- Floating label: Body Large 16px `#5F6368`, scales to Label Small 12px on focus/filled
- Focus stroke: `2px solid #1A73E8`, label color `#1A73E8`
- Error stroke: `2px solid #D93025`, label color `#D93025`, helper text below
- Background: `#FFFFFF`
- Leading icon: 20px, `#5F6368`
- Trailing icon (eye, check, error): 20px, color by state

### 8.5 Cards

| Variant | Fill | Border | Elevation | Radius | Usage |
|---|---|---|---|---|---|
| Elevated | `#FFFFFF` | none | Level 1 | 12px | Dashboard widgets, roadmap cards |
| Outlined | `#FFFFFF` | `1px solid #DADCE0` | none | 12px | Repo cards, skill rows |
| Public Portfolio | `#FFFFFF` | none | Level 1 | 16px | Public-facing cards |
| Auth Card | `#FFFFFF` | none | Level 2 | 28px | Login / Register form card |

### 8.6 Chips

| Variant | Fill | Stroke | Text | Radius | Usage |
|---|---|---|---|---|---|
| Filter — Selected | `#E8F0FE` | `#4285F4` | `#1A73E8` | 8px | Active filter, selected state; includes leading check icon |
| Filter — Unselected | `#F1F3F4` | `#DADCE0` | `#5F6368` | 8px | Inactive filter option |
| Assist | `#F1F3F4` | `#DADCE0` | `#202124` | 8px | Non-interactive informational tags |
| Input | `#E8F0FE` | `#4285F4` | `#1A73E8` | 8px | Skills with × delete icon |
| Status | status-based | — | status-based | 8px | NodeProgress status display |

### 8.7 Navigation Rail (Authenticated Shell)

- Width: 80px fixed, full height
- Fill: `#FFFFFF`, right border `1px solid #E8EAED`
- Logo: compass icon 24px `#1A73E8` + "SE" Label Small `#1A73E8`, top centered, padding-top 16px
- Nav items: icon 24px + label Body Small 12px, centered column, gap 4px
  - **Active:** 56×32px indicator pill fill `#E8F0FE` behind icon, icon `#1A73E8`, label `#1A73E8` Label Small 12px/500
  - **Inactive:** icon `#5F6368`, label `#5F6368`
  - Hover: background `#F1F3F4`, radius 8px
- Bottom: user avatar 32px circle + settings icon 20px `#5F6368`, padding-bottom 16px
- `position: fixed; left: 0; z-index: 20`

### 8.8 Top App Bar

- Height: 64px, fill `#FFFFFF`, Elevation Level 1
- `position: sticky; top: 0; z-index: 10`
- Left: breadcrumb, Title Medium 16px/500 `#202124`
- Right (gap 12px): search icon 24px `#5F6368` → bell icon 24px `#5F6368` with error badge → avatar 36px circle fill `#E8F0FE`

### 8.9 Auth Drawer (Left Panel — Auth Pages)

- Width: 360px, full height
- Fill: `linear-gradient(160deg, #1A73E8 0%, #0D47A1 100%)`
- Subtle diagonal line mesh overlay: white 5% opacity
- Content: logo row (compass icon 48px white + "SECompass" 28px/700 white) + tagline Body Large white/85% + 4 feature rows (check icon 20px white + Body Medium 14px white/90%) + social proof Body Small 12px white/70%

### 8.10 Progress Indicators

**Linear Progress Bar:**
- Track: `#E8EAED`, height 4px (compact) / 6px (standard), radius 3px
- Fill: `#1E8E3E` for completion / `#1A73E8` for general progress
- `transition: width 400ms ease`

**Circular Progress:** 48px MD3 circular, `#1A73E8`, used in loading states (generate roadmap modal)

### 8.11 Dialogs

- Fill: `#FFFFFF`, radius 28px, Elevation Level 4, padding 24px
- Backdrop: Scrim `rgba(0,0,0,0.32)`
- Header: Headline Small 24px/600 `#202124` + × close icon top-right (40px touch target)
- Footer: Text "Cancel" + Filled "Save/Confirm", right-aligned, padding-top 24px
- Animation: `scale(0.97 → 1)` + fade, 150ms ease-out

**Confirm Delete Dialog:** adds `fill #FCE8E6` warning box with warning text inside

### 8.12 Snackbars

- Fill: `#202124`, text white, radius 4px, Elevation Level 3
- Position: bottom-center
- Left accent bar: 3px (Success `#4CAF50` / Error `#FF5252` / Info `#4285F4` / Warning `#FBBC04`)
- Optional action: Text button `#80BAFF` right-aligned
- Auto-dismiss: 3 seconds
- Animation: `translateY(8px) → 0` + fade, 150ms ease-out

### 8.13 Segmented Button Group

Used on the Node Details Drawer for status selection:
- Pill container, full-width, `border-radius: 9999px`
- 5 segments: "Not Started" | "In Progress" | "Paused" | "Skipped" | "Done"
- **Active segment:** fill matching status color (`#E8F0FE` for InProgress), stroke `2px #4285F4`, text `#1A73E8`, leading check icon
- **Inactive:** fill transparent, stroke `#DADCE0`, text `#5F6368`

### 8.14 Badges (Role & Status)

| Badge | Fill | Text | Radius |
|---|---|---|---|
| Admin | `#FCE8E6` | `#D93025` | 8px |
| Manager | `#FEF7E0` | `#E37400` | 8px |
| RoadmapUser / Student | `#E8F0FE` | `#1A73E8` | 8px |
| Verified | `#E6F4EA` | `#1E8E3E` | 8px |
| Connected | `#E6F4EA` | `#1E8E3E` | 8px |
| Private | `#F1F3F4` | `#5F6368` | 8px |
| Free | `#E6F4EA` | `#1E8E3E` | 8px |
| Paid | `#F1F3F4` | `#5F6368` | 8px |

All badges: Label Small 11px/500, padding `2px 8px`.

### 8.15 Skeleton Loaders

- Base fill: `#F1F3F4`
- Shimmer: gradient sweep `#F1F3F4 → #E5E7EB → #F1F3F4`, 1.5s infinite
- Shape radius matches the component being replaced

### 8.16 Data Tables (Admin)

- Header row: fill `#F8F9FA`, stroke-bottom `2px #E8EAED`, Label Large 14px/500 `#5F6368` uppercase
- Data rows: alternating `#FFFFFF` / `#FAFAFA`, stroke-bottom `1px #E8EAED`, hover fill `#F1F3F4`
- Container: fill `#FFFFFF`, radius 12px, Elevation Level 1, `overflow: hidden`

### 8.17 Empty States

- 64px circle fill `#F1F3F4`, icon 32px `#DADCE0` inside
- Headline Small 24px/600 `#202124`
- Body Medium 14px `#5F6368`
- Filled CTA button below

---

## 9. Layout System

### 9.1 Application Shell — Authenticated

```
┌──────────────────────────────────────────────────────────┐
│ Navigation Rail (80px fixed)  │ Top App Bar (64px sticky) │
│ fill #FFFFFF                  ├──────────────────────────┤
│                               │ Page Content Area         │
│  [Logo]                       │ fill #F8F9FA              │
│  [Nav Items]                  │ padding: 24px             │
│  [Avatar]                     │                           │
└──────────────────────────────────────────────────────────┘
```

- Rail: `position: fixed; left: 0; width: 80px; height: 100vh; z-index: 20`
- Main content: `margin-left: 80px; padding-top: 64px`
- Content inner: `padding: 24px; background: #F8F9FA`

### 9.2 Auth Pages Shell (No Rail, No Bar)

- Full-viewport two-panel horizontal layout
- Left: AuthDrawer 360px, full height, fixed gradient
- Right: `flex: 1`, fill `#F8F9FA`, form card centered horizontally and vertically

### 9.3 Roadmap Canvas

- Full bleed: viewport minus rail (80px) and top bar (64px)
- Background: `#F8F9FA` + SVG dot-grid (`1px dots #DADCE0`, 24px spacing)
- React Flow fills the remaining space, no additional padding
- Node Details Drawer: 400px, slides in from right, full height of content area

### 9.4 Chat Layout

- Two-panel, full height
- Left (ChatSidebar): 280px, fill `#FFFFFF`, stroke-right `1px #E8EAED`
- Right (ChatMainArea): `flex: 1`, fill `#F8F9FA`
- Input bar: sticky bottom of right panel

### 9.5 Responsive Breakpoints

| Breakpoint | Change |
|---|---|
| < 768px | Navigation Rail hidden; hamburger top bar; full-width content |
| 768px – 1024px | Rail collapses to icon-only (no labels) |
| > 1024px | Full Rail (80px with labels) |

### 9.6 Content Max-Widths

| Context | Max-Width |
|---|---|
| Marketing/landing sections | 1200px |
| Dashboard, admin tables | Full content area |
| Settings, profile | 720px centered |
| Public portfolio | 860px centered |
| Auth form card | 480px |
| Dialogs | 560–640px |

---

## 10. Page Inventory

| Frame | Name | Size | Auth |
|---|---|---|---|
| 00_Landing | Landing Page | 1440 × 5200px | Public |
| 01_Login | Login | 1440 × 900px | Public |
| 02_Register | Register | 1440 × 900px | Public |
| 03_Dashboard | Dashboard | 1440 × 900px | Auth |
| 04_Roadmaps | My Roadmaps List | 1440 × 900px | Auth |
| 05_RoadmapCanvas | Roadmap Canvas | 1440 × 900px | Auth |
| 06_Mentor | AI Virtual Mentor (Chat) | 1440 × 900px | Auth |
| 07_SkillGap | Skill Gap Analysis | 1440 × 900px | Auth |
| 08_Market | Market Pulse | 1440 × 900px | Auth |
| 09_Portfolio | E-Portfolio & GitHub | 1440 × 900px | Auth |
| 10_PublicPortfolio | Public Portfolio | 1440 × 3200px | Public |
| 11_Settings | Profile & Settings | 1440 × 900px | Auth |
| 12_AdminCareerRoles | Admin — Career Roles | 1440 × 900px | Auth (Admin) |
| 13_AdminRoadmaps | Admin — Roadmap Templates | 1440 × 900px | Auth (Admin) |
| 14_AdminNodes | Admin — Node Library | 1440 × 900px | Auth (Admin) |
| 15_AdminJobTrends | Admin — Job Trends | 1440 × 900px | Auth (Admin) |
| 16_GenerateModal | Generate Roadmap Modal | 1440 × 900px | Overlay |
| 17_NodeProgress | Node Progress Reference | 1440 × 2800px | Reference |
| 18_UIReference | UI States Reference | 1440 × 3600px | Reference |

---

## 11. Shared Component Library

The following master components are defined once in the Figma "Design System" page and used across all authenticated frames:

`NavigationRail` · `TopAppBar` · `AuthDrawer` · `StatCard` · `RoadmapCard` · `StatusChip` · `LinearProgress` · `Snackbar` · `ConfirmDialog` · `EmptyState` · `Skeleton` · `RoadmapNode` · `NodeDetailsDrawer` · `ChatBubble` · `TrendSkillCard` · `RepoCard`

---

## 12. Motion & Interaction

| Pattern | Duration | Easing | Effect |
|---|---|---|---|
| Button press | 100ms | ease | Ripple fill (MD3), slight opacity reduction |
| Node hover | 150ms | ease-out | Elevation Level 1 → Level 2 |
| Node selected | 100ms | ease | Elevation Level 3, stroke highlight |
| Drawer open | 200ms | ease-out | `translateX(100%) → 0` |
| Dialog open | 150ms | ease-out | `scale(0.97 → 1)` + fade |
| Snackbar enter | 150ms | ease-out | `translateY(8px) → 0` + fade |
| Route change | 150ms | ease-out | Opacity 0 → 1 |
| Progress bar | 400ms | ease | `width` CSS transition |
| Overlay in | 150ms | ease-out | Scrim fade + dialog scale-in |
| Status change | Instant | — | Color swap; no animation (decision felt immediately) |

---

## 13. Accessibility

- All text/background pairs meet WCAG AA contrast minimum (4.5:1 for body text)
- Focus ring: `outline: 2px solid #1A73E8; outline-offset: 2px` on all interactive elements
- `aria-label` on all icon-only buttons
- Semantic HTML: `<nav>`, `<main>`, `<aside>`, `<article>`, `<section>`
- React Flow nodes: `aria-label` includes node name + current status
- Dialogs trap focus; drawers close on `Escape`
- MD3 touch target minimum: 48×48px on all interactive elements

---

## 14. Figma File Structure

```
Page 1: "Design System"
  — Color styles (all MD3 tokens)
  — Text styles (full type scale)
  — Effect styles (all elevation levels)
  — Master components (see §11)

Page 2: "Public Pages"
  — 00_Landing · 01_Login · 02_Register · 10_PublicPortfolio

Page 3: "App — Student"
  — 03_Dashboard · 04_Roadmaps · 05_RoadmapCanvas
  — 06_Mentor · 07_SkillGap · 08_Market · 09_Portfolio · 11_Settings

Page 4: "App — Admin"
  — 12_AdminCareerRoles · 13_AdminRoadmaps · 14_AdminNodes · 15_AdminJobTrends

Page 5: "Modals & Overlays"
  — 16_GenerateModal (3 states)
  — 04b_DeleteRoadmapDialog (560×280px)
  — 05c_SnackbarSaved (480×56px)
  — 11b_DeactivateDialog (560×280px)
  — 12b_CreateRoleDialog (560×380px)
  — CreateNodeDialog (560×420px)

Page 6: "Reference"
  — 17_NodeProgress · 18_UIReference
```