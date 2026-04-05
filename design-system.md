## Krukraft Design System

This document is the repo-owned handoff for rebuilding or connecting Krukraft's
design system in Figma. It is intentionally shorter than a full component spec
and should stay aligned with the actual codebase.

When this file conflicts with code, the code wins.

---

## Source Of Truth

Priority order:

1. `src/design-system/*`
2. `src/components/resources/ResourceCard.tsx` for the marketplace card
3. `figma-component-map.md`
4. `src/design-system/README.md`
5. `krukraft-ai-contexts/06-design-system.md`
6. this file

Live Figma library file:

- `Krukraft Design System`
- [https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf](https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf)
- The live library now sits in the shared Team project, not in personal Drafts.
- Manual repo mapping registry:
  - `figma-component-map.md`
- Registry validation:
  - `npm run figma-map:check`
- Token validation:
  - `npm run tokens:audit`

Do not use `src/components/ui/*` as the default design-system source. Those
files are compatibility shims or implementation details unless the primitive
layer itself is being maintained.

---

## Current Design-System Structure

### Tokens

- `src/design-system/tokens/colors.ts`
- `src/design-system/tokens/spacing.ts`
- `src/design-system/tokens/radius.ts`
- `src/design-system/tokens/typography.ts`
- `src/design-system/tokens/hero.ts`

### Primitives

- `Avatar`
- `Badge`
- `Button`
- `Card`
- `Dropdown`
- `Input`
- `LoadingSkeleton`
- `Modal`
- `RevealImage`
- `SearchInput`
- `Select`
- `Switch`
- `Textarea`
- `ToastProvider`
- `useToast`

### Composed Components

- `ConfirmDialog`
- `EmptyState`
- `FileUploadWidget`
- `FormSection`
- `NotificationButton`
- `Pagination`
- `PickerControls`
- `PriceBadge`
- `PriceLabel`
- `ResourceCard`
- `RowActions`
- `SectionHeader`

### Layout

- `Container`
- `PageContainer`
- `PageContent`
- `PageContentWide`
- `PageContentNarrow`
- `PageSection`
- `SidebarContainer`
- `SidebarNav`
- `SidebarSection`
- `SidebarSectionLabel`
- `IconWrapper`
- `SidebarBadge`
- `SidebarItem`
- `SidebarFooter`
- `Divider`
- `NavGroup`

---

## Figma Ownership Rules

### Treat as generic design-system library components

- `Button`
- `Badge`
- `Card`
- `Input`
- `Textarea`
- `Select`
- `Switch`
- `Dropdown`
- `Avatar`
- `Modal`
- `EmptyState`
- `FormSection`
- `Pagination`
- `SectionHeader`
- `RowActions`
- `LoadingSkeleton`
- layout helpers under `src/design-system/layout/*`

For reusable Figma component sets under these surfaces, keep the property naming
contract close to code:

- use prop-style property names such as `variant`, `size`, `align`,
  `submitButton`
- prefer lower-case option values when the code prop values are lower-case, such
  as `primary`, `outline`, `sm`, `md`, `flat`, `card`
- if a Figma-only representational state is needed, name it explicitly as a UI
  state rather than overloading a real prop name

### Treat as product-bound components, not generic library foundations

- `ResourceCard`
- `FileUploadWidget`
- `NotificationButton`
- `PriceBadge`
- `PriceLabel`
- `PickerControls`

These may still live in the DS barrel for reuse, but they should be organized in
Figma under product or workflow pages rather than Foundations/Primitives.

When a screen needs to prove DS-backed composition before shared-library import
across files is available, prefer building the exemplar on the owning product
page inside the DS file itself rather than drawing a detached mockup in a
separate exploration file.

### Do not model as library source of truth

- `src/components/ui/*`
- page-level feature layouts under `src/app/*`
- one-off feature wrappers or compatibility re-exports

---

## Foundations To Mirror In Figma

### Color Collections

Create one variable collection named `Krukraft / Colors` with these groups:

