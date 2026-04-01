# KruCraft — Performance Audit

## Summary

The public paths now have deliberate performance engineering in place:

- Upstash Redis + `unstable_cache` + single-flight dedup
- Leaner select projections for listing/detail shells
- RSC streaming decomposition on the resource detail page
- Root layout no longer reads the authenticated server session on every request
- Post-deploy warm-cache + smoke perf workflow
- Remote preview image delivery optimized to bypass `/_next/image` where that path was hurting LCP
- Build-safe platform config on branding-only build paths

Primary bottleneck class is now:

**client personalization latency after hydration plus cold-instance cache misses on heavy query paths**, not basic bundle size or simple rendering overhead.

---

## Important Fixes Already Landed

- `npm run build` no longer runs `prisma migrate deploy`
- post-deploy warm + smoke workflow is active
- resource detail route was decomposed into shell + deferred purchase/body/footer/review/related paths
- optional session work was pushed off several anonymous critical paths
- public remote preview images bypass `/_next/image` in many high-value surfaces
- build-time Prisma warning from `platformSettings.findFirst()` was removed by separating build-safe platform config from admin live config
- root layout stopped SSR-seeding `SessionProvider` from `getServerSession`, which restores a cleaner caching baseline for public routes
- the root client provider tree no longer mounts `SessionProvider`; auth-aware navbar/pricing/checkout UI now use a smaller `/api/auth/viewer` fetch instead of the global NextAuth client-session baseline
- the auth-viewer hook no longer hydrates from module cache during the initial render, which avoids navbar server/client drift; navbar auth controls now hold their footprint with lightweight loading placeholders until the viewer request settles
- `/resources` stopped reading cookies/session at the page level; auth-aware owned badges and signed-in discover sections now hydrate from `/api/resources/viewer-state`
- `/resources` marketplace viewer-state is now split into `scope=base` and `scope=discover` so owned badges can hydrate before heavier recommendation payloads
- `/resources` base viewer-state now uses a short-lived browser cache keyed by viewer id, reducing repeat owned-badge fetches on quick signed-in marketplace navigations without risking cross-user bleed
- `/resources` signed-in discover payloads now use short-lived private Redis + `unstable_cache` reuse so repeat navigations do not recompute the full recommendation state every time
- purchase-derived learning profiles used by signed-in discover hydration now also go through Redis + single-flight, reducing cross-instance rebuilds of the same viewer profile
- personalized discover now also pushes user-interest profiles and shared Phase 2 candidate pools through Redis + single-flight, which cuts cross-instance recomputation when recommendation requests fan out
- repeat personalized client JSON fetches now use a small browser-side TTL/dedupe cache, reducing quick remount/refetch churn for discover and owner-review sections
- discover hero anonymous selection now uses a static seed instead of request cookie/header inputs on the marketplace route, and anonymous callers now default to that static seed unless they explicitly opt into request-bound behavior
- trigram index coverage now extends beyond `Resource.title/description` to `Category.name`, `Tag.name`, `User.name`, and `User.email` so marketplace search and admin user lookup avoid the remaining text-search scan hotspots
- marketplace search and live search now share a broader weighted relevance query across title, slug, description, category, tag, and creator fields instead of using narrower title/description-only listing filters
- search now tokenizes multi-word queries and expands a small synonym/alias set for common study terms, which improves recall without adding a separate search engine
- search result pages default to `Best match` when a query is present, while still allowing alternate marketplace sort orders for the matched set
- shared public search bars now debounce suggestion fetches and always route full-result queries back to canonical `/resources` results, avoiding the old pattern of appending `?search=` to unrelated public routes
- typeahead search now reuses a short-lived browser-side suggestion cache, and no-result dropdown recovery now calls a dedicated `/api/search/recovery` endpoint so the ranked search query is not executed twice for the same miss
- ranked search results and recovery payloads now sit behind short-lived `unstable_cache` plus Redis + single-flight layers on the backend, cutting duplicate work both on warm instances and across repeated public queries
- the same public search endpoints now send short-lived shared cache headers, giving CDN/edge layers a response-cache path on top of the service-level cache
- no-result search UX now recovers with alternate query suggestions plus category/tag browse links, reducing dead-end searches without adding a separate search backend
- `/resources` search headings now render search-specific copy instead of falling back to browse headings on uncategorized searches
- `/resources/[slug]` stopped reading cookies/session at the page level; ownership, payment-success recovery, and owner-review UI now hydrate from `/api/resources/[id]/viewer-state`
- `/resources/[slug]` detail viewer-state is now split into `scope=base` and `scope=review` so purchase/success/ownership UI does not wait on the owner-review query
- anonymous `/resources/[slug]` visits now skip the private detail viewer-state API entirely until the lightweight auth viewer confirms the user is signed in
- viewer-state hydration now starts without waiting for NextAuth client-session readiness to settle first
- repeated signed-in ownership reads now use short-lived private `unstable_cache` entries, and detail refresh can bypass them after checkout
- category smoke route now matches its actual page intent and is warmed explicitly
- `/resources` discover fallback no longer swaps in fake CTA content while data resolves
- discover hero loading now falls back to a plain blue banner shell; discover sections fall back to section/card skeletons that match final geometry
- route-level `/resources/loading` now matches the discover UI more closely instead of showing a stale meta strip or a generic card wall
- creator activation and ranking debug admin reports now use short-lived service-level caching instead of re-running the same read-heavy queries every request
- platform metrics, purchase analytics, and recommendation report admin reads now use a Redis-backed cross-instance cache layer in addition to `unstable_cache`
- several admin analytics/creator pages no longer repeat `requireAdminSession()` inside the page because the admin layout already gates that subtree

