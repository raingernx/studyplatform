# Krukraft — Design System

> Design-system reference. For implementation details, prefer the repo design
> system code and current component usage patterns over older exported design
> conversation wording.

## Source of Truth

- App and feature code should import design-system-covered surfaces from `@/design-system`.
- `src/components/ui/*` is a transitional primitive layer for maintenance only, not the default import surface for new app code.
- `src/design-system/README.md` is the repo-local DS inventory and ownership reference.
- `/figma-component-map.md` is the repo-owned manual registry that maps live Figma components and patterns back to canonical code owners.
- `npm run figma-map:check` validates that every `.tsx` file under `src/design-system/primitives` and `src/design-system/components` has a registry row in `/figma-component-map.md`.
- `npm run tokens:audit` validates that `src/design-system/tokens/*`, the barrel in `src/design-system/tokens/index.ts`, and the repo-owned DS inventory docs remain aligned.
- `/design-system.md` is the repo-owned Figma reconstruction and handoff document. It should stay aligned with current DS ownership, token names, and component boundaries.
- Core design-system directories:
  - `src/design-system/tokens/*`
  - `src/design-system/primitives/*`
  - `src/design-system/components/*`
  - `src/design-system/layout/*`
- The design-system barrel exports tokens, primitives, components, and layout helpers from `src/design-system/index.ts`.

## Token / Layout Surfaces

- `src/design-system/tokens/index.ts` exports shared token maps for:
  - colors
  - hero
  - spacing
  - radius
  - typography
- `src/design-system/layout/index.ts` exports the shared layout shell helpers:
  - `Container`
  - `PageContainer`
  - `PageContent`
  - `PageContentWide`
  - `PageContentNarrow`
  - `PageSection`

## Primitive Inventory

- `Avatar`
- `Badge`
- `Button`
- `Card`
- `Input`
- `Modal`
- `RevealImage`
- `SearchInput`
- `Select`
- `Switch`
- `Textarea`
- `ToastProvider` and `useToast`

## Component Inventory

- `EmptyState`
- `ConfirmDialog`
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

## Current Implementation Notes

- `src/design-system/README.md` is now the quick DS source for inventory, directory roles, and ownership notes. Use it before treating older docs or historical thread context as current.
- Reusable Figma component sets now follow a prop-style naming contract for key
  shared surfaces:
  - property names mirror code props where practical, for example `variant`,
    `size`, `align`, `submitButton`
  - lower-case option values are preferred when the backing code prop values are
    lower-case, for example `primary`, `outline`, `sm`, `md`, `flat`, `card`
- `RevealImage` is the shared image primitive for already-sized containers. It wraps `next/image`, keeps images visible by default, and expects the surrounding container to own placeholder/background treatment.
- The image delivery policy is selective:
  - optimizer-compatible HTTPS sources use Next Image
  - bypass happens only for non-optimizable cases surfaced through `shouldBypassImageOptimizer`
- `FormSection` is the canonical DS helper for settings and configuration sections. Its default `flat` variant is intentionally divider-based rather than card-based so form-heavy pages do not drift into box-in-box layouts. Use `variant="card"` only when a section genuinely needs its own elevated surface.
- Dashboard settings and admin settings now both treat `FormSection` as the canonical section contract, with shared route-level skeletons mirroring the same flat geometry from `src/components/skeletons/SettingsPageSkeleton.tsx` and `src/components/skeletons/AdminSettingsPageSkeleton.tsx`.
- `SearchInput` is the canonical DS search primitive with:
  - `default` and `hero` variants
  - clear and loading affordances
  - optional submit-button slot
  - optional leading and trailing adornments
- `LoadingSkeleton` is the canonical DS loading primitive. New loading work should reference it instead of adding ad-hoc placeholder blocks or reviving `src/components/shared/LoadingSkeleton` as an implementation owner.
- `boneyard-js` is available as an optional DOM-capture skeleton workflow, but it complements the DS loading system rather than replacing route-level loading/error/empty-state design. Generated bones are expected under `src/bones`.
- `PriceLabel` is now theme-aware at the DS level (`text-foreground` for paid prices, `text-success-600` for free) so product surfaces can reuse it on both light and dark shells without local color patches.
- Dark theme border tokens now carry a three-step hierarchy:
  - `border-border-subtle` for passive card shells, dashed states, and soft dividers
  - `border-border` for structural chrome such as shell rails, navbars, sidebars, and key panels
  - `border-border-strong` plus `border-input` for interactive controls that need stronger affordance on dark backgrounds
