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
- `DataPanelTable`
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
- `DataPanelTable` is the canonical DS shell for dashboard/admin data panels that
  need title + description + top actions + optional toolbar above table or
  empty-state content. Keep filters, column definitions, row rendering, and
  business actions route-owned.
- `SearchInput` is the canonical DS search primitive with:
  - `default` and `hero` variants
  - clear and loading affordances
  - optional submit-button slot
  - optional leading and trailing adornments
- `LoadingSkeleton` is the canonical DS loading primitive. New loading work should reference it instead of adding ad-hoc placeholder blocks or reviving `src/components/shared/LoadingSkeleton` as an implementation owner.
- Manual grouped route shells now also cover the remaining non-resource product/admin informational routes:
  - `src/components/skeletons/PublicProductRouteSkeletons.tsx` for checkout status, membership, support, and legal-policy pages
  - `src/components/skeletons/AdminCoreRouteSkeletons.tsx` for `/admin`, activity, audit, categories, orders, reviews, tags, and users
- Marketplace runtime-critical shells now keep boneyard only on the preview/export path:
  - `src/components/marketplace/ResourcesCatalogControlsSkeleton.tsx` returns manual search/controls placeholders for runtime and reserves `Skeleton` only for `*BonesPreview`
  - `src/components/resources/ResourceCardSkeleton.tsx` returns the manual card geometry directly at runtime
  - `src/components/skeletons/ResourcesRouteSkeleton.tsx` now wires runtime `Navbar` slots to those manual search/controls skeletons instead of the preview variants
- Runtime route-level and Suspense-critical skeletons should stay visually
  neutral even when the resolved UI or the capture previews use richer accent,
  recovery, success, or marketing treatments. Default loading shells should
  not inherit checkout-success banners, personalized emphasis rails, or
  selected-state tints unless the route state guarantees that exact condition.
- Dark-shell selected rows and feedback chips should prefer theme-aware
  emphasis surfaces such as `bg-accent + border-primary/20-30 + text-primary`
  or `bg-accent + border-success-500/25 + text-success-600` instead of fixed
  light-only `*-50` backgrounds with `*-700` text. Shared DS `Sidebar` active
  rows and `Badge` status/info variants now follow that rule so feature shells
  like Dashboard V2 can reuse them without introducing light-theme artifacts
  in future dark mode.
- `Badge.featured` follows the same constraint when used as a route label or
  creator callout chip: keep the surface on `bg-accent` and express emphasis
  through highlight-colored text/border instead of pale yellow fill on dark
  shells.
- `boneyard-js` is available as an optional DOM-capture skeleton workflow, but it complements the DS loading system rather than replacing route-level loading/error/empty-state design. Generated bones are expected under `src/bones`.
- Generated bones are now bootstrapped by the client-only
  `src/components/providers/BonesRegistryBootstrap.tsx`, which calls the safe
  helper in `src/bones/index.ts` to import the generated `registry.js` only on
  the client when it exists. This replaces the old root-layout side-effect
  import so local development and Fast Refresh do not pay the same blast radius
  every time the bones registry changes.
