# Krukraft — Architecture

## Layered Architecture (Strict Rule)

```
API Route → Service → Repository → Prisma
```

- Never call Prisma directly from route handlers or components
- Services own business logic and orchestration
- Repositories own data access
- This pattern is actively maintained in the repo
- Repository raw SQL must use the database table names produced by Prisma `@@map(...)` / `@map(...)`, not the Prisma model names; creator analytics verification on 2026-04-06 caught a real runtime failure where a raw join still referenced `"ResourceStat"` instead of the mapped `"resource_stats"` table
- admin table shells must keep non-table chrome such as toolbars and pagination outside the `<table>` subtree; 2026-04-06 browser-smoke verification caught a real hydration mismatch on `/admin/audit` where `TablePagination` rendered a `<div>` directly under the `DataTable` table markup

## Key Architecture Constraints

- Do not break auth, purchase, upload, or download flows
- Do not move business logic back into routes
- Prefer server components where possible
- Do not modify authentication logic casually
- Keep build-safe and runtime-dynamic paths separate
- `@/services/resources` is intentionally a public/viewer-state barrel only; admin, mutation, and other server-heavy callers must import from `@/services/resources/resource.service` or `@/services/resources/mutations` directly instead of widening the browser-facing surface again

## Repo Knowledge Layer

```
Canonical docs / code / contexts
  → knowledge/raw/   (evidence / source captures)
  → knowledge/wiki/  (synthesized topic pages)
  → agent query / maintenance workflows
```

- the repo now maintains a lightweight LLM wiki under `knowledge/`
- `knowledge/raw/` stores source captures and evidence pages that should remain close to the original material
- `knowledge/wiki/` stores synthesized repo knowledge for routes, systems, testing flows, design-system policy, and operational behavior
- `knowledge/schema/` stores the maintenance rules for ingest/query/lint
- repo-owned scripts now operationalize the layer: `wiki:ingest` adds raw notes and optional wiki stubs, suggests related pages/backlinks, appends `knowledge/log.md`, and regenerates `knowledge/index.md`; `wiki:ingest:dry-run` previews the write set first and can emit machine-readable JSON with `--format json`, now including per-item/per-target decision hints (`actions`, `reasons`, `severity`), a top-level `decisionSummary`, `confidence` / `policy` hints for apply-vs-review gating, top-level batch `policy` overrides that can block existing-page updates, backlink seeding, source-only merges, or excessive review-required plans, and `--enforce-policy` when CI should return non-zero on `blocked_by_policy`; write mode now honors the same gate through `wiki:ingest:enforce` / `wiki:ingest:batch:enforce` before any files are written, `--report-file` can persist the resolved plan as a JSON artifact in either preview or blocked write flows, and `--report-format bundle` upgrades that artifact into a single file with a text summary, path-level artifact hints, review annotations, GitHub-ready summary/annotation hints, and structured sections for CI diagnostics; `wiki:ingest:batch` / `wiki:ingest:batch:dry-run` apply the same workflow to multi-source JSON plans with one pre-validated merge summary, explicit shared wiki targets (`wikiTargets` + `wikiTargetId`) when several captures should merge into one page, and `skipRawCapture: true` when a source should enrich a wiki target without creating a new durable raw note; `wiki:stale` flags old pages for review, semantic/coverage checks catch duplicate topics plus raw/canonical source drift, and `wiki:drift` flags change sets where implementation-linked files or raw evidence changed but the related wiki pages were not reviewed
- default operator policy for that layer is now `Codex triages first`: the agent chooses skip/single/update/batch ingest shape before writing and then reports that decision back to the user instead of requiring the user to classify every knowledge change manually
- this layer is intentionally subordinate to code, `AGENTS.md`, `krukraft-ai-contexts/`, `design-system.md`, and `figma-component-map.md`
- repo-owned linting (`npm run wiki:lint`) enforces required wiki sections plus `knowledge/index.md` coverage so the wiki stays navigable instead of decaying into unlinked notes

