## Design System – PaperDock

This document captures the current PaperDock design system as implemented in the Next.js + Tailwind codebase so it can be reconstructed as a full Figma Design System.

---

## Foundations

### Colors

**Core semantic tokens (CSS variables from `globals.css` + Tailwind from `tailwind.config.ts`):**

- **Background**
  - `background` → `bg-background` (`hsl(var(--background))`)
  - `foreground` → `text-foreground` (`hsl(var(--foreground))`)
  - **Usage**: App page background (`body`), default text color.

- **Surface / Card**
  - `card` / `card-foreground` → `bg-card`, `text-card-foreground`
  - `surface.50–950` (`surface-50` … `surface-950`)
  - **Usage**: Cards, subtle panels, soft backgrounds, skeletons.

- **Primary (Ink)**
  - `primary` / `primary-foreground`
  - Tailwind: `bg-primary`, `text-primary-foreground`
  - **Usage**: High-emphasis on dark backgrounds (e.g. dialogs, dark sections), but most primary CTAs use `brand` (see below).

- **Secondary / Muted**
  - `secondary`, `secondary-foreground`, `muted`, `muted-foreground`
  - Common classes: `bg-muted`, `text-muted-foreground`, `bg-surface-50`, `bg-surface-100`
  - **Usage**: Subtle backgrounds, muted labels, quiet UI regions.

- **Border / Input / Ring**
  - `border`, `input`, `ring` → `border-border`, `border-input`, `ring-ring`
  - Extended neutrals: `neutral.50–900`
  - **Usage**: Card and panel borders (`border-border-subtle` via surface scale), input outlines, focus states.

- **Brand (Primary accent system)**
  - Palette: `brand.50–900` (`#eff6ff` → `#1e3a8a`)
  - Typical use:
    - Buttons: `bg-brand-600 hover:bg-brand-700 active:bg-brand-800`
    - Text links: `text-brand-600 hover:text-brand-700`
    - Pills/filters: `bg-brand-50 text-brand-600`
  - **Roles:**
    - Primary CTAs
    - Selected navigation
    - Accent chips and badges

- **Accent (Multi-color accent system)**
  - `accent.DEFAULT`, `accent.foreground`
  - Extended accent slots:
    - `accent.blue`, `accent.blue-light`, `accent.blue-soft`
    - `accent.orange`, `accent.orange-light`, `accent.orange-soft`
    - `accent.yellow`, `accent.yellow-light`, `accent.yellow-soft`
  - **Usage**: Marketing accents, CTA gradients, status badges in pricing.

- **Highlight (Warm accent)**
  - `highlight.50–900`
  - **Usage**: Dashboard quick stats, “highlight” cards, warm emphasis.

- **Text**
  - `text.primary` → primary body/headlines
  - `text.secondary` → supporting copy
  - `text.muted` → meta info, timestamps
  - `text.onDark` → text on dark surfaces
  - Typical classes: `text-text-primary`, `text-text-secondary`, `text-text-muted`

- **Success**
  - Palette: `success.50`, `success.100`, `success.500`, `success.600`, `success.700`
  - Common classes:
    - `bg-success-50 text-success-700` (badges)
    - Toast: `border-emerald-200 bg-emerald-50 text-emerald-600`
  - **Usage**: Success badges, confirmation banners, toast success icon.

- **Warning**
  - Palette: `warning.50`, `warning.100`, `warning.500`, `warning.600`
  - Common classes:
    - `bg-warning-50 text-warning-600`
    - Toast: `border-amber-200 bg-amber-50 text-amber-600`
  - **Usage**: Caution, “archived” chips, soft alerts.

- **Danger / Error**
  - Palette: `danger.50`, `danger.100`, `danger.200`, `danger.500`, `danger.600`
  - Common classes:
    - `bg-red-50 text-red-600`
    - `border-red-100`, `border-red-200`
    - Toast: `border-red-200 bg-red-50 text-red-600`
  - **Usage**: Destructive actions, error banners, form errors, toast errors.

- **Sidebar**
  - `sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring`
  - **Usage**: Sidebar rails in dashboard layouts.

**State colors (typical patterns):**