- `Brand / 50-900`
- `Primary / 50-900`
- `Accent / 50-900 + named accents`
- `Highlight / 50-900`
- `Surface / 50-950`
- `Neutral / 50-900`
- `Text / Primary`
- `Text / Secondary`
- `Text / Muted`
- `Feedback / Success / 50,100,500,600,700`
- `Feedback / Warning / 50,100,500,600,700`
- `Feedback / Info / 50,100,500,600,700`
- `Feedback / Danger / 50,100,200,500,600`
- `Sidebar / Background`
- `Sidebar / Foreground`
- `Sidebar / Primary`
- `Sidebar / Accent`

Prefer semantic bindings in layouts and components:

- `background`
- `card`
- `surface`
- `border`
- `textPrimary`
- `textSecondary`
- `textMuted`
- `primary`
- `heroBackground`
- `heroBackgroundSubtle`
- `heroPanel`
- `heroPanelForeground`
- `heroPanelBorder`
- `heroChip`
- `heroChipForeground`
- `success`
- `warning`
- `info`
- `danger`

The live semantic color collection is intentionally broader than the minimal
seed set so designers can retune common states without editing primitive ramps
directly. The current alias families in `Krukraft / Colors / Semantic` are:

- `background`
- `card`
- `surface`
  - `default`, `elevated`, `subtle`, `muted`, `inverse`
- `border`
  - `default`, `subtle`, `strong`, `inverse`, `brand`, `focus`
- `text`
  - `primary`, `secondary`, `muted`, `inverse`, `brand`, `on-brand`,
    `disabled`
- `action`
  - `primary`, `primary-hover`, `primary-active`, `secondary`,
    `secondary-hover`, `ghost-hover`, `danger`
- `feedback`
  - base tone plus `subtle`, `strong`, and `foreground` aliases for
    `success`, `warning`, `info`, and `danger`
- `hero`
  - existing hero roles plus `eyebrow`, `accent`, `chip-border`,
    `artwork-tint`
- `sidebar`
  - `background`, `foreground`, `primary`, `primary-foreground`, `accent`,
    `accent-foreground`, `border`, `ring`

Do not introduce a separate hero-only color palette or collection in Figma.
Hero-specific work should use the shared color system and, when needed, a thin
set of hero semantics inside that same semantic collection so hero sections do
not have to pretend they are generic cards.

For code-facing theme parity, the live file also carries a
`Krukraft / Colors / Theme` collection with Light/Dark modes for the repo's
`themeColors` contract and chart/sidebar color roles. This collection is a
Figma mirror of code theme tokens, not the primary semantic design surface.

### Typography Styles

Create a `Krukraft / Typography` collection with these style names:

- `Display / Display`
- `Display / Hero`
- `Heading / H1`
- `Heading / H2`
- `Heading / H3`
- `Body / Large`
- `Body / Default`
- `Body / Small`
- `Meta / Default`
- `Label / Caption`
- `Label / Micro`

Map from `src/design-system/tokens/typography.ts`:

- `display`
- `hero`
- `h1`
- `h2`
- `h3`
- `bodyLg`
- `body`
- `small`
- `meta`
- `caption`
- `micro`

The live file now also mirrors the repo typography token data in the
`Krukraft / Typography` variable collection using grouped variable names for:

- `family/*`
- `stack/*`
- `size/*`
- `line-height/*`
- `letter-spacing/*`
- `weight/*`

These variables are a repo-reference/edit surface. Figma text styles remain the
canonical typography application surface for components and page work.

The current repo favors:

- Thai-safe sans for UI and body
- semibold headings
- muted meta text instead of dense visual chrome
- uppercase micro labels only for eyebrow/status/section framing

Known Figma runtime caveat:

- text specimen blocks are in the file already and canonical Figma text styles now exist for the core ramp
- the earlier `TypeError: object is not extensible` issue was not a hard platform blocker; the failing path came from an earlier bad style-creation attempt and incorrect font-style assumptions
- use `Noto Sans Thai` with the actual available style names in Figma (`Regular`, `Medium`, `SemiBold`) when extending the ramp
- the `Heading / H3` style name is now normalized in the live file; use the spaced form consistently in docs and future automation

