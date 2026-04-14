# Krukraft Design System

This directory is the canonical UI source of truth for shared Krukraft
surfaces.

## Import Rules

- App and feature code should import shared UI from `@/design-system`.
- Do not add new primitives to `src/components/ui`.
- Treat `src/components/ui/*` as transitional implementation details or
  compatibility re-exports.

## Directory Roles

- `tokens/`
  - semantic colors, spacing, radius, typography, hero support tokens
- `primitives/`
  - low-level reusable controls and feedback surfaces
- `components/`
  - reusable composed components built from primitives
- `layout/`
  - shared page and navigation layout helpers

## Current Inventory

### Tokens

- `colors.ts`
- `hero.ts`
- `radius.ts`
- `spacing.ts`
- `typography.ts`

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
- `DataPanelTable`
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

## Ownership Notes

- `ResourceCard` is exported from the DS barrel but its implementation owner is
  `src/components/resources/ResourceCard.tsx`. Treat it as a marketplace product
  component, not as a generic foundation.
- `FileUploadWidget`, `NotificationButton`, `PriceBadge`, `PriceLabel`, and
  `PickerControls` are DS-exposed composed components, but they remain more
  workflow-bound than true primitives.
- `DataPanelTable` is the reusable dashboard/admin shell for
  title/description/actions + optional toolbar + table/empty-state content.
  Keep data fetching, column schema, row rendering, and business actions
  route-owned.
- `FormSection` is the canonical settings/admin form layout helper. Prefer its
  default `flat` variant before introducing nested cards.
- `LoadingSkeleton` is the canonical skeleton primitive. Placeholders should
  stay neutral and use no more than three tones on a single surface.
- `boneyard-js` is installed as an optional DOM-capture workflow for
  pixel-matched skeleton generation. Treat it as a complement to the existing
  `LoadingSkeleton` + route-level fallback system, not as permission to skip
  the repo's loading/fallback parity rules. Generated bones should live under
  `src/bones`, and the current convenience commands are
  `npm run skeleton:boneyard:build` and
  `npm run skeleton:boneyard:build:force`.
  The app now bootstraps generated bones through
  `src/components/providers/BonesRegistryBootstrap.tsx`, which calls the safe
  helper in `src/bones/index.ts` on the client instead of importing the
  registry as a root-layout side effect, and the current pilot capture route
  is `src/app/dev/bones/page.tsx`, which renders a
  non-loading preview surface so `boneyard` can snapshot the live DOM into the
  current catalog chrome pilots (`ResourcesCatalogSearchSkeleton`,
  `ResourcesCatalogControlsSkeleton`) plus `HeroSearch` dropdown-state pilots
  (quick browse, top matches, empty-result recovery), the
  `SearchRecoveryPanel` empty-result surface, the
  `ResourcesDiscoverPersonalizedSection` recommendation/because-you-studied/
  level-based discover block, settings/admin/creator-apply route-shell
  pilots, creator dashboard route shells, the creator resource form loading
  shell, the admin resource form shell, the creator new-resource route shell,
  the admin analytics overview/recommendations/ranking/ranking-experiment/
  purchases/creator-activation route shells,
  the auth login shell, the user dashboard overview/library/downloads/
  purchases/subscription/resources-redirect route shells, and the
  current generated sets:
  `src/bones/admin-analytics-creator-activation.bones.json` and
  `src/bones/admin-analytics-overview.bones.json` and
  `src/bones/admin-analytics-purchases.bones.json` and
  `src/bones/admin-analytics-ranking-experiment.bones.json` and
  `src/bones/admin-analytics-ranking.bones.json` and
  `src/bones/admin-analytics-recommendations.bones.json` and
  `src/bones/admin-settings-page.bones.json` and
  `src/bones/admin-resource-form.bones.json` and
  `src/bones/creator-apply-page.bones.json` and
  `src/bones/creator-dashboard-analytics.bones.json` and
  `src/bones/creator-dashboard-overview.bones.json` and
  `src/bones/creator-dashboard-profile.bones.json` and
  `src/bones/creator-dashboard-resources.bones.json` and
  `src/bones/creator-dashboard-sales.bones.json` and
  `src/bones/creator-resource-form.bones.json` and
  `src/bones/creator-resource-new-route.bones.json` and
  `src/bones/dashboard-downloads.bones.json` and
  `src/bones/dashboard-library.bones.json` and
  `src/bones/dashboard-overview.bones.json` and
  `src/bones/dashboard-purchases.bones.json` and
  `src/bones/dashboard-resources-redirect.bones.json` and
  `src/bones/dashboard-subscription.bones.json` and
  `src/bones/hero-search-empty.bones.json` and
  `src/bones/hero-search-quick-browse.bones.json` and
  `src/bones/hero-search-results.bones.json` and
  `src/bones/login-form.bones.json` and
  `src/bones/purchase-card.bones.json` and
  `src/bones/resource-card.bones.json` and
  `src/bones/resource-detail-shell.bones.json` and
  `src/bones/resources-catalog-controls.bones.json` and
  `src/bones/resources-catalog-search.bones.json` and
  `src/bones/resources-discover-personalized.bones.json` and
  `src/bones/resources-discover-sections.bones.json` and
  `src/bones/resources-intro-discover.bones.json` and
  `src/bones/resources-intro-listing.bones.json` and
  `src/bones/resources-listing-shell.bones.json` and
  `src/bones/resources-route-shell.bones.json` and
  `src/bones/search-recovery-panel.bones.json` and
  `src/bones/settings-page.bones.json`,
  without depending on a flaky route loading race.