- **Hover**
  - Buttons:
    - Primary: `hover:bg-brand-700`
    - Secondary/outline: `hover:bg-surface-50 hover:border-surface-300`
    - Ghost: `hover:bg-surface-100 hover:text-text-primary`
  - Links / menu items: `hover:bg-surface-50 hover:text-text-primary`
  - Destructive: `hover:bg-red-100 hover:border-red-200`

- **Active / Pressed**
  - Primary: `active:bg-brand-800`
  - Accent: `active:bg-orange-700`

- **Focus**
  - Buttons: `focus-visible:ring-2 focus-visible:ring-brand-500/50`
  - Inputs: `focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`
  - Ghost/secondary: `focus-visible:ring-surface-400/40`

#### Figma mapping – Colors

Create the following semantic sets:

- **Foundations / Colors / Brand**
  - `Brand / 50–900` (swatches)
  - `Brand / Primary` (brand-600) and `Brand / Hover` (brand-700)
- **Foundations / Colors / Surface**
  - `Surface / 50–900`
  - `Card / Default` (card), `Card / Border` (border)
- **Foundations / Colors / Text**
  - `Text / Primary`, `Text / Secondary`, `Text / Muted`, `Text / On Dark`
- **Foundations / Colors / Feedback**
  - `Success / Background`, `Success / Border`, `Success / Text`
  - `Warning / Background`, `Warning / Border`, `Warning / Text`
  - `Error / Background`, `Error / Border`, `Error / Text`
- **Foundations / Colors / Sidebar**
  - `Sidebar / Background`, `Sidebar / Text`, `Sidebar / Primary`, etc.

---

### Typography

**Font families (from `tailwind.config.ts` + `layout.tsx`):**

- **Sans (body)**: `font-sans`
  - `Inter` (`--font-inter`), `Noto Sans Thai` (`--font-noto-sans-thai`), fallbacks `system-ui`, `sans-serif`.
- **Display (headings)**: `font-display`
  - `Fraunces` (`--font-fraunces`), `Noto Serif Thai` (`--font-noto-serif-thai`), fallback `serif`.
- **Special logo**: `.apotek-logo` (Apotek variable via Adobe Fonts) for the PaperDock logotype.

**Type scale (from `tailwind.config.ts`):**

- `text-hero` → `clamp(2.5rem, 5vw, 3.5rem)` / line-height 1.1
- `text-h1`   → `2.25rem` / line-height 1.2
- `text-h2`   → `1.75rem` / line-height 1.25
- `text-h3`   → `1.25rem` / line-height 1.35
- `text-body-lg` → `1.125rem` / line-height 1.7
- `text-body` → `1rem` / line-height 1.7
- `text-meta` → `0.875rem` / line-height 1.4
- `text-micro` → `0.75rem` / line-height 1.4

**Letterspacing:**

- `tightest` `-0.05em`, `tighter` `-0.03em`, `tight` `-0.02em`
- Eyebrow labels use `text-micro` with `tracking-[0.18em]`.

#### Figma text styles

Create named styles (examples):

- **Headings**
  - `Heading / Hero` → `font-display`, `text-hero`, weight `600–700`, `tracking-tight`.
  - `Heading / H1` → `font-display`, `text-h1`, weight `600`.
  - `Heading / H2` → `font-display`, `text-h2`, weight `600`.
  - `Heading / H3` → `font-display`, `text-h3`, weight `600`.

- **Body**
  - `Body / Default` → `font-sans`, `text-body`, line-height 1.7.
  - `Body / Small` → `text-meta`.
  - `Body / Micro` → `text-micro` (for chips, labels).

- **Special**
  - `Eyebrow / Label` → `font-sans`, `text-micro`, uppercase, `tracking-[0.18em]`, `text-text-muted`.

---

### Spacing

**Base scale:** Tailwind 4px base.

Common sizes in the UI:

- **4px** → `p-1`, `gap-1`, `space-y-1`
- **6px** → `gap-1.5`, chip padding (`px-2.5 py-0.5`)
- **8px** → `p-2`, `gap-2`
- **10px** → `h-10`, `py-2.5` (buttons, pills)
- **12px** → `p-3`, `py-3`
- **16px** → `p-4`, `gap-4`, `px-4`
- **20px** → `py-5`, `gap-5`
- **24px** → `py-6`, `gap-6`
- **32px** → `py-8`, `gap-8`
- **40px** → `py-10`
- **48px** → `py-12`
- **64px+** → `py-16`, `py-20`, `py-24` for sections.