- Marketplace listing active states should no longer depend on light-only
  `primary-50` or white shells in dark mode. Current `/resources` filter rows,
  pills, select controls, and spotlight chips/panels use primary tint overlays
  (`bg-primary/12`, `border-primary/20-30`, `text-primary`) on top of dark
  shells instead of swapping back to white surfaces.
- `src/design-system/tokens/hero.ts` now holds the current marketplace hero support layer for the Figma-led split banner: badge/chip spacing, 16px panel radii, a 56px desktop headline, a 36px mobile/tablet headline, and the premium-panel title/CTA typography. Hero color decisions still come from `src/design-system/tokens/colors.ts`, but the shared semantic layer now includes a thin hero surface contract (`heroBackground`, `heroBackgroundSubtle`, `heroPanel`, `heroPanelForeground`, `heroPanelBorder`, `heroChip`, `heroChipForeground`) so hero UI does not have to masquerade as generic `card` chrome or rely on raw primitives everywhere.
- The live Figma `Krukraft / Colors / Semantic` collection is no longer the old
  19-variable starter set. It now carries a broader alias layer for
  `surface`, `border`, `text`, `action`, `feedback`, `hero`, and `sidebar`
  roles so designers can tune stateful semantics in Figma without editing the
  primitive ramps directly.
- The live Figma variable surface now mirrors the repo token families more
  directly:
  - `Krukraft / Colors / Primitives` now includes `brand`, `primary`,
    `accent`, `highlight`, `neutral`, `surface`, `success`, `warning`,
    `info`, and `danger`
  - `Krukraft / Colors / Theme` mirrors the repo `themeColors` contract and
    chart/sidebar roles with Light/Dark modes
  - `Krukraft / Typography` mirrors repo family/stack/size/line-height/
    letter-spacing/weight token values as variables for reference/editing
  - `Krukraft / Hero` mirrors the repo hero support layer across spacing,
    radius, and typography token groups
- Figma-to-code fidelity work now has an explicit repo workflow:
  - lock one canonical frame / variant before editing code
  - inspect important child nodes individually instead of trusting only the root frame or screenshot
  - inspect the surrounding section shell, not just the component
  - map `Fill container` intent into the right CSS layout behavior for the parent context
  - compare back to the same canonical frame after patching before claiming a 1:1 match
- `ResourceCard` in the design-system component barrel is currently a thin re-export of the marketplace implementation in `src/components/resources/ResourceCard`. Product-card changes may therefore land outside `src/design-system/components` while still affecting the DS surface.
- For Figma/library planning, split DS surfaces into two buckets:
  - generic library surfaces: primitives, layout helpers, and composed generic building blocks such as `FormSection`, `SectionHeader`, `Pagination`, and `EmptyState`
  - product-bound DS exports: `ResourceCard`, `FileUploadWidget`, `NotificationButton`, `PriceBadge`, `PriceLabel`, and `PickerControls`
- Product-bound DS exports may still appear in the `@/design-system` barrel for reuse, but they should map to product pages in Figma rather than Foundations/Primitives.

## Visual Language Cues

- Semantic utility classes center on DS token names such as:
  - `bg-surface-*`
  - `border-surface-*`
  - `text-text-primary`
  - `text-text-secondary`
  - `text-text-muted`
  - `text-primary-*`
- Theme-switching shell chrome should not rely on that semantic layer alone.
  The current `semanticColors` export is still light-only, so app-level surfaces
  that must respond to `light | dark | system` should prefer the CSS-variable
  contract instead:
  - `bg-background`
  - `bg-card`
  - `border-border`
  - `text-foreground`
  - `text-muted-foreground`
  - `bg-secondary` / `bg-accent`
- Current marketplace and admin UI favors:
  - large radii (`rounded-xl` through `rounded-3xl`)
  - soft surface borders instead of heavy shadows
  - image-led cards with concise metadata rows
  - structural skeletons and empty states that match final geometry closely
