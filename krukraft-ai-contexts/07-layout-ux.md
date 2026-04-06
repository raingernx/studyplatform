# Krukraft — Layout System and UX

> Layout/UX reference. Validate marketplace/detail/admin behavior against the
> current app tree before assuming every section here still matches production.

## Global Container

```tsx
// src/components/layout/container.tsx
<div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
  {children}
</div>
```

## Layout Rules

- Marketplace pages use full-width section backgrounds with the main content constrained inside the shared `Container`.
- Dashboard and admin pages reuse the same container baseline.
- Hero and discover sections keep broad backgrounds, but text blocks stay constrained with `max-w-*` wrappers instead of stretching across the full catalog width.
- Shared shell chrome now expects theme-aware surfaces at the app level:
  root layout, public navbar/footer, marketplace controls, and dashboard topbars
  should use `bg-background` / `bg-card` / `border-border` style tokens instead
  of hardcoded white or the light-only semantic text/surface aliases.
- In dark mode, border usage should now preserve three distinct levels instead
  of flattening every edge to the same bright line:
  `border-border-subtle` for passive shells/dividers,
  `border-border` for chrome boundaries,
  and `border-border-strong` / `border-input` for controls.
- Root layout now injects a pre-hydration theme bootstrap script that sets
  `document.documentElement.dataset.theme` before React hydration, which avoids
  the previous white-first flash when a returning `dark` or `system -> dark`
  session refreshed the page.
- Root layout no longer imports the generated bones registry as a side effect.
  Generated skeleton sets are now bootstrapped by the client-only
  `BonesRegistryBootstrap` provider after hydration, which reduces the Fast
  Refresh blast radius when `src/bones/registry.js` is regenerated during
  skeleton work.
- The no-preference/default theme path is now `light`; `system` remains
  available in user settings but is no longer the initial baseline for first
  paint or newly created preference records.

## Responsive Breakpoints

| Breakpoint | Width |
|-----------|-------|
| Mobile | base |
| Tablet | sm (640px), md (768px) |
| Desktop | lg (1024px), xl (1280px), 2xl (1536px) |

## Grid Scaling

```css
[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]
[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]
```

- Catalog and discover sections use adaptive auto-fill grids rather than a fixed card count per breakpoint.
- Large-screen gaps usually sit in the `gap-6` to `gap-8` range.

## Page Layouts

### /resources (Main Marketplace)

- Primary public marketplace route with two explicit modes:
  - **Discover mode:** active when no search, filter, pagination, or non-default sort intent is present
  - **Listing mode:** active when search, filters, pagination, or a non-default sort are present
- Shared shell:
  - navbar with canonical marketplace search in the header row
  - secondary controls row with discover button plus scrollable category chips

**Discover mode**
- full-width hero section above the main content container
- the hero now uses a simplified split layout: editorial copy on the left and one dark feature/media panel on the right
- the hero contract is now two separate cards on the stage rather than one unified shell: a subtle-tinted editorial copy card and a dark premium panel
- the discover stage itself now sits on a lavender brand wash rather than the previous white radial shell, so hero verification must include the section background around the cards, not just the cards themselves
- the discover hero is now fixed from code and should not be assumed to inherit admin/CMS style fields
- the current hero layout follows the Figma banner variants directly: desktop `68:24` / preview `78:19`, tablet `98:2`, and mobile `53:123`
- across all three hero variants, the contract stays the same: a dark marketplace badge plus a single large headline on the editorial card, then eyebrow + premium title + chip row + one primary CTA in the dark panel
- the editorial card does not carry supporting body copy or CTA buttons in the current canonical banner contract
- the current visible Figma-led hero copy is `Ready-made resources for fast lesson planning.` on the editorial card, with `Membership plans` as the panel CTA
- the desktop hero uses a flexible stage with separate copy/media cards instead of a capped shared shell, so the left card can grow while the right panel stays fixed-width
- tablet keeps the stacked mobile shell but reintroduces the right-edge photographic artwork fill spacer inside the editorial card; mobile still omits that spacer and keeps the copy card text-only
- desktop keeps the same right-edge artwork fill spacer inside the subtle card while the premium panel returns to a fixed-width side rail
- the discover hero intentionally stays shadow-free; emphasis comes from contrast, crop, and the single dark media block rather than stacked promotional panels
- discover now favors fewer, clearer blocks instead of stacking many near-identical rails
- the main sequence is:
  - quick browse tiles for entry intents like top picks, worksheets, flashcards, and free resources
  - personalized recommendations (or a public "Top picks" fallback for anonymous viewers)
  - one high-signal trending rail
  - a curated collections grid that links deeper into listing modes such as newest, featured, and most-downloaded