Section helper (`Section` component):

- `spacing="hero"` → `py-24`
- `spacing="normal"` → `py-16`
- `spacing="compact"` → `py-12`

**Grids (critical rules from project):**

- **Marketplace grid** (`ResourceGrid`):
  - `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
  - (Rule doc says: 2/3/4 cols, `gap-6` – Figma should match.)
- **Library grid** (`LibraryGrid`):
  - `grid grid-cols-2 gap-6 lg:grid-cols-3`

In Figma, define spacing tokens:

- `Space / 4`, `8`, `12`, `16`, `20`, `24`, `32`, `40`, `48`, `64`.

---

### Radius

From Tailwind + usage:

- Base Tailwind:
  - `rounded` (4px), `rounded-md` (~6px), `rounded-lg` (~8px), `rounded-xl` (~12px), `rounded-2xl` (~16px), `rounded-3xl` (`1.25rem`), `rounded-4xl` (`1.5rem`).
- Usage patterns:
  - Buttons: `rounded-md` or `rounded-xl` for pills.
  - Cards: `rounded-xl` and `rounded-2xl`.
  - Hero / pricing cards: `rounded-3xl`.
  - Pills / chips: `rounded-full`.

Figma radius scale:

- `Radius / sm` → 4px
- `Radius / md` → 8px
- `Radius / lg` → 12px
- `Radius / xl` → 16px
- `Radius / 2xl` → 20px
- `Radius / 3xl` → 24px
- `Radius / full` → 999px

---

### Shadows

From `tailwind.config.ts`:

- `shadow-card` → `0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.04)`
- `shadow-card-md` → `0 4px 12px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)`
- `shadow-card-lg` → `0 12px 32px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04)`
- `shadow-glow-blue`, `shadow-glow-violet`, `shadow-glow-orange`, `shadow-pricing-featured`
- `shadow-inner-sm` → inset subtle inner shadow.

Usage:

- **Cards / tables / dropdowns**: `shadow-card`, `shadow-card-md`, `shadow-card-lg`.
- **Toast + notification**: `shadow-lg` and `shadow-card-lg`.
- **Hero/pills**: `shadow-sm` for soft elevation.

Figma elevation styles:

- `Elevation / Card / Base` → `shadow-card`
- `Elevation / Card / Hover` → `shadow-card-md`
- `Elevation / Card / High` → `shadow-card-lg`
- `Elevation / Toast` → `shadow-lg` (match CSS).
- `Glow / Brand` → map from `glow-blue` / `glow-violet`.

---

## Components

### Button (`Button`)

- **File**: `src/components/ui/Button.tsx`
- **Props**:
  - `variant`: `primary` (default), `default`, `dark`, `secondary`, `outline`, `ghost`, `danger`, `destructive`, `accent`, `link`.
  - `size`: `sm`, `md`, `lg`, `xs`, `default`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
  - `loading`, `fullWidth`, `asChild`.
- **Base**
  - Layout: `inline-flex` with `gap-1.5`, `text-sm font-medium`.
  - Focus: `focus-visible:ring-2 focus-visible:ring-offset-1`.
- **Primary**
  - Styles: `bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800`.
  - Usage: Main call-to-action.
- **Secondary / Outline**
  - Styles: white surface, border `border-surface-200`, hover `bg-surface-50`.
  - Usage: Secondary CTAs, table actions.
- **Ghost**
  - Styles: `bg-transparent text-text-secondary border-border-subtle`, hover `bg-surface-100`.
  - Usage: icon buttons, low-emphasis controls.
- **Danger / Destructive**
  - Solid red or subtle red background.
  - Usage: destructive actions, “Delete”.
- **Link**
  - `text-brand-600`, underlined on hover.

**Figma variants:**

- Component: `Button`
  - Props:
    - `variant`: `primary | secondary | outline | ghost | danger | destructive | accent | link`
    - `size`: `sm | md | lg | icon`
    - `state`: `default | hover | pressed | disabled | loading`

---

### Input (`Input`, `Textarea`, `SearchInput`)

- **Files**:
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Textarea.tsx`
  - `src/components/ui/SearchInput.tsx`
- **Styles (Input)**:
  - `h-10 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-muted`
  - Focus: `focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20`
  - Disabled: `disabled:bg-surface-50 disabled:opacity-60`
  - Error: `aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20`