## Route Structure

```
src/app/
  resources/                  ← Public marketplace
  resources/[slug]/           ← Resource detail page
  categories/[slug]/          ← Category landing page
  creators/[slug]/            ← Public creator page
  support/                    ← Public support page
  auth/*                      ← Login / register / reset-password
  (dashboard)/*               ← User dashboard
  admin/*                     ← Admin panel
  api/*                       ← Thin route handlers
```

## Request Interception

```
src/proxy.ts   ← active Next 16 request interception entry
middleware.ts  ← compatibility shim / re-export surface
```

Current proxy concerns:
- dashboard/admin protection
- locale-prefix cleanup / redirect behavior
- ranking experiment cookie work

Current proxy behavior:
- protected-route gating is now handled directly inside `src/proxy.ts` with `getToken()` checks instead of `withAuth`
- unauthenticated `/dashboard*` and `/admin*` requests redirect to `/auth/login?next=...`
- authenticated non-admin `/admin*` requests redirect to `/dashboard`
- public branches still avoid auth work entirely apart from ranking-cookie assignment and locale cleanup
- `/brand-assets/*` runtime alias routes are now excluded from the proxy matcher, so logo/favicon asset redirects do not pay the ranking-cookie/proxy hop

## Caching Architecture

```
Upstash Redis (cross-instance cache)
  → unstable_cache (per-instance cache)
  → runSingleFlight (same-instance dedup)
```

Used heavily in:
- marketplace listing variants
- discover sections
- resource detail shell/body/footer/purchase meta
- reviews / related content
- platform settings
- the post-deploy route warm pass now burst-aligns the hot resource-detail, creator-detail, category, and listing-control routes to the same 5-VU class that the production smoke suite later measures, and it reheats the hot resource-detail, creator-detail, category, plus listing-control routes again at the tail of the warm sequence so those route classes are freshest when k6 starts

Database search note:
- marketplace/admin text search still uses Postgres `ILIKE`/Prisma `contains`
- trigram indexes now cover `Resource.title`, `Resource.description`, `Category.name`, `Tag.name`, `User.name`, and `User.email`
- marketplace search now uses a weighted SQL relevance strategy across title, slug, description, category, tag, and creator fields
- search query understanding now tokenizes multi-word queries and expands a small synonym/alias set for common study terms such as worksheet/ใบงาน, flashcard/แฟลชการ์ด, and note/โน้ต
- live search (`/api/search`) and marketplace result pages share the same search ranking logic
- navbar/listing search surfaces now route to the canonical marketplace results page (`/resources`) instead of appending `?search=` to whatever public page the user is currently on
- typeahead suggestions now navigate directly to resource detail, while Enter and "see all results" route to marketplace results with the marketplace filter context preserved only on the `/resources` browse page
- `/api/search` can now return recovery metadata for no-result states, including suggested alternate queries plus matching categories and tags
- no separate search engine is in the stack today

## Public Marketplace Architecture