---

## Current High-Value Optimization Areas

### 1. Cold-tail variance on warmed routes

- Smoke failures can still happen when a route is not warmed or is warmed against the wrong query path.
- Keep post-deploy warm targets aligned with the actual perf routes and route intent.

### 2. Discover feed cold path

- `/resources` is still a data-heavy route with multiple cached sections and post-hydration personalization.
- The route-level auth/cookie bottleneck was removed, and owned-state now hydrates ahead of recommendation/discover personalization.
- Signed-in personalization still depends on a private client fetch after hydration, but it no longer blocks owned badges and repeat navigations now reuse a short-lived private cache.

### 2.5 Auth-aware public chrome

- Global NextAuth client-session hydration was removed from the root.
- Remaining public auth-aware UI now depends on a lightweight auth-viewer request, which is smaller but still a client-side personalization step.

### 3. Search indexing

- Search still relies on `contains` / `ILIKE`-style matching.
- The major missing trigram indexes for marketplace/admin search are now covered; remaining search work would mean changing the search strategy itself, not just adding obvious indexes.
- The search strategy itself is now more usable than before, but it is still Postgres-backed relevance scoring, not a dedicated full-text/vector engine.

### 4. First query on resource detail pages

- Resource detail shell/body/footer/purchase decomposition is in place.
- The first `getResourceBySlug()` path is still the main blocking query to inspect if detail TTFB regresses again.
- The old route-level optional session bottleneck was removed, and ownership/success state no longer waits on the owner-review query.
- Signed-in detail personalization still depends on client viewer-state fetches after hydration, but owner review is now a secondary fetch instead of part of the purchase-critical path.
- Anonymous detail visits no longer spend a client request on ownership state they cannot have.

### 5. Recommendation / related tail latency

- Personalized discover sections and related-content sections can still lag behind the shell.
- Fallbacks are now more consistent with final content, but these sections are still natural perf hotspots.

---

## Current Known Ops / Perf Notes

1. Production/build path still warns that `XENDIT_SECRET_KEY` is a test key
2. Perf thresholds should stay aligned with what warm-cache actually warms
3. Search still deserves real DB indexing work
4. Future regressions should be judged against the warmed perf workflow, not older cold-path assumptions

---

## What Is No Longer the Main Source of Truth

Older assumptions that should not be treated as current truth:

- “Build runs migrations” — false now
- “Platform settings DB lookup warns during build” — fixed
- “Resource detail is monolithic and blocks on session/trust/reviews” — largely fixed
- “Every public preview image should go through `/_next/image`” — false now

---

*Refreshed against the repo state on 2026-04-01.*