- viewer-aware personalization hydrates after the public shell instead of blocking the initial route render
- discover-section CTAs should only appear when the target listing matches the section's promise; purely personalized rows can omit `View all` rather than sending users to a generic fallback list

**Listing mode**
- no discover hero
- listing intro with result count and sort summary
- desktop filter sidebar plus in-content filter bar
- optional spotlight card when the listing context supports it
- canonical results grid
- no-result recovery panel when a search miss occurs
- public activation-weighted `sort=recommended` remains the canonical query value for backward compatibility, but UI copy now labels it as `Top picks` so it is not mistaken for personalized recommendations
- active listing controls and spotlight treatments should stay dark-aware on
  dark shells: use primary tint (`bg-primary/12`, `border-primary/20-30`,
  `text-primary`) rather than light-only `primary-50` / `white` surfaces for
  selected filter rows, selected pills, select controls, and spotlight chips

**Marketplace search UX**
- focusing/clicking the empty navbar search input now opens a quick-browse dropdown with recent searches plus curated browse shortcuts
- search suggestions are still debounced and replace the quick-browse panel once the user types enough text
- selecting a suggestion opens the resource detail directly
- pressing Enter or using the dropdown footer navigates to canonical `/resources?search=...`
- no-result dropdown and full-page recovery both offer alternate queries plus taxonomy browse links

**Loading behavior**
- discover hero loading uses the same stage geometry as the live hero rather than a generic promo banner
- the route shell no longer forces a large hero `min-height`; live and loading geometry should stay content-driven so the stage does not drift from Figma
- discover hero loading should keep the same geometry but use neutral placeholder tones only; no promotional accent blue/purple fills inside the skeleton stage
- discover sections use section/card skeletons that match the live geometry
- the browse index loading UI now lives under `src/app/resources/(browse)/loading.tsx`, which keeps the discover/listing skeleton scoped to `/resources` and prevents it from flashing before `/resources/[slug]` loading states on cold detail navigations
- route-level browse loading and the in-page discover Suspense fallback now share the same discover skeleton source so layout changes do not require maintaining two divergent skeleton implementations
- listing mode uses structural content fallbacks instead of a generic card wall
- listing mode fallback now includes the optional spotlight geometry as part of
  the shared `ResourcesContentFallback` contract, so the live listing and
  loading states do not diverge when spotlight styling/layout changes
- dashboard/library/purchases/downloads and creator-dashboard links that open
  public resource detail pages should use navigation-aware resource links so
  cross-group transitions into `/resources/[slug]` start the detail shell
  immediately instead of waiting for the new route tree to mount cold.
- resources navigation state should now clear from the mounted route shells
  themselves, not from a shared `src/app/resources/template.tsx`. The browse
  page mounts `ResourcesRouteReady` inside
  `src/app/resources/(browse)/page.tsx`, and detail pages mount it inside
  `ResourceDetailShell`, so pending detail/listing shells do not disappear
  before the target route scaffolding is actually on screen.
- Cross-group jumps into `/resources` now also have a root-level
  `ResourcesNavigationOverlay` from `src/app/layout.tsx`. Links launched from
  non-resources routes mark `overlay: true` in the resources navigation store,
  so users moving from dashboard or other public pages into listing/detail
  routes keep a visible resources shell on screen while the new route tree is
  still mounting.
- Dashboard and resources transition overlays no longer clear from a fixed
  timeout alone. `DashboardOverlayReady`, `DashboardNavigationReady`, and
  `ResourcesRouteReady` now wait for route-shell markers
  (`data-route-shell-ready="dashboard"`, `"resources-browse"`,
  `"resource-detail"`) plus a non-empty `main`/loading surface before they
  clear pending navigation state, which prevents the previous flash-then-blank
  gap on slower route-group transitions.
- `DashboardGroupNavigationOverlay` and `ResourcesNavigationOverlay` now also
  derive a fallback overlay directly from `usePathname()` transitions, not only
  from click-started navigation state. That keeps shell coverage active for
  browser back/forward and any route change where the intent state was not
  started in time.
- The root overlays are now target-aware instead of generic:
  `DashboardGroupNavigationOverlay` maps the destination href to route-specific
  dashboard, library, downloads, purchases, subscription, settings, creator,
  and creator-resource shells, while `ResourcesNavigationOverlay` resolves
  browse/listing vs detail from the destination resources href before it
  renders. This prevents the earlier sequence where users briefly saw a
  resource-detail shell while navigating to discover, or a generic dashboard
  shell before the library/purchases-specific shell appeared.