### Spacing And Radius

Create collections:

- `Krukraft / Spacing`
- `Krukraft / Radius`
- `Krukraft / Hero`

Spacing tokens from code:

- `xs = 4`
- `sm = 8`
- `md = 12`
- `lg = 16`
- `xl = 24`
- `2xl = 32`
- `3xl = 48`

Radius tokens from code:

- `sm = 8`
- `md = 12`
- `lg = 16`
- `xl = 16`
- `3xl = 20`
- `4xl = 24`
- `full = 9999`

Hero support tokens from code now also live in `Krukraft / Hero` using:

- `spacing/*`
- `radius/*`
- `typography/*`

---

## Component Mapping Guidance

## Current Figma Progress

The live Figma file already has these pages scaffolded:

- `Cover`
- `Getting Started`
- `Foundations`
- `Primitives`
- `Composed`
- `Product / Marketplace`
- `Product / Admin`
- `Product / Dashboard`

The `Foundations` page currently includes:

- primitive and semantic color docs
- theme color docs for the code-facing theme contract
- expanded semantic color aliases for `surface`, `border`, `text`, `action`,
  `feedback`, `hero`, and `sidebar`
- repo-mirrored typography and hero variable references
- spacing docs
- radius docs
- typography specimen blocks
- canonical text styles for:
  - `Display / Display`
  - `Display / Hero`
  - `Heading / H1`
  - `Heading / H2`
  - `Heading / H3`
  - `Body / Large`
  - `Body / Default`
  - `Body / Small`
  - `Meta / Default`
  - `Label / Caption`
  - `Label / Micro`

The `Primitives` page currently includes real component sets for:

- `Button`
- `Badge`
- `Input`
- `Select`
- `Textarea`
- `Card`
- `Switch`
- `Dropdown`
- `Avatar`
- `Modal`
- `LoadingSkeleton`

This is ahead of the repo docs by design. When adding more Figma primitives, prefer extending the existing live file instead of recreating a second library file.

The `Composed` page currently includes real component sets for:

- `FormSection`
- `SectionHeader`
- `Pagination`
- `EmptyState`
- `RowActions`
- `ConfirmDialog`

The `Product / Marketplace` page currently includes:

- `HeroBanner`

This is the current canonical marketplace exemplar in the live Figma file.
Other marketplace product exports still exist in code, but their dedicated
Figma library surfaces are being rebuilt incrementally around the current hero
system rather than being represented as stable Figma exports today.

The `Product / Admin` page currently includes:

- `FileUploadWidget`
- `NotificationButton`
- `PickerControls`

The live product pages now contain exemplar layout compositions for:

- `Product / Admin`
  - admin settings
- `Product / Marketplace`
  - hero banner
- `Product / Dashboard`
  - creator dashboard

### Primitives

#### Button

- Source: `src/design-system/primitives/Button.tsx`
- Variant axis:
  - `primary`
  - `secondary`
  - `outline`
  - `ghost`
  - `danger`
  - `destructive`
  - `accent`
  - `link`
- Size axis:
  - `xs`
  - `sm`
  - `md`
  - `lg`
  - `icon`

#### Badge

- Source: `src/design-system/primitives/Badge.tsx`
- Common semantic variants:
  - `neutral`
  - `success`
  - `warning`
  - `info`
  - `destructive`
  - `outline`
  - `ghost`
- Product-specific variants exist in code, but keep the core library set small in
  Figma and add product variants only where the product page needs them.

#### Input / Select / Textarea

- Sources:
  - `src/design-system/primitives/Input.tsx`
  - `src/design-system/primitives/Select.tsx`
  - `src/design-system/primitives/Textarea.tsx`
- Shared field contract:
  - white surface
  - subtle border
  - primary focus ring
  - semantic danger state
  - optional hint
  - optional error