- Search, marketplace cards, and empty states are now first-class design-system concerns, not isolated one-off widgets.
- Settings, admin inspector, and form-management surfaces should establish hierarchy with section headers, spacing, and divided rows before reaching for nested cards.
- Repeated controls inside one parent surface should normally render as divided rows, not as a stack of mini-cards with duplicated `bg-white + border + rounded-*` chrome.
- Skeletons are expected to use a neutral DS palette. Placeholder fills should avoid brand/accent colors and stay within a maximum of three tones on a given surface.

## Storybook Scope

- Storybook is intentionally scoped to the design-system surface only:
  - `src/design-system/primitives/**/*.stories.*`
  - `src/design-system/components/**/*.stories.*`
- Current local verification paths:
  - `npm run storybook:build`
  - `npm run storybook:smoke`
- Hosted visual review can be layered on the same Storybook surface through `npm run chromatic`, but that command remains opt-in until a `CHROMATIC_PROJECT_TOKEN` is configured for the repo/workspace.
- In this environment, the build-based smoke path is the verified Storybook workflow.

## Figma Prep Notes

- Live DS library file:
  - `Krukraft Design System`
  - [https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf](https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf)
  - The live library now sits in the shared Team project rather than personal
    Drafts.
- Manual repo mapping registry:
  - `/figma-component-map.md`
- Recommended Figma page split:
  - `Foundations`
  - `Primitives`
  - `Composed`
  - `Product / Marketplace`
  - `Product / Admin`
  - `Product / Dashboard`
- The live file now already contains those pages plus foundational docs for:
  - primitive colors
  - semantic colors
  - theme colors
  - expanded semantic aliases for `surface`, `border`, `text`, `action`,
    `feedback`, `hero`, and `sidebar`
  - typography and hero token references
  - spacing
  - radius
  - typography specimens
- Canonical Figma text styles now exist for:
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
- The live `Primitives` page now has real component sets for:
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
- The live `Composed` page now has real component sets for:
  - `FormSection`
  - `SectionHeader`
  - `Pagination`
  - `EmptyState`
  - `RowActions`
  - `ConfirmDialog`
- The live `Product / Marketplace` page now has real component sets for:
  - `HeroBanner`
  - This is the current canonical marketplace surface in Figma while the wider
    marketplace product library continues to evolve incrementally.
- Key reusable component sets in the live file now use code-aligned property
  naming, including:
  - `Button` `variant` / `size`
  - `Badge` `variant`
  - `Card` `size`
  - `FormSection` `variant`
  - `SectionHeader` `align`
  - `Pagination` `size`
  - `ConfirmDialog` `variant`
  - `HeroBanner` `viewport`
- The live `Product / Admin` page now has real component sets for:
  - `FileUploadWidget`
  - `NotificationButton`
  - `PickerControls`
- The live file now keeps flow-level exemplars on owner product pages instead
  of a generic `Patterns` page:
  - `Product / Admin`
    - admin settings anti-nesting
  - `Product / Marketplace`
    - hero banner built from local DS component instances
  - `Product / Dashboard`
    - creator dashboard surface hierarchy
- When a screen needs to prove DS-backed composition but shared-library import
  to a separate file is not available yet, the current preferred workflow is to
  build that exemplar directly on the owning product page inside the DS file
  rather than creating a freehand exploration file or a generic pattern page.
- The current hero flow on `Product / Marketplace` is split into `HeroBanner / Component Set`
  and `HeroBanner / Preview` sections. Edit the component set first, then validate
  the result in the preview block instead of editing instances directly.
- Recommended first Code Connect mappings:
  - `Button`
  - `Badge`
  - `Input`
  - `Select`
  - `Textarea`
  - `Card`
  - `FormSection`
  - `SectionHeader`
  - `Pagination`
- Typography note:
  - the earlier Figma text-style failure was not a permanent platform blocker
  - the current file works with `Noto Sans Thai` using Figma's actual style names (`Regular`, `Medium`, `SemiBold`)
  - `Heading / H3` is the canonical style name in the live file and should stay spaced in docs, scripts, and future automation
  - if typography automation regresses again, re-check the exact available font style names before assuming the API is broken
- Delay `ResourceCard` Code Connect mapping until the marketplace product-card shape is stable enough to be treated as canonical.
- On Professional plan workflows, treat `figma-component-map.md` as the manual substitute for Code Connect and update it whenever a reusable Figma component or its canonical code owner changes.

---

*Refreshed against the repo state on 2026-04-05.*