- The dashboard overlay now wraps those route-specific loading blocks in the
  shared dashboard shell chrome instead of painting content-only previews over
  the root app background. Cross-group jumps into dashboard pages should
  therefore keep the dashboard sidebar/topbar visible from the first loading
  frame, rather than showing library/downloads content under public chrome.
- Dashboard overlay cleanup is now single-owner as well: the dashboard route
  subtree no longer mounts a second `DashboardNavigationReady` under
  `src/app/(dashboard)/dashboard/template.tsx`, and the thin
  `DashboardNavigationFeedback` strip no longer renders during root-overlay
  transitions. Cross-group jumps should therefore show one dashboard shell,
  not a stacked overlay plus an immediate secondary dashboard progress layer.
- Public-navbar protected links such as `คลังของฉัน` now also start the
  dashboard navigation intent immediately, not only after pathname fallback
  detects that the app has already crossed into the dashboard subtree. This
  keeps first-entry transitions from `/resources` into `/dashboard/library`
  aligned with the target library shell from the initial frame.
- `tests/e2e/navigation-shells.spec.ts` now samples the DOM every animation
  frame during public/dashboard/resources transitions and is part of
  `npm run smoke:local:browser`, so shell-coverage regressions can be caught in
  browser automation instead of relying on manual visual checks alone.
- Dashboard route-level loading inside the mounted shell now favors the manual
  geometry from `DashboardUserRouteSkeletons.tsx` and
  `CreatorDashboardRouteSkeletons.tsx` at runtime, while the generated bones
  remain capture-only. This avoids the observed case where a dashboard shell
  stayed on screen but the content pane went blank during transition.
- Runtime `/resources` discover/listing loading now follows the same rule:
  `ResourcesIntroSectionSkeleton`, `ResourcesDiscoverSectionsSkeleton`, and
  listing-mode `ResourcesContentFallback` use their manual geometry directly
  in live navigation, while boneyard preview exports stay capture-only. This
  avoids the lower-page blank gap that could appear after the discover hero
  shell mounted but before generated section bones resolved.
- When a cross-group resources overlay is active (`overlay: true` in the
  resources navigation store), the in-route `ResourcesTransitionShell`,
  `ResourcesTransitionFallback`, and `ResourcesNavigationFeedback` now stand
  down completely. That keeps `/dashboard/library -> /resources` and similar
  jumps on a single resources shell instead of briefly stacking the root
  overlay with a second in-route skeleton layer.
- Default runtime skeletons should also stay neutral in tone: selected pills,
  recovery banners, success strips, and promotional accent washes belong only
  to condition-specific resolved UI, not the baseline loading shell. This is
  especially important on dashboard library, resources listing, and other
  cross-group transitions where a tinted block can read as the wrong page.
- Route-level and Suspense-critical shells now apply that manual-runtime rule
  more broadly as well: the resource-detail purchase rail, auth login shell,
  admin settings shell, admin analytics route shells, and admin/creator
  resource-form shells all render their manual fallback geometry directly in
  the live app. This reduces the chance that boneyard runtime hydration or
  delayed registry state leaves major secondary panes missing during
  transition.
- The `/resources` navbar search, category controls, and card grid now follow
  the same rule too. `ResourcesCatalogSearchSkeleton`,
  `ResourcesCatalogControlsSkeleton`, and `ResourceCardSkeleton` all render
  manual runtime geometry directly, while the matching `*BonesPreview` exports
  remain capture-only. `ResourcesRouteSkeleton` now wires its live navbar
  slots to those manual runtime components instead of the preview variants.
- The browse-route secondary controls no longer take ad-hoc prop hints such as
  `activeCount` or `showDiscoverMeta`. Discover vs listing differences are now
  derived from the route mode and surrounding layout itself, while the shared
  controls shell stays structurally identical across both modes.
- Theme behavior on `/settings` is intentionally less aggressive now: opening
  the settings page no longer reapplies the persisted DB theme to the whole
  app just because `localStorage.user_theme` is empty. The live theme should
  remain whatever the mounted client is already using until the user changes
  or saves a new preference explicitly.
- `/categories/[slug]`, `/creators/[slug]`, `/admin/creators`, the
  compatibility redirect route `/resources/id/[id]`, and the legacy
  dashboard alias `/purchases` now all have explicit route-level loading
  coverage instead of falling back to blank shells during navigation.
- `/admin/resources`, `/admin/resources/trash`, `/admin/resources/bulk`,
  `/admin/resources/new`, `/admin/resources/[id]`, and
  `/admin/resources/[id]/versions` now also declare explicit route-level
  loading shells tailored to list, trash, bulk upload, form, and versions
  layouts instead of streaming blank admin content while data resolves.