- The current live pilots are `ResourceCardSkeleton`,
  `ResourcesCatalogSearchSkeleton`,
  `ResourcesCatalogControlsSkeleton`,
  `HeroSearch` dropdown preview states,
  `SearchRecoveryPanel` preview state,
  `SettingsPageSkeleton`,
  `AdminSettingsPageSkeleton`,
  `CreatorApplyPageSkeleton`,
  `ResourcesIntroSectionSkeleton`,
  `ResourcesDiscoverSectionsSkeleton`,
  `ResourcesDiscoverPersonalizedSection` preview state,
  `ResourcesContentFallback` (listing mode),
  `PurchaseCardSkeleton`, plus the route-level
  `ResourcesRouteSkeleton` and `ResourceDetailLoadingShell`:
  they now wrap generated bone sets with manual
  `LoadingSkeleton` fallbacks, while the dedicated capture page at
  `src/app/dev/bones/page.tsx` renders non-loading preview variants for
  `boneyard` to snapshot into `src/bones/resource-card.bones.json` and
  `src/bones/resources-discover-sections.bones.json` and
  `src/bones/resources-listing-shell.bones.json` and
  `src/bones/resources-route-shell.bones.json` and
  `src/bones/purchase-card.bones.json`, plus
  `src/bones/resource-detail-shell.bones.json`.
  `ResourcesCatalogSearchSkeleton` and
  `ResourcesCatalogControlsSkeleton` now also expose dedicated preview variants
  on the capture page so navbar/resources chrome can be promoted into generated
  bones when runtime capture is available.
  `HeroSearch` now also exports dedicated preview variants for quick-browse,
  top-match, and empty-result dropdown states so search overlays can be
  promoted into generated bones without relying on live fetch state.
  `SearchRecoveryPanel` now also exposes a dedicated preview variant on the
  capture page so the no-results recovery surface can be promoted into
  generated bones without waiting for a live empty-search response.
  `ResourcesDiscoverPersonalizedSection` now also exposes a dedicated preview
  variant on the capture page so the personalized recommendation / because-you-
  studied / level-based discover geometry can be promoted into generated bones
  without depending on viewer-state fetches.
  `SettingsPageSkeleton`, `AdminSettingsPageSkeleton`, and
  `CreatorApplyPageSkeleton` now also expose dedicated preview variants on the
  capture page so account/admin/creator onboarding shells can be promoted into
  generated bones without relying on route loading boundaries, and they now
  capture into `src/bones/settings-page.bones.json`,
  `src/bones/admin-settings-page.bones.json`, and
  `src/bones/creator-apply-page.bones.json`.
  `CreatorResourceFormLoadingShell` now also exposes a dedicated preview
  variant on the capture page so creator resource create/edit route shells can
  be promoted into generated bones, and it now captures into
  `src/bones/creator-resource-form.bones.json`.
  `LoginFormSkeleton` now also exposes a dedicated preview variant on the
  capture page so the auth login shell can be promoted into generated bones,
  and it now captures into `src/bones/login-form.bones.json`.
  `src/app/(dashboard)/dashboard/creator/(protected)/*/loading.tsx` route
  shells now reuse the shared
  `CreatorDashboardRouteSkeletons.tsx` boneyard layer for overview,
  analytics, resources, sales, and profile states, and those now capture into
  `src/bones/creator-dashboard-overview.bones.json`,
  `src/bones/creator-dashboard-analytics.bones.json`,
  `src/bones/creator-dashboard-resources.bones.json`,
  `src/bones/creator-dashboard-sales.bones.json`, and
  `src/bones/creator-dashboard-profile.bones.json`.
  `CreateResourceForm.tsx` now reuses the shared
  `AdminResourceFormLoadingShell` hybrid shell instead of carrying its own
  inline loading geometry, and that shell now captures into
  `src/bones/admin-resource-form.bones.json`.
  `src/app/admin/analytics/*/loading.tsx` plus
  `src/app/admin/analytics/loading.tsx` now reuse the shared
  `AdminAnalyticsRouteSkeletons.tsx` boneyard layer for overview,
  recommendations, ranking, ranking experiment, purchases, and creator
  activation states, and those now capture into
  `src/bones/admin-analytics-overview.bones.json`,
  `src/bones/admin-analytics-recommendations.bones.json`,
  `src/bones/admin-analytics-ranking.bones.json`,
  `src/bones/admin-analytics-ranking-experiment.bones.json`,
  `src/bones/admin-analytics-purchases.bones.json`, and
  `src/bones/admin-analytics-creator-activation.bones.json`.
  `src/app/(dashboard)/dashboard/creator/(protected)/resources/new/loading.tsx`
  now reuses the shared `CreatorResourceNewRouteSkeleton` hybrid shell, and it
  now captures into `src/bones/creator-resource-new-route.bones.json`.
  the canonical dashboard-v2 learner route loading surfaces now reuse the shared
  `DashboardUserRouteSkeletons.tsx` boneyard layer for overview, library,
  downloads, purchases, and subscription states, and
  those now capture into `src/bones/dashboard-overview.bones.json`,
  `src/bones/dashboard-library.bones.json`,
  `src/bones/dashboard-downloads.bones.json`,
  `src/bones/dashboard-purchases.bones.json`,
  and `src/bones/dashboard-subscription.bones.json`.
  Their runtime loading path now prefers the manual preview geometry directly,
  with `data-loading-scope` markers per route state, because the generated
  dashboard bones were allowing blank content panes during live transitions.
  The boneyard sets are still retained for capture/regeneration work.
  The old `DashboardGroupLoadingShell` and dashboard group navigation overlay
  pattern was retired during the dashboard-v2 hard cut. First entry into the
  active dashboard now goes through canonical `/dashboard-v2/*` routes, whose
  real `DashboardV2Shell` owns chrome and whose route `loading.tsx` files own
  content-only skeletons. That replacement avoids the earlier flash-then-blank
  and dashboard-inside-dashboard failure class during first entry from public
  routes.
  Additional non-boneyard public/admin route shells now live in
  `src/components/skeletons/PublicRouteSkeletons.tsx` for
  `/categories/[slug]`, `/creators/[slug]`, and `/admin/creators`, while the
  compatibility routes `/resources/id/[id]` and `/purchases` now also declare
  explicit `loading.tsx` coverage instead of returning blank screens.
  `src/components/skeletons/AdminResourcesRouteSkeletons.tsx` now owns the
  manual route-level loading shells for `/admin/resources`,
  `/admin/resources/trash`, `/admin/resources/bulk`,
  `/admin/resources/new`, `/admin/resources/[id]`, and
  `/admin/resources/[id]/versions`.
  `src/components/skeletons/AuthRouteSkeletons.tsx` now owns the manual
  route-level loading shells for `/auth/register`,
  `/auth/reset-password`, and `/auth/reset-password/confirm`, while
  `/auth/login/loading.tsx` now reuses the existing `LoginFormSkeleton`
  instead of leaving the route without explicit loading coverage.
  `/checkout/success`, `/checkout/cancel`, `/membership`, `/privacy`,
  `/terms`, `/cookies`, `/support`, `/admin`, `/admin/activity`,
  `/admin/audit`, `/admin/categories`, `/admin/orders`, `/admin/reviews`,
  `/admin/tags`, and `/admin/users` now also declare explicit `loading.tsx`
  coverage through those grouped shells, leaving only the app root and the
  dev-only `/dev/bones` tool route without dedicated route-level loading
  files.
  `ResourceDetailLoadingShell` keeps its boneyard preview/export path for
  capture work, but the runtime route currently renders the manual structural
  shell directly because the generated `resource-detail-shell` set was not
  reliable in live navigation. Resources transition pending state now clears
  from the mounted browse/detail shells (`src/app/resources/(browse)/page.tsx`
  and `ResourceDetailShell`) rather than from a shared
  `src/app/resources/template.tsx`, so cross-route skeletons stay visible
  until the target shell is actually on screen.
  `src/components/providers/ResourcesNavigationOverlay.tsx` now mirrors the
  dashboard pattern from `src/app/resources/layout.tsx` for cross-group
  listing/detail navigations. During `overlay: true` jumps, the in-route
  `ResourcesTransitionShell`, `ResourcesTransitionFallback`, and
  `ResourcesNavigationFeedback` now stay silent so the root overlay is the
  only active resources loading layer. In-route `/resources` transitions still
  use `ResourcesTransitionShell` when no root overlay is involved.
  Dashboard and resources route shells now also publish
  `data-route-shell-ready` markers (`dashboard`, `resources-browse`,
  `resource-detail`) so navigation overlays only clear after the target shell
  and a stable main/loading surface are actually present in the DOM.
  The route-group overlay providers now also watch pathname-level cross-group
  changes so runtime shell coverage still appears for browser history
  navigations and other transitions that did not go through the explicit
  click-intent helpers.
  Historical note: before the Phase 5 hard cut, the old dashboard group
  overlay mapped learner/account/creator dashboard aliases such as
  `/dashboard`, `/dashboard/library`, `/dashboard/downloads`,
  `/dashboard/purchases`, `/subscription`, and `/settings` to route-specific
  runtime skeletons instead of one generic dashboard shell. The active runtime
  contract is now the canonical dashboard-v2 shell plus route-owned loading
  content on `/dashboard-v2/*`.
  `src/components/settings/PreferenceSettings.tsx` also no longer reapplies
  `initialPreferences.theme` to the global theme on mount when local storage
  is empty. The settings form still reflects the persisted preference, but
  simply opening `/dashboard-v2/settings` should not flip the live theme for
  accounts whose stored DB preference differs from the already-mounted client
  theme.
  Public-navbar dashboard links now start that target-aware dashboard
  navigation state on click as well, so `/resources -> /dashboard-v2/library`
  does not have to wait for pathname-based fallback before showing the library
  shell.
  Historical note: the older dashboard overlay used
  `DashboardGroupLoadingShell` chrome to keep sidebar/topbar geometry aligned
  during cross-group transitions. After the hard cut, canonical
  `/dashboard-v2/*` entries rely on `DashboardV2Shell` and route-owned
  loading geometry instead of the retired full-shell dashboard overlay.
  The resources overlay now resolves browse vs detail shells from the target
  resources href/mode first, and only falls back to current pathname when
  replaying browser history transitions, so `/dashboard -> /resources` no
  longer flashes a detail-shaped shell before the discover/listing shell.
  It now also distinguishes discover vs listing on live transitions, so
  `/dashboard/* -> /resources?search=...` and category/filter jumps render the
  listing shell instead of the discover hero shell while the public route is
  still mounting.
  `ResourcesRouteSkeleton`, `SettingsPageSkeleton`, `CreatorApplyPageSkeleton`,
  and `CreatorResourceNewRouteSkeleton` now also prefer their manual runtime
  geometry directly when used in live transitions, while retaining boneyard
  preview exports for capture/regeneration work.
  `ResourcesIntroSectionSkeleton`, `ResourcesDiscoverSectionsSkeleton`, and
  listing-mode `ResourcesContentFallback` now also prefer their manual runtime
  geometry directly in the live app. Their boneyard preview exports remain on
  the capture page, but the runtime `/resources` discover/listing shell no
  longer depends on generated bones for lower-page section scaffolding.
  `PurchaseCardSkeleton`, `LoginFormSkeleton`,
  `AdminSettingsPageSkeleton`, `AdminAnalyticsRouteSkeletons`,
  `AdminResourceFormLoadingShell`, and
  `CreatorResourceFormLoadingShell` now follow the same runtime rule: live
  routes/Suspense boundaries render their manual fallback geometry directly,
  while boneyard preview exports remain available only for capture and
  regeneration work.
  `ResourcesIntroSectionSkeleton` now also exposes dedicated discover/listing
  preview variants on the capture page so those two geometries can be promoted
  into generated bones when runtime capture is available.
  The current generated registry now includes 39 captured sets:
  `resource-card`, `search-recovery-panel`,
  `resources-catalog-search`, `resources-catalog-controls`,
  `hero-search-quick-browse`, `hero-search-results`,
  `hero-search-empty`, `resources-intro-discover`,
  `resources-intro-listing`, `resources-discover-sections`,
  `resources-discover-personalized`, `resources-listing-shell`,
  `resources-route-shell`, `resource-detail-shell`, `purchase-card`,
  `settings-page`, `admin-settings-page`, `creator-apply-page`,
  `admin-analytics-overview`, `admin-analytics-recommendations`,
  `admin-analytics-ranking`, `admin-analytics-ranking-experiment`,
  `admin-analytics-purchases`, `admin-analytics-creator-activation`,
  `admin-resource-form`, `creator-resource-form`,
  `creator-dashboard-overview`, `creator-dashboard-analytics`,
  `creator-dashboard-resources`, `creator-dashboard-sales`,
  `creator-dashboard-profile`, `creator-resource-new-route`, and
  `login-form`, `dashboard-overview`, `dashboard-library`,
  `dashboard-downloads`, `dashboard-purchases`,
  `dashboard-subscription`, and `dashboard-resources-redirect`.
- `PriceLabel` is now theme-aware at the DS level (`text-foreground` for paid prices, `text-success-600` for free) so product surfaces can reuse it on both light and dark shells without local color patches.
- Tailwind now exposes explicit `popover` / `popover-foreground` theme colors
  from the global CSS variable contract, so dropdowns and search panels using
  `bg-popover` render an opaque themed surface instead of silently falling back
  to transparent backgrounds.
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