- **Adornments**: `leftAdornment` / `rightAdornment` (icons inside input).

**Figma:**

- Component: `Input / Text`
  - Variants:
    - `state`: `default | hover | focused | error | disabled`
    - `adornment`: `none | left | right | both`

---

### Select & Dropdown (`Select`, `Dropdown`)

- **Files**:
  - `src/components/ui/Select.tsx` (simple select wrapper)
  - `src/components/ui/Dropdown.tsx` (Radix dropdown)
- **Styles (Dropdown menu)**:
  - `rounded-xl border border-surface-200 bg-white p-1 shadow-card-lg`
  - Items: `rounded-lg px-3 py-2 text-sm text-text-primary`, hover `bg-surface-100`.
  - Destructive items: `text-red-600 focus:bg-red-50`.

**Figma:**

- `Select`:
  - `state`: `default | open | disabled | error`.
  - `size`: `md`.
- `Dropdown / Menu`:
  - Item variants:
    - `state`: `default | hover | disabled | selected`.
    - `kind`: `default | destructive | checkbox | radio`.

---

### Badge (`Badge`, `StatusBadge`, price/ownership badges)

- **Files**:
  - `src/components/ui/Badge.tsx`
  - `src/components/admin/StatusBadge.tsx`
  - Inline `ResourceBadge` inside `ResourceCard`.