- `/auth/login`, `/auth/register`, `/auth/reset-password`, and
  `/auth/reset-password/confirm` now all declare route-level loading coverage
  as well, so auth navigations no longer rely only on client-side Suspense or
  blank route shells during streaming transitions.
- `/checkout/success`, `/checkout/cancel`, `/membership`, `/privacy`,
  `/terms`, `/cookies`, and `/support` now also have explicit route-level
  loading shells. The checkout shells intentionally stay neutral and mirror
  the final centered status-card geometry instead of using success/danger
  accent fills during loading.
- The remaining admin root/index pages now also have explicit loading shells:
  `/admin`, `/admin/activity`, `/admin/audit`, `/admin/categories`,
  `/admin/orders`, `/admin/reviews`, `/admin/tags`, and `/admin/users`.
  Their loading state mirrors the eventual toolbar/table/stat layout inside
  the mounted admin dashboard shell instead of streaming a blank content pane.
- route files under `src/app/**` should not declare local `*Skeleton` or `*Fallback` components inline; shared loading/fallback UI now lives under `src/components/skeletons/*`, and `npm run lint` enforces that contract with `npm run skeleton:check`
- `boneyard-js` is now installed as an optional skeleton-capture workflow.
  Its config lives in `boneyard.config.json`, it writes generated bones under
  `src/bones`, and the repo-level entrypoints are
  `npm run skeleton:boneyard:build` plus
  `npm run skeleton:boneyard:build:force`. This is additive tooling for
  matching live DOM geometry more closely; it does not replace the existing
  requirement that route-level loading, skeleton, empty, and error states stay
  intentionally designed and parity-checked.
- The current capture flow does not depend on route-loading timing. A dev-only
  page at `src/app/dev/bones/page.tsx` renders
  `ResourceCardBonesPreview`,
  `SearchRecoveryPanelBonesPreview`,
  `ResourcesCatalogSearchBonesPreview`,
  `ResourcesCatalogControlsBonesPreview`,
  `HeroSearchQuickBrowseBonesPreview`,
  `HeroSearchResultsBonesPreview`,
  `HeroSearchEmptyBonesPreview`,
  `ResourcesDiscoverPersonalizedBonesPreview`,
  `ResourcesIntroSectionDiscoverBonesPreview`,
  `ResourcesIntroSectionListingBonesPreview`,
  `ResourcesDiscoverSectionsBonesPreview`,
  `ResourcesListingShellBonesPreview`, and `ResourcesRouteSkeletonBonesPreview`, plus
  `ResourceDetailLoadingShellBonesPreview`, `SettingsPageSkeletonBonesPreview`,
  `AdminSettingsPageSkeletonBonesPreview`, and
  `CreatorApplyPageSkeletonBonesPreview`, plus
  `CreatorResourceFormLoadingShellBonesPreview`, plus
  `CreatorDashboardOverviewBonesPreview`,
  `CreatorDashboardAnalyticsBonesPreview`,
  `CreatorDashboardResourcesBonesPreview`,
  `CreatorDashboardSalesBonesPreview`,
  `CreatorDashboardProfileBonesPreview`, plus
  `LoginFormSkeletonBonesPreview` (`loading={false}`) so `boneyard`
  can extract stable DOM geometry, while the runtime
  `ResourceCardSkeleton`, `ResourcesIntroSectionSkeleton`,
  `ResourcesDiscoverSectionsSkeleton`,
  listing-mode `ResourcesContentFallback`, `ResourcesRouteSkeleton`,
  `PurchaseCardSkeleton`, `SettingsPageSkeleton`,
  `AdminSettingsPageSkeleton`, `CreatorApplyPageSkeleton`,
  `AdminAnalyticsOverviewSkeleton`,
  `AdminAnalyticsRecommendationsSkeleton`,
  `AdminAnalyticsRankingSkeleton`,
  `AdminAnalyticsRankingExperimentSkeleton`,
  `AdminAnalyticsPurchasesSkeleton`,
  `AdminAnalyticsCreatorActivationSkeleton`,
  `AdminResourceFormLoadingShell`, `CreatorResourceFormLoadingShell`,
  `CreatorDashboardOverviewLoadingShell`,
  `CreatorDashboardAnalyticsLoadingShell`,
  `CreatorDashboardResourcesLoadingShell`,
  `CreatorDashboardSalesLoadingShell`,
  `CreatorDashboardProfileLoadingShell`, `CreatorResourceNewRouteSkeleton`,
  `LoginFormSkeleton`,
  `DashboardOverviewSkeleton`,
  `DashboardLibrarySkeleton`,
  `DashboardDownloadsSkeleton`,
  `DashboardPurchasesSkeleton`,
  `DashboardSubscriptionSkeleton`,
  `DashboardResourcesRedirectSkeleton`, and
  `ResourceDetailLoadingShell` keep manual fallbacks
  if bones are missing or the registry has not loaded yet.
  The current generated registry now includes 39 captured sets, covering
  search recovery, catalog chrome, hero-search dropdown states,
  intro discover/listing shells, discover sections, personalized discover
  sections, listing shell, route shell, purchase rail, resource detail shell,
  the base resource card, dedicated settings/admin/creator-apply route shells,
  the admin analytics overview/recommendations/ranking/ranking-experiment/
  purchases/creator-activation route shells, the admin resource form shell,
  the creator resource form shell, creator dashboard overview/analytics/
  resources/sales/profile shells, the creator new-resource route shell,
  the auth login shell, and the user dashboard overview/library/downloads/
  purchases/subscription/resources-redirect route shells.
