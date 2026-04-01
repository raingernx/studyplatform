# KruCraft — Architecture

## Layered Architecture (Strict Rule)

```
API Route → Service → Repository → Prisma
```

- Never call Prisma directly from route handlers or components
- Services own business logic and orchestration
- Repositories own data access
- This pattern is actively maintained in the repo

## Key Architecture Constraints

- Do not break auth, purchase, upload, or download flows
- Do not move business logic back into routes
- Prefer server components where possible
- Do not modify authentication logic casually
- Keep build-safe and runtime-dynamic paths separate

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
    → discover hero uses a static anonymous seed
    → listing/discover content streamed separately
    → listing caches keyed by sort/category/page
    → client viewer-state hydration restores owned badges first
    → signed-in discover personalization now hydrates in a second client fetch after owned-state is ready
    → viewer-state can start before any heavier personalized discover work is resolved
    → `/api/resources/viewer-state` serves `scope=base|discover` so ownership and recommendation work stay decoupled
    → signed-in discover payloads use short-lived private caching to smooth repeat navigations
    → recommendation impressions are now recorded from client-side section exposure via `/api/recommendations/impression`, not from discover cache misses
    → post-deploy warm + smoke perf workflow
    → selective usable fallbacks where they match final section intent
```

Root rendering note:
- the root app layout uses build-safe public platform config only and does not read the authenticated server session
- the root client provider tree no longer mounts `SessionProvider`; public routes avoid the NextAuth client-session baseline by using targeted auth-viewer fetches only where auth-aware UI is needed
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
    → detail base viewer-state now reuses a short-lived browser cache keyed by resource + viewer
    → owner review form hydrates in a second client fetch after ownership is known
    → refresh polling can bypass the short-lived private ownership cache after checkout
    → related section deferred separately
```

Key details:
- viewer-specific ownership/success state now hydrates from `/api/resources/[id]/viewer-state?scope=base`
- owner review state hydrates separately from `/api/resources/[id]/viewer-state?scope=review`
- anonymous detail views skip the detail viewer-state API entirely until auth-aware UI is actually needed
- remote preview images bypass `/_next/image` in many places to reduce LCP and image-optimizer bottlenecks
- purchase rail is decomposed so CTA can appear before all trust/meta subparts

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

## Authentication

```
NextAuth JWT strategy
  → credentials login
  → Google OAuth
  → role-aware protected routes
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
- recommendation impression writes no longer happen inside the cached discover loader; impressions are emitted from the client recommendation section when that section actually enters the viewport
- personalized client fetches for discover/review sections now also use short-lived browser-side dedupe to avoid re-requesting the same JSON during quick remounts
- `/resources` with a search query now defaults to `relevance` sorting, while still allowing the user to switch to other marketplace sort orders within the matched set
- search synonym groups, recovery fallback terms, relevance weights, and match-reason copy now live in a shared `src/config/search.ts` config surface instead of being hardcoded inline across helpers and repository SQL
- the search config surface is now driven by typed term rules (`SEARCH_TERM_RULES`) plus shared weight/copy maps, so synonym and recovery tuning can happen in one place instead of editing helper logic and SQL together
- shared marketplace search inputs now use debounced typeahead suggestions from `/api/search`, with direct-result navigation for selected resources and canonical `/resources` navigation for full-result queries
- shared marketplace typeahead inputs now call `/api/search?view=suggestions`, which uses a lighter ranked-search result shape than the full search API and avoids review-count work that the dropdowns do not render
- typeahead suggestion fetches now reuse a short-lived browser-side cache, and no-result dropdown recovery now comes from a dedicated `/api/search/recovery` endpoint so the ranked search query is not rerun just to render fallback suggestions
- public search results and search-recovery payloads now reuse `unstable_cache` plus Redis + single-flight on the backend, reducing duplicate ranked-search and taxonomy work both within a warm instance and across repeated queries
- the shared ranked-search SQL no longer uses `COUNT(*) OVER()` on the result window; live search now fetches rows without a total-count path, while marketplace search computes totals in a separate CTE/fallback path so the API and listing flow avoid paying the same window-count cost
- the shared ranked-search SQL now filters candidate resources before computing expensive `tag_metrics` lateral aggregates, so title/category/creator matches no longer pay tag-similarity aggregation across the whole public catalog
- the public `/api/search` and `/api/search/recovery` routes now declare short-lived shared cache headers in source, but production verification on 2026-04-01 only surfaced `Cache-Control: public`, so infra-level response caching should not yet be treated as a verified win
- `/api/internal/ready` now exists as a no-store readiness probe for local/remote smoke verification, and shared search/auth smoke flows use it before hitting `/resources`, `/api/search`, or `/api/auth/viewer`
- `/resources` no-result search states now render a server-first recovery panel with alternate query suggestions, category/tag browse links, and quick routes back into trending/free/discover inventory
- `/resources` switches from discover mode to listing mode whenever search, filters, pagination, or non-default sort are active; category is no longer the only trigger
- `/resources` listing headings now distinguish search results from general browsing so search-without-category flows render as "Search results" instead of inheriting browse copy
- homepage/discover hero resolution now defaults anonymous callers to a static seed unless request-bound behavior is explicitly requested
- `/resources/[slug]` no longer reads session/cookies at the page level; ownership/success now hydrate ahead of owner-review state from the client-side detail viewer-state API, and post-checkout refresh can bypass the short-lived ownership cache
- `/resources/[slug]` detail viewer-state now waits for the lightweight auth viewer before calling the private detail viewer-state API, so anonymous detail visits skip that extra request
- `/resources/[slug]` detail purchase rail now holds a structural "Checking your library…" placeholder instead of flashing a buy CTA before deferred ownership state resolves
- marketplace search and admin user lookup now have trigram index coverage on their joined text columns plus the `Resource.slug`, `Category.slug`, and `Tag.slug` fields that the ranked SQL also searches via `ILIKE`/similarity
- private ownership checks now use short-lived per-user/per-resource `unstable_cache` reads to reduce repeat signed-in viewer-state DB work
- navbar, pricing, and buy-button auth-aware client UI now share a lightweight `/api/auth/viewer` fetch instead of using global NextAuth client session state
- the auth viewer hook now always starts from a stable signed-out/loading snapshot on first render, and navbar auth actions reserve space with loading placeholders until that viewer fetch resolves
- public navbar auth fetches now defer to browser idle time by default and warm early on hover/focus/menu interaction, reducing eager post-hydration auth work on anonymous traffic without reintroducing root-layout session reads
- pricing and purchase CTA buttons also defer auth-viewer fetches to idle time, then explicitly prime the same request on interaction so clicks do not block on a stale eager probe
- admin analytics/creator pages rely on the admin layout auth gate instead of repeating the same session check inside each page
- Post-deploy warm/perf workflow includes smoke coverage for resources home, listings, creator detail, resource detail, and category listing
- search/auth verification now has repo-owned smoke commands: `npm run smoke:local:search` for localhost and `npm run smoke:prod:search` for the production alias; other environments can reuse the same script with `BASE_URL=... npm run smoke:search`
- Category landing pages intentionally use `newest` for their first-page curated feed
- `src/env.ts` is the central server env validation surface

---

*Refreshed against the repo state on 2026-04-01.*