- **Badge variants** (`Badge`):
  - `success`, `warning`, `neutral`, `info`, `featured`, `owned`, `new`, `free`, plus `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
  - Shape: `rounded-full`, `text-xs`, `px-2–2.5`, `py-0.5`.
- **StatusBadge**:
  - `Draft`: `bg-zinc-100 text-zinc-600`.
  - `Published`: `bg-emerald-50 text-emerald-700`.
  - `Archived`: `bg-amber-50 text-amber-700`.

**Figma:**

- Component: `Badge`
  - `variant`: `neutral | success | warning | info | destructive | outline | ghost | link`.
  - `size`: `sm` (standard pill).
- Component: `Badge / ResourceStatus`
  - `status`: `Draft | Published | Archived`.

---

### Card (`Card`, `StatCard`, `SimpleCard`, `PricingCard`)

- **Files**:
  - `src/components/ui/Card.tsx`
  - `src/components/ui/StatCard.tsx`
  - `src/components/ui/SimpleCard.tsx`
  - `src/components/ui/PricingCard.tsx`
- **Card (base)**:
  - `rounded-xl border border-surface-200 bg-white shadow-card`
  - Header/footer slots with subtle borders and `bg-surface-50/60`.
- **StatCard**:
  - `rounded-xl border border-zinc-200 bg-white p-5`, small label + large number.
- **PricingCard**:
  - `rounded-3xl`, gradient border for featured tier, uses brand/accent colors.

**Figma:**

- Component: `Card`
  - `variant`: `default | with-header | with-footer`.
  - `size`: `sm | md`.
- Component: `Card / Stat`
  - `state`: `default`.
- Component: `Card / Pricing`
  - `tier`: `Starter | Pro | Enterprise`.

---

### ResourceCard (`ResourceCard`)

- **File**: `src/components/resources/ResourceCard.tsx`
- **Variants**:
  - `variant`: `marketplace | library | hero | compact (preview)`.
- **Structure:**
  - Preview (16:10 thumbnail) with badge in top-left.
  - Optional hover overlay CTA (“View details”).
  - Body:
    - Tags row (chips, max 2 + `+N` overflow).
    - Title, description.
    - Meta row: author, rating, downloads.
    - Price / actions row.
- **Tags:**
  - Lowercased names, at most 2 visible, extra as `+N`.

**Figma:**

- Component set: `Resource / Card`
  - `variant`: `Marketplace | Library | Hero | Preview`.
  - `state`: `default | hover`.
  - Controls for:
    - `owned`: boolean.
    - `featured`: boolean.
    - `isFree`: boolean.
    - `hasRating`, `hasDownloads`.

---

### Toast (`ToastProvider` + `useToast`)

- **Files**:
  - `src/components/ui/toast-provider.tsx`
  - `src/hooks/use-toast.ts`
- **Types**:
  - `ToastType`: `success | info | warning | error`.
  - Default durations:
    - `success`: 6000ms
    - `info`: 6000ms
    - `warning`: persistent
    - `error`: persistent
- **Behavior**:
  - Bottom-right stack: `fixed bottom-6 right-6`, `gap-3`.
  - Auto-dismiss for timed toasts; persistent for warning/error.
  - Only one success toast visible at a time.
- **Visuals**:
  - Card: `rounded-xl border border-border-subtle bg-white px-4 py-3 shadow-lg`.
  - Icon badge: circular, type-colored (`emerald`, `blue`, `amber`, `red`).

**Figma:**

- Component: `Toast`
  - `type`: `Success | Info | Warning | Error`.
  - `state`: `entering | default | exiting`.
  - Placement suggestion: bottom-right frame with fixed position annotation.

---

### Notification system (`NotificationBell`, `NotificationStack`, `NotificationItem`)

- **Files**:
  - `src/features/notifications/NotificationBell.tsx`
  - `src/components/ui/NotificationButton.tsx`
  - `src/components/admin/NotificationStack.tsx`
  - `src/components/admin/NotificationItem.tsx`
- **Notification bell**:
  - Button: circular, `h-10 w-10 rounded-full border border-surface-200 bg-white shadow-card`.
  - Badge: small red pill `absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 text-xs`.
- **Admin notification stack**:
  - Container: `fixed bottom-6 right-6`, vertical stack (`gap-3`).
  - `NotificationItem`: card with icon (success/info/error), message, optional action link, close button.

**Figma:**

- Component: `Notification / Bell`
  - `count`: 0, 1–9, `9+` (badge variant).
- Component: `Notification / Toast (Admin)`
  - `type`: `Success | Info | Error`.
  - `layout`: fixed bottom-right stack (similar to toast).

---

### Layout components

#### Container & Section

- **Files**:
  - `src/components/ui/Container.tsx`
  - `src/components/ui/Section.tsx`
  - `src/components/ui/SectionHeader.tsx`
- **Container**:
  - `max-w-7xl`, horizontal padding: `px-6 sm:px-8` (or `px-4 sm:px-6` when `narrow`).
- **Section**:
  - Applies vertical padding (`py-24|16|12`) and wraps children in `Container` by default.
- **SectionHeader**:
  - Eyebrow (`text-micro`), `h2` heading, optional description and actions.

**Figma:**

- Frames:
  - `Layout / Section` with variants for `Hero`, `Default`, `Compact` vertical padding.
  - Nested `Section / Header` component with `eyebrow | title | description | actions`.

#### Navbar (`Navbar`)

- **File**: `src/components/layout/Navbar.tsx`
- **Pattern**:
  - Sticky top bar, `h-16`, max width `7xl`, logo left, search center, nav + user menu right.
  - Desktop and mobile variants (drawer).

**Figma:**

- Component: `Navigation / Navbar`
  - `state`: `desktop | mobile`.
  - `auth`: `signed-out | signed-in`.

#### Dashboard shell (`DashboardLayout`, `DashboardShell`, `DashboardSidebar`, `DashboardTopbar`)

- **Files**:
  - `src/components/dashboard/DashboardLayout.tsx`
  - `src/components/dashboard/DashboardShell.tsx`
  - `src/components/dashboard/DashboardSidebar.tsx`
  - `src/components/dashboard/DashboardTopbar.tsx`
- **Pattern**:
  - Layout: `flex h-screen`, left sidebar (`DashboardSidebar`), right main area with topbar and scrollable content.
  - Sidebar: user info card, membership badge, nav sections, footer.

**Figma:**

- Frame: `Patterns / Dashboard`
  - Left: `Sidebar / Dashboard` (nav, user, membership).
  - Top: `Topbar / Dashboard` (title + actions).
  - Main: content grid region.

#### Admin layout (`AdminLayout` + `Sidebar` + `Topbar` + `NotificationStack`)

- **Files**:
  - `src/components/layout/AdminLayout.tsx`
  - `src/components/layout/Sidebar.tsx`
  - `src/components/layout/Topbar.tsx`
  - `src/components/admin/NotificationStack.tsx`
- **Pattern**:
  - `flex min-h-screen bg-surface-50`.
  - Left reusable `Sidebar` with title and nav links.
  - Right column with `Topbar` and main content.
  - `NotificationStack` anchored bottom-right.

**Figma:**

- Frame: `Patterns / Admin Shell`
  - Left: `Sidebar / Admin`.
  - Top: `Topbar / Admin`.
  - Overlay: `Notification / Stack` at bottom-right.

#### Forms (`AdminFormLayout` + `ResourceForm`, `NewResourceForm`)

- **Files**:
  - `src/components/admin/AdminFormLayout.tsx`
  - `src/components/admin/ResourceForm.tsx`
  - `src/app/admin/resources/NewResourceForm.tsx`
  - `src/app/admin/resources/[id]/EditResourceForm.tsx`
- **Layout**:
  - `AdminFormLayout`: two-column grid (`form | sidebar`) on desktop, stacked on mobile.
  - Form content uses `space-y-8` for vertical rhythm.
  - Sidebar contains `ResourceCard` live preview and helper cards.

**Figma:**

- Frame: `Patterns / Create Resource Form`
  - Left: form sections stacked with `space-y-8`.
  - Right: preview card and metadata.

#### Tables (`ResourceTable`, admin tables)

- **Files**:
  - `src/components/admin/ResourceTable.tsx`
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/orders/page.tsx`
  - `src/app/admin/reviews/page.tsx`