- forward navigation from a scrolled `/resources` view into `/resources/[slug]` now scrolls the viewport to the top before the detail loading shell renders, while browser back-navigation should still restore the previous discover scroll position
- `ResourceDetailLoadingShell` currently prefers its manual runtime shell over
  the generated `resource-detail-shell` bones set because the generated version
  was producing blank output during real navigation. The bones preview/export is
  still kept for capture work, but live route loading now prioritizes a visible
  structural shell.

### /resources/[slug] (Resource Detail)

High-level shell:

```text
max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8
  → breadcrumb
  → title / metadata
  → main grid
      left/center: gallery + preview body
      right: purchase rail
  → deferred footer / review / related sections
```

- Breadcrumb navigation
- Gallery / preview media at the top of the content stack
- Purchase rail resolves ownership state separately and can show a structural "Checking your library…" placeholder
- Reviews and related resources are deferred separately from the initial shell
- Detail pages no longer rely on page-level auth/session reads for anonymous rendering

### /library

- Purchased and owned resources
- Consistent action alignment for preview/download/open buttons
- Filter and sort controls where relevant

### /dashboard

- Per-user dynamic rendering
- Purchases and learning profile surfaces
- Download history and creator-access state
- Route-level loading for `/dashboard`, `/dashboard/library`,
  `/dashboard/downloads`, `/dashboard/purchases`,
  `/dashboard/resources`, and `/subscription` now reuses the shared
  `DashboardUserRouteSkeletons.tsx` hybrid boneyard layer instead of
  returning `null`
- The parent `(dashboard)` route group now also declares
  `src/app/(dashboard)/loading.tsx`, which renders a shell-level dashboard
  skeleton before the async dashboard layout resolves session and creator
  access. First navigation from public routes into dashboard surfaces should
  now show sidebar/topbar/content scaffolding instead of a blank gap while the
  group layout is still loading.
- Public `Navbar` links that enter protected dashboard surfaces now also
  trigger a global dashboard navigation overlay from the root layout via
  `DashboardGroupNavigationOverlay`, so first entry from public routes does not
  depend solely on segment loading timing to reveal a visible shell. The
  overlay now persists until the mounted client dashboard shell clears the
  pending overlay state via `DashboardOverlayReady`, instead of hiding as soon
  as the browser URL enters `/dashboard` or as soon as a route template mounts.
- Template-based dashboard readiness now only clears in-dashboard transition
  progress (`overlay: false`). First entry from public routes into the
  protected dashboard subtree should clear from the actual `DashboardShell`
  mount path instead of from a route-group template, which avoids the
  flash-then-blank gap where the URL changed before the dashboard shell was
  visibly ready.
- `/settings` now favors flat, divider-based account sections instead of stacking card-inside-card form panels; section hierarchy should come from headers, spacing, and row separation first
- `/settings` route-level loading now mirrors that same flat section rhythm instead of returning a null loading state

### /admin

- Shared container-based shell
- Metrics, resource management, moderation, and settings surfaces
- Admin subtree is role-gated upstream; pages should not duplicate layout-level auth checks unless a route has an extra requirement
- admin settings and inspector-like screens should follow the same anti-nesting rule as dashboard settings: prefer flat sections and divided rows over repeated white bordered cards unless a section truly needs its own elevated surface
- `/admin/settings` now uses one dominant settings surface with flat divided sections inside it, and its loading state mirrors that structure instead of returning `null`

---

*Refreshed against the repo state on 2026-04-05.*