#### Card

- Source: `src/design-system/primitives/Card.tsx`
- Use as the base elevated surface, not as a universal nesting tool.
- In settings/admin flows, prefer `FormSection` and divided rows before placing
  cards inside cards.

#### LoadingSkeleton

- Source: `src/design-system/primitives/LoadingSkeleton.tsx`
- Skeletons should stay neutral and use no more than three tones on one surface.
- Do not add accent or promotional colors to loading placeholders.

### Composed Components

#### FormSection

- Source: `src/design-system/components/FormSection.tsx`
- `flat` is the default variant and should be the canonical settings/admin form
  section pattern in Figma.
- `card` should exist only for sections that truly need a separate elevated
  surface.

#### SectionHeader

- Source: `src/design-system/components/SectionHeader.tsx`
- Use for page and major-section framing.
- It should be the default handoff component for title + description + actions.

#### Pagination

- Source: `src/design-system/components/Pagination.tsx`
- Build as a reusable navigation component, not per-table variants.

#### ResourceCard

- Source of truth: `src/components/resources/ResourceCard.tsx`
- DS barrel re-export: `src/design-system/components/ResourceCard.tsx`
- Treat as a product card family in Figma under a marketplace/product page.
- Do not treat it as a generic base card.

---

## Layout And Pattern Rules For Figma

- Prefer one dominant surface per screen area.
- Avoid card-inside-card composition unless the inner card has a distinct
  semantic role.
- Settings and admin inspector screens should start with:
  - `SectionHeader`
  - flat `FormSection`
  - divided rows
  - semantic badges and helper text
- Skeletons must mirror final geometry closely.
- Hero and discover loading states must stay neutral, not brand-tinted.

## Figma Implementation Fidelity Workflow

When translating Figma into code, do not rely on screenshots or top-level
frames alone.

- lock one canonical Figma frame or variant before editing code
- inspect important child nodes individually:
  - fills
  - strokes
  - radius
  - padding
  - gap
  - width / height
  - text styles
  - local overrides
- inspect the section shell too; stage background, outer padding, container
  width, and spacing to adjacent content are part of fidelity
- if both a reusable component and a preview/example exist in Figma, decide
  which one is the implementation source before patching code
- if Figma uses `Fill container`, map that intent to the correct CSS behavior
  for the parent layout instead of assuming `height: 100%`
- if a node uses a local Figma override, preserve the visual result first and
  only promote it into DS tokens/styles if it proves reusable
- after implementation, compare back to the same canonical frame again before
  calling the work matched

Do not describe a Figma implementation as exact or 1:1 unless that node-level
inspection loop has happened.

Recommended Figma pages:

- `Foundations`
- `Primitives`
- `Composed`
- `Product / Marketplace`
- `Product / Admin`
- `Product / Dashboard`

Recommended component naming:

- `Primitive / Button`
- `Primitive / Input`
- `Primitive / Select`
- `Primitive / Textarea`
- `Primitive / Badge`
- `Primitive / Card`
- `Composed / FormSection`
- `Composed / SectionHeader`
- `Composed / Pagination`
- `Product / ResourceCard`
- `Flow / Admin Settings`
- `Flow / Marketplace Discover`
- `Flow / Hero Banner`

---

## Code Connect Priorities

Best first mappings when Figma Code Connect is added:

1. `Button`
2. `Badge`
3. `Input`
4. `Select`
5. `Textarea`
6. `Card`
7. `FormSection`
8. `SectionHeader`
9. `Pagination`

Map `ResourceCard` only after the marketplace/product page structure is settled.

---

## Handoff Checklist

Before treating a Figma component as canonical for code:

- confirm the matching source file still lives under `src/design-system/*`
- confirm it is not a compatibility wrapper in `src/components/ui/*`
- confirm the token names match `src/design-system/tokens/*`
- confirm loading/skeleton states are included for major patterns
- confirm the component is generic enough to live in a shared Figma library

If any answer is no, keep it on a product or exploration page instead of the
core design library.