- Dark-theme borders now use a three-step hierarchy instead of one shared
  bright stroke:
  - `border-border-subtle` for passive card shells, dashed placeholders, and soft dividers
  - `border-border` for structural chrome like navbar/sidebar/purchase rails
  - `border-border-strong` and `border-input` for interactive controls
- Dark-shell marketplace listing active states should use theme-aware emphasis
  surfaces such as `bg-accent` plus `border-primary/20-30` and `text-primary`,
  rather than reintroducing light-only `primary-50` or white shells for
  selected filter rows, selected pills, sort/price selects, or spotlight
  chips/panels.
- Status chips and feedback badges that need to survive light and dark shells
  should prefer theme-aware surfaces such as `bg-accent` plus semantic border
  and text color, instead of fixed `*-50` backgrounds with `*-700` text that
  only read correctly on light surfaces.
- The same rule applies to `featured` badges used as route labels or callout
  chips: keep the shell surface theme-aware (`bg-accent`) and carry the
  emphasis through semantic border/text color rather than pale yellow panels.
- Hero surfaces are not treated as generic `card` surfaces. Use the shared
  semantic color layer for hero-specific outer background/panel/chip roles
  (`heroBackground`, `heroBackgroundSubtle`, `heroPanel`,
  `heroPanelForeground`, `heroPanelBorder`, `heroChip`,
  `heroChipForeground`) instead of rebinding hero UI to `card`.

## Figma Handoff

- Live Figma library file:
  - `Krukraft Design System`
  - [https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf](https://www.figma.com/design/D3cCyIYFnHDlY34eCqDURf)
  - The library now lives in the shared Team project, not in personal Drafts.
  - The live variable collections now mirror the repo token families more
    directly:
    `Krukraft / Colors / Primitives`, `Krukraft / Colors / Semantic`,
    `Krukraft / Colors / Theme`, `Krukraft / Spacing`, `Krukraft / Radius`,
    `Krukraft / Typography`, and `Krukraft / Hero`.
  - The live `Krukraft / Colors / Semantic` collection now includes a wider
    alias layer on top of the primitive scales so designers can tune semantics
    without editing raw ramps directly. Current semantic groups are:
    `background`, `card`, `surface`, `border`, `text`, `action`, `feedback`,
    `hero`, and `sidebar`.
- Manual mapping registry:
  - `/figma-component-map.md`
- Registry validation:
  - `npm run figma-map:check`
- Token validation:
  - `npm run tokens:audit`
- The live `Krukraft / Colors / Primitives` collection now includes the repo
  scale families for `brand`, `primary`, `accent`, `highlight`, `neutral`,
  `surface`, `success`, `warning`, `info`, and `danger`.
- The live `Krukraft / Typography` collection now mirrors repo-authored font
  family, stack, size, line-height, letter-spacing, and weight token values as
  variables for reference/editing, while canonical text styles remain the
  implementation-facing typography surface in Figma.
- The live `Krukraft / Hero` collection now mirrors the repo hero support layer
  from `src/design-system/tokens/hero.ts` across spacing, radius, and
  typography token groups.
- Repo-wide Figma handoff guidance lives in `/design-system.md`.
- AI/system-level context lives in
  `krukraft-ai-contexts/06-design-system.md`.
- When tokens, DS ownership, or component inventories change materially, update
  the registry and both docs in the same work session.
- `npm run figma-map:check` currently enforces registry coverage for every
  `.tsx` file under `src/design-system/primitives` and
  `src/design-system/components`.
- `npm run tokens:audit` currently enforces that token source files,
  `src/design-system/tokens/index.ts`, and the repo-owned DS docs stay aligned.
- Reusable Figma component-set property names should mirror code prop names
  where practical, using lower-case option values for code-backed variants such
  as `variant=primary`, `size=sm`, and `align=left`.
- For Figma implementation work, use this fidelity order instead of patching
  from screenshots alone:
  - lock one canonical frame / variant
  - inspect important child nodes individually
  - inspect the surrounding section shell
  - patch code
  - sync skeleton/loading geometry
  - compare back to the same canonical frame again
- Do not call a component or section “matched” or “1:1” unless that node-level
  inspection loop has happened.
- The live Figma `Primitives` page already has real component sets for:
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
- The live Figma `Composed` page already has real component sets for:
  - `FormSection`
  - `SectionHeader`
  - `Pagination`
  - `EmptyState`
  - `RowActions`
  - `ConfirmDialog`
- The live Figma `Product / Marketplace` page already has real component sets
  for:
  - `HeroBanner`
  - This remains the canonical marketplace exemplar while the rest of the
    marketplace library continues to be rebuilt incrementally.
- The live Figma `Product / Admin` page already has real component sets for:
  - `FileUploadWidget`
  - `NotificationButton`
  - `PickerControls`
- The live Figma file now keeps flow exemplars on owner product pages instead of
  a generic `Patterns` page:
  - `Product / Admin`
    - admin settings
  - `Product / Marketplace`
    - hero banner
  - `Product / Dashboard`
    - creator dashboard
- The current hero exemplar lives on `Product / Marketplace` and was rebuilt
  inside the DS file itself from local component instances instead of a
  separate exploration file, because that is the only reliable DS-real workflow
  until shared-library import across files is enabled.
- The current hero flow is organized into `HeroBanner / Component Set` and
  `HeroBanner / Preview` sections so source editing and verification stay
  separate on the canvas.
- Canonical Figma text styles now exist for the core Krukraft type ramp using
  `Noto Sans Thai` (`Regular`, `Medium`, `SemiBold`).
