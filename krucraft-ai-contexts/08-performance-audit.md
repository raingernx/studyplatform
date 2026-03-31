# KruCraft — Performance Audit

## Summary

The public paths now have deliberate performance engineering in place:

- Upstash Redis + `unstable_cache` + single-flight dedup
- Leaner select projections for listing/detail shells
- RSC streaming decomposition on the resource detail page
- Post-deploy warm-cache + smoke perf workflow
- Remote preview image delivery optimized to bypass `/_next/image` where that path was hurting LCP
- Build-safe platform config on branding-only build paths

Primary bottleneck class is now:

**cold-instance cache misses and remaining heavy query paths**, not basic bundle size or simple rendering overhead.

---

## Important Fixes Already Landed

- `npm run build` no longer runs `prisma migrate deploy`
- post-deploy warm + smoke workflow is active
- resource detail route was decomposed into shell + deferred purchase/body/footer/review/related paths
- optional session work was pushed off several anonymous critical paths
- public remote preview images bypass `/_next/image` in many high-value surfaces
- build-time Prisma warning from `platformSettings.findFirst()` was removed by separating build-safe platform config from admin live config
- category smoke route now matches its actual page intent and is warmed explicitly

---

## Current High-Value Optimization Areas

### 1. Cold-tail variance on warmed routes

- Smoke failures can still happen when a route is not warmed or is warmed against the wrong query path.
- Keep post-deploy warm targets aligned with the actual perf routes and route intent.

### 2. Discover feed cold path

- `/resources` is still a data-heavy dynamic route with multiple sections and experiment-aware behavior.
- It is much better than before, but remains one of the main places to watch after deploys.

### 3. Search indexing

- Search still relies on `contains` / `ILIKE`-style matching.
- Adding `pg_trgm` indexes remains a high-value DB-level improvement.

### 4. First query on resource detail pages

- Resource detail shell/body/footer/purchase decomposition is in place.
- The first `getResourceBySlug()` path is still the main blocking query to inspect if detail TTFB regresses again.

### 5. Recommendation / related tail latency

- Personalized and related-content sections can still lag behind the shell.
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

*Refreshed against the repo state on 2026-03-31.*