- **Pattern**:
  - Wrapper card: `rounded-2xl border border-border-subtle bg-white shadow-card`.
  - Table: `w-full min-w-[Xpx] text-left text-sm`.
  - Header row: uppercase meta text with `text-xs font-medium text-text-secondary`.
  - Body: `tbody` with `divide-y divide-border-subtle/60`.

**Figma:**

- Component set: `Table`
  - `variant`: `Admin / Resources | Admin / Users | Admin / Orders`.
  - Rows: standard, hover, selected.

---

## Patterns

### Patterns / Dashboard

- **Structure:**
  - Sidebar (fixed width).
  - Topbar with title, filters, and quick actions.
  - Main content:
    - Stats row (`StatCard` grid).
    - Activity list / recent items cards.
    - Secondary panels (e.g., membership upsell).

### Patterns / Resource Table

- **Structure:**
  - Header: title, description, “Create Resource” primary button.
  - Filters toolbar: search, status select, category filter (uses `Input`, `Select`, `Tag`/chips).
  - Table: `ResourceTable` with selection checkboxes, bulk actions bar, data rows, pagination.

### Patterns / Create Resource Form

- **Structure:**
  - Admin shell (sidebar + topbar).
  - Content:
    - Header: H2 + subtitle.
    - Form + sidebar (`AdminFormLayout`).
    - Live preview `ResourceCard` in sidebar.
    - Bottom action bar with primary and secondary buttons.

---

## Figma Structure

Recommended Figma page and component organization:

- **Page: Foundations**
  - `Colors / Semantic` (Brand, Surface, Text, Feedback, Sidebar).
  - `Typography / Text Styles` (Hero, H1–H3, Body, Meta, Micro, Eyebrow).
  - `Spacing / Scale` (4–64px tokens).
  - `Radius / Scale` (sm–3xl, full).
  - `Shadows / Elevation` (Card base, hover, high, Toast, Glow).

- **Page: Components**
  - `Buttons / Button` (variants, sizes, states).
  - `Inputs / Text`, `Inputs / Search`, `Inputs / Select`.
  - `Badges / Semantic`, `Badges / Status`.
  - `Cards / Base`, `Cards / Stat`, `Cards / Pricing`.
  - `Resource / Card` (Marketplace, Library, Hero, Preview).
  - `Navigation / Navbar`, `Navigation / Sidebar`.
  - `Overlays / Modal`, `Overlays / Dialog`, `Overlays / Dropdown`.
  - `Feedback / Toast`, `Feedback / Notifications`, `Feedback / UploadManager`.

- **Page: Patterns**
  - `Patterns / Dashboard` (full layout).
  - `Patterns / Admin Shell`.
  - `Patterns / Resource Table` (header, filters, table, pagination).
  - `Patterns / Create Resource Form`.
  - `Patterns / Marketplace` (hero search, filters sidebar, resource grid).

Each Figma component should reference the corresponding code file in its description, e.g.:

- Button: `src/components/ui/Button.tsx`
- ResourceCard: `src/components/resources/ResourceCard.tsx`
- Navbar: `src/components/layout/Navbar.tsx`
- Toast: `src/components/ui/toast-provider.tsx` + `src/hooks/use-toast.ts`