```
/resources
  public shell avoids page-level auth/cookie reads
    → the browse index now lives under a route group (`src/app/resources/(browse)/*`) so the discover/listing loading UI is scoped to `/resources` itself and does not flash during `/resources/[slug]` navigations
    → discover hero is now a fixed design-system-led surface in code instead of being resolved from the admin hero CMS
    → the public discover hero no longer has a dedicated admin CMS, analytics write path, or hero-specific cache-selection layer
    → listing/discover content streamed separately
    → listing caches keyed by sort/category/page
    → marketplace listing reads now only await category cache before the query when category slug resolution is actually needed; unfiltered listing/search paths can load sidebar categories in parallel with the primary listing read
    → client viewer-state hydration restores owned badges first
    → the `/resources` viewer-state provider is now scoped to viewer-aware card and personalization subtrees instead of wrapping the whole browse shell, so headings/filter chrome can stay outside the owned-state hydration boundary
    → the main listing grid now hydrates owned badges through `ResourceGrid`'s deferred owned-id hydrator instead of sitting under a route-level viewer-state provider, so the grid shell can render with server data first and patch ownership state in later without expanding the provider boundary across the whole listing subtree
    → zero-result search recovery now starts as a deferred nested server subtree behind its own `Suspense` boundary, so the listing shell and search-empty copy no longer wait on taxonomy recovery suggestions before streaming
    → the dedicated no-results search branch now renders the recovery panel without routing through the viewer-state grid/client ownership boundary, trimming hydration work from that empty-search path
    → signed-in discover personalization now hydrates in a second client fetch after owned-state is ready
    → the discover "Top picks" row now server-renders as the default section for everyone, while the heavier personalized discover client module is only loaded for authenticated viewers and can replace that fallback later
    → the discover `Trending now` row no longer shares the personalized viewer-state provider boundary; it patches owned badges through its own deferred base-state fetch so the provider scope is limited to the personalized module itself
    → viewer-state can start before any heavier personalized discover work is resolved
    → `/api/resources/viewer-state` serves `scope=base|discover` so ownership and recommendation work stay decoupled
    → signed-in discover payloads use short-lived private caching to smooth repeat navigations
    → recommendation impressions are now recorded from client-side section exposure via `/api/recommendations/impression`, not from discover cache misses
    → post-deploy warm + smoke perf workflow (`deployment_status` + manual `workflow_dispatch` fallback for CLI deploys)
    → warm workflow install now retries and uploads npm install logs when it fails before warm artifacts exist
    → post-deploy warm/perf jobs now run `setup-node` on Node 24 to match the current lockfile/npm resolver behavior used locally
    → the same workflow now also uses `checkout@v6` / `setup-node@v6` / `upload-artifact@v6`, aligning the GitHub-maintained actions in that flow with upstream `node24` runtimes
    → selective usable fallbacks where they match final section intent
```

Public creator route note:
- `/creators/[slug]` stays public/request-cacheable at the page level and does not read `cookies()`, `headers()`, or server-session state in the route entry
- creator page metadata now uses a lighter cached metadata reader instead of reusing the full public-profile payload
- the full creator public-profile cache now reads the creator momentum/status-badge fields from the main profile query itself instead of issuing a second `creatorStat` repository call inside the cached loader
- the creator public route now splits its cached data path into a lighter shell reader plus a separate published-resource reader; the page starts both promises together, awaits only the shell at the route entry, and streams the published-resources section behind its own structural `Suspense` fallback
- creator warm coverage now seeds creator metadata, shell, and published-resource caches directly in addition to the compatibility full-profile cache, so the live route and warm path prime the same public cache surfaces
- this keeps creator detail page and metadata requests on separate lighter cache keys while preserving the shared creator-public revalidation tags

Public category route note:
- `/categories/[slug]` now starts the marketplace listing read once at the route entry and streams the hero count pill plus listing section through separate `Suspense` subtrees instead of awaiting the full category listing before any shell HTML can render
- the streamed category fallback surfaces are structural now; the in-page listing boundary no longer uses `fallback={null}` while the category resource grid is still resolving
- the category page now renders its resource cards through a static server-led grid instead of mounting the heavier `ResourceGrid` client pagination/filter machinery on a route that does not expose in-page progressive loading
- the post-deploy public warm script now reheats `/resources?category=all&sort=recommended` and `/resources?category=all&sort=newest` again as the final warm step before k6, so the highest-risk listing control routes finish as the freshest warmed public pages instead of being cooled behind later creator/category warm passes

Root rendering note:
- the root app layout uses build-safe public platform config only and does not read the authenticated server session
- the root layout now injects a pre-hydration theme bootstrap script that sets `data-theme` / `color-scheme` before React hydration, preventing the old white-first flash on returning dark sessions
- the theme baseline for users with no stored preference is now `light`; `dark` and `system` remain opt-in user preferences rather than the default initial state
- `UserPreference.theme` now also defaults to `light` at the Prisma/database layer, so new preference rows created outside the client bootstrap path cannot drift back to `system`
- the app root `src/app/loading.tsx` is now intentionally neutral and centered rather than page-shaped; if the root fallback still appears before a route-family shell resolves, it should not read as discover/library/dashboard UI
- the root client provider tree no longer mounts `SessionProvider`; public routes avoid the NextAuth client-session baseline by using targeted auth-viewer fetches only where auth-aware UI is needed
- the root layout no longer mounts the full route-specific dashboard/resources overlay stack; `ResourcesNavigationOverlay` still lives in `src/app/resources/layout.tsx` and `DashboardGroupNavigationOverlay` still lives in `src/app/(dashboard)/layout.tsx`, while lighter root-level entry overlays now cover cross-group jumps only: `DashboardEntryNavigationOverlay` handles public → dashboard transitions and `ResourcesEntryNavigationOverlay` handles dashboard/public → `/resources` transitions without rehydrating the full in-group overlay logic on every route
- dashboard route readiness is now more target-specific than before: overview, library, downloads, purchases, settings, subscription, the main creator surfaces, and the creator resource editor routes now expose route-ready markers so handoff overlays can wait for the destination route family instead of clearing on generic dashboard-shell readiness alone
- `/api/auth/viewer` now resolves directly from the signed JWT token via `next-auth/jwt` instead of `getServerSession`, so lightweight auth chrome does not spend Prisma connections just to confirm the signed-in snapshot
- `/api/resources/viewer-state` and `/api/resources/[id]/viewer-state` now resolve the same auth snapshot from the signed JWT token instead of calling `getServerSession`, so owned-state/detail-state hydration no longer burns Prisma connections on session reads before the feature-specific queries start
- lightweight client JSON fetches now use a small browser-side dedupe/TTL cache for repeat personalized requests, and sign-out clears that cache alongside auth viewer state

## Resource Detail Architecture

```
/resources/[slug]
  shared resource loader → metadata + shell
    → page-level auth/cookie reads removed
    → purchase meta deferred
    → body content deferred
    → footer content deferred
    → public reviews deferred
    → lightweight auth viewer now defers to idle time on the detail route
    → client detail viewer-state hydrates ownership/success first after auth viewer readiness
    → detail params/searchParams now resolve in parallel and route metadata reads its own lighter cached metadata loader instead of the public detail shell payload
    → the detail viewer-state provider is now scoped to the success/purchase/owner-review subtree instead of wrapping the whole page shell, so gallery/header/public body sections stay outside the personalization boundary
    → detail base viewer-state now reuses a short-lived browser cache keyed by resource + viewer
    → owner review form hydrates in a second client fetch after ownership is known
    → the owner-review form bundle is now lazy-loaded only after the base viewer-state confirms the signed-in viewer owns the resource, so anonymous and non-owner detail visits do not pay that review-form client payload up front
    → refresh polling can bypass the short-lived private ownership cache after checkout
    → related section deferred separately
    → the route-entry shell cache no longer carries the long-form description field; description now lives in the deferred body-content cache and the metadata cache only
```

Key details:
- viewer-specific ownership/success state now hydrates from `/api/resources/[id]/viewer-state?scope=base`
- owner review state hydrates separately from `/api/resources/[id]/viewer-state?scope=review`
- anonymous detail views skip the detail viewer-state API entirely until auth-aware UI is actually needed
- remote preview images use Next Image when the source is optimizer-compatible; bypass is reserved for non-optimizable cases
- purchase rail is decomposed so CTA can appear before all trust/meta subparts
- client-side overlays and loading shells for the detail route must stay presentation-only; `ResourceDetailLoadingShell` now owns its own fallback markup instead of importing `ResourceDetailSections.tsx`, which prevents `ResourcesNavigationOverlay` from dragging `@/services/platform`, viewer-state services, or resource mutations into the browser bundle during dev compilation

## Dashboard / Admin

```
dashboard/* → force-dynamic, per-user
admin/*     → force-dynamic, role-gated
  analytics/report reads
    → `unstable_cache` for per-instance reuse
    → Redis `rememberJson` for cross-instance warm hits on heavy report paths
```

Admin settings note:
- build-safe platform config is only for branding-only build surfaces
- `/admin/settings` must read live DB-backed platform settings
- admin brand-asset editing must distinguish stored values from inherited preview fallbacks
- `/admin/settings` now also persists dedicated dark-surface logo fields (`logoFullDarkUrl`, `logoIconDarkUrl`) instead of overloading the light navigation logos
- both `src/app/(dashboard)/layout.tsx` and `src/app/admin/layout.tsx` now keep session/auth-driven shell resolution behind family-scoped `Suspense` boundaries (`DashboardGroupLoadingShell`, `AdminDashboardLoadingShell`) instead of awaiting that work directly in the async layout entrypoint
- this route-family boundary change exists to keep hard refreshes inside dashboard/admin loading shells rather than falling back to the global app-level loading UI while layout-level auth/viewer state resolves

## Authentication

```
NextAuth JWT strategy
  → credentials login
  → Google OAuth
  → role-aware protected routes
  → lightweight `/api/auth/viewer` reads JWT cookies directly and avoids Prisma-backed session resolution
  → password reset + soft email verification
```

## Build-Safe Platform Config

```
root layout / metadata / selected public pages
  → build-safe platform defaults

admin settings / live platform editing
  → DB-backed platform config

public logo / favicon / OG asset delivery
  → `/brand-assets/*` runtime routes
  → resolve latest DB-backed platform assets without forcing Prisma into build-time metadata generation
  → runtime asset delivery now guards against `/brand-assets/*` alias values stored in platform settings and falls back to concrete asset URLs instead of redirecting back to itself
  → runtime asset alias requests also bypass `src/proxy.ts`, so asset delivery no longer spends time in the ranking-cookie/proxy layer
  → the alias surface now includes `full-logo-dark` and `icon-logo-dark` for theme-aware navigation branding
  → the `Logo` stack requests fallback and active runtime logo images at high priority from SSR markup so branding assets are requested before most other route imagery without duplicating manual head preloads
  → the `Logo` client component keeps a local repo-owned fallback asset mounted underneath the runtime logo image, so refreshes do not show a blank brand slot while the current custom light/dark asset is still loading
  → dark runtime logo resolution now stays on the repo-owned dark fallback when no dedicated dark asset is stored, so dark refreshes do not settle onto an uploaded light logo after first paint
```

This separation exists to avoid Prisma build-time warnings and DB dependency in static build paths.

## Current Architectural Notes

- Build no longer runs `prisma migrate deploy`
- Root layout no longer performs a server-session read for every route
- `/resources` no longer reads session/cookies at the page level; auth-aware discover/listing state hydrates from a client-side viewer-state API that can start before NextAuth client-session readiness settles
- `/resources` viewer-state is now split so owned badges hydrate ahead of recommendation/discover personalization
- `/resources` owned-state hydration now reuses a short-lived browser cache keyed by authenticated viewer id, reducing repeat base-state fetches across quick marketplace navigations without sharing owned badges across users
- `/resources` and `/resources/[slug]` now defer auth-viewer resolution to idle time instead of eagerly probing auth on first hydration; auth-aware CTA components warm that viewer fetch on hover/focus/click intent
- `/resources` signed-in discover personalization now uses a short-lived private cache layer to reduce repeat recommendation work across navigations
- `/resources` learning-profile reads inside signed-in viewer-state now also use Redis + single-flight, so repeat cross-instance discover hydration does not keep rebuilding the same purchase-derived profile
- personalized discover now also reuses Redis + single-flight for user interest profiles and Phase 2 candidate pools, reducing cross-instance cold-tail work when multiple signed-in users share the same recommendation slice
- when Prisma pool pressure hits a cold discover refresh, section loaders now stop and fall back through the outer best-effort discover shell instead of spending extra DB queries on fallback IDs; development also keeps section-source loading sequential to avoid starving auth/session paths on tiny local pools
- recommendation impression writes no longer happen inside the cached discover loader; impressions are emitted from the client recommendation section when that section actually enters the viewport
- personalized client fetches for discover/review sections now also use short-lived browser-side dedupe to avoid re-requesting the same JSON during quick remounts
- signed-in marketplace discover hydration now also treats recommendation-path transient DB failures as best-effort and returns `null`/empty secondary sections instead of failing the private viewer-state route
- `/resources` with a search query now defaults to `relevance` sorting, while still allowing the user to switch to other marketplace sort orders within the matched set
- search synonym groups, recovery fallback terms, relevance weights, and match-reason copy now live in a shared `src/config/search.ts` config surface instead of being hardcoded inline across helpers and repository SQL
- the search config surface is now driven by typed term rules (`SEARCH_TERM_RULES`) plus shared weight/copy maps, so synonym and recovery tuning can happen in one place instead of editing helper logic and SQL together
- shared marketplace search inputs now use debounced typeahead suggestions from `/api/search`, with direct-result navigation for selected resources and canonical `/resources` navigation for full-result queries
- shared marketplace search inputs now also open an empty-query quick-browse panel on focus/click, using client-side recent searches plus curated marketplace/category shortcuts; typed queries still switch into the debounced `/api/search?view=suggestions` flow once enough text is present
- personalized discover sections now only expose `View all` when there is a truthful listing destination: category-driven "Because you studied ..." links go to that category's newest listing, while purely personalized recommendation slices no longer route users to a misleading generic trending page
- shared marketplace typeahead inputs now call `/api/search?view=suggestions`, which uses a lighter ranked-search result shape than the full search API and avoids review-count work that the dropdowns do not render
- typeahead suggestion fetches now reuse a short-lived browser-side cache, and no-result dropdown recovery now comes from a dedicated `/api/search/recovery` endpoint so the ranked search query is not rerun just to render fallback suggestions
- public search results and search-recovery payloads now reuse `unstable_cache` plus Redis + single-flight on the backend, reducing duplicate ranked-search and taxonomy work both within a warm instance and across repeated queries
- the shared ranked-search SQL no longer uses `COUNT(*) OVER()` on the result window; live search now fetches rows without a total-count path, while marketplace search computes totals in a separate CTE/fallback path so the API and listing flow avoid paying the same window-count cost
- the shared ranked-search SQL now filters candidate resources before computing expensive `tag_metrics` lateral aggregates, so title/category/creator matches no longer pay tag-similarity aggregation across the whole public catalog
- the public `/api/search` and `/api/search/recovery` routes now declare short-lived shared cache headers in source, but production verification on 2026-04-01 only surfaced `Cache-Control: public`, so infra-level response caching should not yet be treated as a verified win
- `/api/internal/ready` now exists as a no-store readiness probe for local/remote smoke verification, and shared search/auth smoke flows use it before hitting `/resources`, `/api/search`, or `/api/auth/viewer`
- the readiness payload now reports `service: "krukraft"` so smoke diagnostics and local tooling no longer expose the legacy `studyplatform` identifier
- `/resources` no-result search states now render a server-first recovery panel with alternate query suggestions, category/tag browse links, and quick routes back into trending/free/discover inventory
- `/resources` switches from discover mode to listing mode whenever search, filters, pagination, or non-default sort are active; category is no longer the only trigger
- `/resources` listing headings now distinguish search results from general browsing so search-without-category flows render as "Search results" instead of inheriting browse copy
- public resource thumbnails and search-result thumbnails now use a simplified shared `RevealImage` primitive that favors stable, always-visible image rendering over JS-driven reveal state; container backgrounds now own the placeholder treatment so cached/fast image loads cannot get stuck hidden behind an overlay
- remote preview images on optimizer-compatible hosts (`*.r2.dev`, Google avatars) no longer bypass Next Image by default, so cards/search/detail previews can benefit from Next's optimization pipeline and modern output formats
- Next Image output now advertises both AVIF and WebP, which improves the chance of smaller payloads on supported browsers
- above-the-fold marketplace hero, spotlight, and leading grid-card images can now opt into eager loading without changing the default lazy behavior for the rest of the catalog; discover sections now carry eager state forward for duplicate preview URLs, and search-result listings widen the eager window when a query is active so Lighthouse/browser runs do not keep flagging lower first-page cards as lazy LCP candidates
- the detail preview gallery now marks both the main preview image and the currently active matching thumbnail as eager/high-priority so duplicate-src thumbnails do not re-trigger Next dev LCP warnings by overwriting the main priority image entry
- `/resources` discover hero is now a fixed repo-owned banner contract, so the route no longer carries the older hero resolver/cache/analytics path at all
- `/resources/[slug]` no longer reads session/cookies at the page level; ownership/success now hydrate ahead of owner-review state from the client-side detail viewer-state API, and post-checkout refresh can bypass the short-lived ownership cache
- `/resources/[slug]` detail viewer-state now waits for the lightweight auth viewer before calling the private detail viewer-state API, so anonymous detail visits skip that extra request
- `/resources/[slug]` detail purchase rail now holds a structural "Checking your library…" placeholder instead of flashing a buy CTA before deferred ownership state resolves
- marketplace search and admin user lookup now have trigram index coverage on their joined text columns plus the `Resource.slug`, `Category.slug`, and `Tag.slug` fields that the ranked SQL also searches via `ILIKE`/similarity
- private ownership checks now use short-lived per-user/per-resource `unstable_cache` reads to reduce repeat signed-in viewer-state DB work
- navbar, pricing, and buy-button auth-aware client UI now share a lightweight `/api/auth/viewer` fetch instead of using global NextAuth client session state
- the auth viewer hook now always starts from a stable signed-out/loading snapshot on first render, and navbar auth actions reserve space with loading placeholders until that viewer fetch resolves
- local dev/HMR-only transient auth-viewer network failures now resolve back to the signed-out snapshot without logging noisy `[AUTH_VIEWER_HOOK] Failed to fetch` errors, while non-transient and production failures still log normally
- public navbar auth fetches now defer to browser idle time by default and warm early on hover/focus/menu interaction, reducing eager post-hydration auth work on anonymous traffic without reintroducing root-layout session reads
- pricing and purchase CTA buttons also defer auth-viewer fetches to idle time, then explicitly prime the same request on interaction so clicks do not block on a stale eager probe
- admin analytics/creator pages rely on the admin layout auth gate instead of repeating the same session check inside each page
- Post-deploy warm/perf workflow includes smoke coverage for resources home, listings, creator detail, resource detail, and category listing
- search/auth verification now has repo-owned smoke commands: `npm run smoke:local:search` for localhost and `npm run smoke:prod:search` for the production alias; other environments can reuse the same script with `BASE_URL=... npm run smoke:search`
- key browser verification now also has a repo-owned `npm run smoke:local:browser` path that exercises the main public search/detail/auth-guard flows plus authenticated admin/creator preview-image uploader flows before merge
- GitHub Actions now also owns a cloud browser verification path via `.github/workflows/browser-smoke.yml`; that workflow provisions Postgres 16, applies schema with `prisma db push`, seeds demo data, and runs `npm run smoke:browser:ci` so browser regressions can be checked without relying on a specific local machine's Playwright/browser runtime
- Playwright browser automation is now scaffolded for local/CI use via `playwright.config.ts` and `npm run test:e2e`; the local project still uses the `chromium` project name, but it now defaults to `channel: "chromium"` so local verification uses Playwright's bundled Chromium browser instead of the headless shell or installed Chrome stable. Use `PLAYWRIGHT_BROWSER_CHANNEL=chrome` only when you explicitly need installed-Chrome verification
- browser-level route coverage now includes `/resources`, top-bar search submit into canonical `/resources?search=...`, canonical search results, no-results recovery, resource detail image rendering, and authenticated preview-image uploader flows on both `/admin/resources/new` and `/dashboard/creator/resources/new`
- the cloud browser smoke scope intentionally excludes uploader specs for now, because uploader coverage needs storage configuration that the repo-owned CI workflow does not provision by default; uploader flows remain part of the local smoke path instead of the baseline GitHub Actions gate
- browser-level search coverage now also verifies the empty-query quick-browse dropdown and recent-search chip behavior before the canonical search submit path
- browser-level discover coverage now also verifies that the "Featured picks" `View all` CTA opens the featured listing filter instead of falling through a legacy sort alias, and that the seeded creator discover shell does not expose misleading personalized CTA affordances when no history-backed personalized slice exists
- browser-level verification tooling now also includes `@axe-core/playwright` for in-test accessibility checks, `@lhci/cli` via `.lighthouserc.json` for Lighthouse route audits, and `@next/bundle-analyzer` behind `ANALYZE=true` / `npm run analyze` for bundle inspection
- Storybook is now scaffolded only for `src/design-system/primitives/*` and `src/design-system/components/*`, with repo-owned config under `.storybook/` and a verified build-based smoke path via `npm run storybook:smoke`
- Chromatic CLI is also installed as an optional Storybook publish/review layer for visual regression work, but it is dormant until a `CHROMATIC_PROJECT_TOKEN` is configured
- Repomix is also installed as a local AI-context export utility, with repo-owned `.repomixignore` rules to keep secrets, generated artifacts, and local tool state out of packed outputs
- local browser automation against `http://127.0.0.1:3000` is now explicitly allowed through Next's `allowedDevOrigins`, so Playwright no longer depends on blocked dev-resource/HMR fallbacks when it uses that origin
- optional skeleton generation can now be layered in via `boneyard-js` (`boneyard.config.json`, `src/bones`, `npm run skeleton:boneyard:build`), but the repo still treats route-level loading/fallback design as a first-class contract rather than replacing everything with generated bones
- the global CSP header now explicitly allows `https://va.vercel-scripts.com`, matching the Vercel Analytics / Speed Insights scripts that the app mounts in runtime
- root metadata now also serves `robots.txt` from `src/app/robots.ts`; the file is generated from build-safe public platform config so local/public crawlers stop seeing a 404 without reintroducing DB-backed metadata reads
- `src/proxy.ts` no longer imports `next-auth/middleware`; request interception now uses direct JWT inspection via `next-auth/jwt`, which keeps the protected-route behavior explicit while trimming one middleware helper layer from the hot request path
- admin notification toasts now use CSS-only entry animation, and preview-image drag/drop uploaders use a native file-input + drag/drop implementation behind a lazy client boundary that mounts on visibility or user interaction so admin/creator forms do not pull notification motion runtime or uploader-specific package code into the first render path
- creator resource create/edit pages now also load the heavy client form through `next/dynamic` with structural loading shells, and admin create-form lazy loading now includes a matching form skeleton instead of a blank gap while the client chunk resolves
- discover-mode `/resources` now trims its curated section source pool from 8 to 6 candidates and renders 4 cards per server section/fallback row, which reduces the hot-path HTML/render workload without changing listing-mode result counts
- the `/resources` category chip rail no longer asks Prisma for per-category `_count` data on the hot path; discover category loading now uses a lean `id/name/slug` projection because the chip UI never rendered counts
- Category landing pages intentionally use `newest` for their first-page curated feed
- protected download redirects now allow the branded bucket host `files.krukraft.com`, matching the repo's current R2/public URL guidance instead of the old `cdn.studyplatform.com` example
- `src/env.ts` is the central server env validation surface

---

*Refreshed against the repo state on 2026-04-05.*
