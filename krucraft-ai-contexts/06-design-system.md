# KruCraft — Design System

> Design/system reference. For runtime implementation details, prefer the repo
> design-system code and current component usage patterns over older exported
> conversation wording.

## Brand Foundation

- **Platform:** KRU Craft
- **Type:** SaaS marketplace for digital learning resources
- **Users:** Teachers, creators, students, buyers, admins
- **Style goal:** Modern, clean, premium, minimal, scalable, easy to maintain
- **Tech stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS

## Design Priorities

1. Consistency
2. Scalability
3. Clean UI
4. Reusable components
5. Fast implementation (solo founder + AI workflow)

---

## Color System (Semantic)

| Category | Token | Usage |
|---------|-------|-------|
| **Core** | primary, secondary, accent | Brand identity |
| **Neutral** | background, foreground, surface, muted, border | Structural |
| **Semantic** | success, warning, danger, info | Status feedback |
| **Text** | heading, body, muted, inverse | Typography |
| **States** | hover, active, selected, disabled, focus | Interaction |

Light mode primary with optional dark mode direction.

---

## Typography System

- Font pairing: Bold geometric sans-serif (KRU) + Soft rounded script (Craft)
- Scale: Display, H1–H4, Body (lg/md/sm), Caption, Label, Button text
- Line clamp for cards: `line-clamp-2` for titles
- Table text: dense, small
- Form text: readable, medium

---

## Spacing Scale

- Section spacing: `py-12` to `py-16` (hero: `py-20`)
- Card padding: `p-4` or `p-5`
- Container: `max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8`
- Grid gap: `gap-6` standard, `gap-8` large screens

---

## Border Radius Scale

| Element | Radius |
|---------|--------|
| Cards | `rounded-3xl` |
| Buttons (standard) | `rounded-lg` |
| Badges/Pills | `rounded-full` |
| Inputs | `rounded-lg` |
| Modals | `rounded-2xl` |

---

## Button System

- **Variants:** primary, secondary, ghost, outline, destructive, link
- **Sizes:** sm, md, lg
- **States:** default, hover, active, disabled, loading
- **Icon:** left/right icon support
- **Mobile:** full-width on small screens where appropriate

---

## Component Inventory

### Foundations
Logo, Container, Section header, Divider, Icon wrapper

### Navigation
Top navbar, Sidebar, Tab, Mobile nav, Breadcrumb

### Inputs
Text input, Select, Checkbox, Radio, Textarea, File upload, Search bar

### Actions
Button (primary/secondary/ghost/destructive), Link button, Icon button

### Data Display
Resource card, Stat card, Admin card, Table, Badge, Avatar

### Feedback
Toast, Alert, Skeleton, Loading spinner, Progress, Empty state

### Overlays
Modal, Sheet, Dropdown menu, Popover, Tooltip

---

## Card Types

- **Resource card** (marketplace grid)
- **Library card** (user library, with action buttons)
- **Stat card** (admin/dashboard metrics)
- **Featured card** (homepage highlight, aspect-[16/9] or aspect-[16/10])
- **Admin card** (management screens)

---

## Resource Card Design Spec (Production-Ready)

### Card Container

```css
bg-white
border border-neutral-200/80
rounded-3xl
overflow-hidden
```

### Hover State

```css
border-color: slightly darker
/* OR very subtle lift: */
translate-y-[-2px]
/* NO heavy shadow animations */
```

### Image Area

```css
aspect-[4/3] /* or aspect-[5/4] */
object-cover /* or object-contain as needed */
/* Rounded top corners */
```

### Badge System (ONE badge per card, priority order)

1. **Featured** — `bg-amber-50 text-amber-700 border border-amber-200`
2. **New** — `bg-blue-50 text-blue-700`
3. **Free** — `bg-emerald-50 text-emerald-700`
4. **Best Seller** — amber
5. **Updated** — violet

Badge style: `text-xs font-medium px-3 py-1.5 rounded-full` positioned top-left of image container

### Title

```css
text-[17px] font-semibold leading-tight line-clamp-2
```

### Creator + Category Row

Format: `"Kru Craft · Science"` (creator first, category second, dot separator)

```css
text-sm text-neutral-500
```

### Utility Row

Examples: `"156 sales · Printable"`, `"4.8 ★ · 120 sales"`

```css
text-xs text-neutral-500
```

### Divider Above Price

```css
border-t border-neutral-200 mt-3 pt-3
```

### Price

- Paid: `text-lg font-semibold text-neutral-900`
- Free: `text-lg font-semibold text-emerald-600`

---

*Extracted from Claude conversation exports (conversations-008.json) dated 2026-03-29.*
