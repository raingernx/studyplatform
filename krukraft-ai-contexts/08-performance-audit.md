# Krukraft — Performance Audit

## Summary

The public paths now have deliberate performance engineering in place:

- Upstash Redis + `unstable_cache` + single-flight dedup
- Leaner select projections for listing/detail shells
- RSC streaming decomposition on the resource detail page
- Root layout no longer reads the authenticated server session on every request
- Root theme bootstrap now paints `light` by default and applies stored dark/system overrides before hydration, which removes the previous white-first flash without waiting for the client theme effect
- `UserPreference.theme` now defaults to `light` at the Prisma/database layer too, so runtime bootstrap and newly created stored preferences no longer disagree about the baseline theme
- the settings preference form now locks the currently rendered runtime theme into `localStorage` the first time a user opens `/settings` without an existing stored theme, so the page no longer appears to auto-flip to an older DB-backed theme preference on entry
- local browser debugging now has a repo-owned Playwright API probe path (`npm run browser:probe`) for launch, discover/library transitions, and settings-theme verification; this exists because the current macOS environment can still abort during `playwright test` browser launch even when direct Playwright API launch succeeds
- dashboard/browser verification is now split into two repo-owned probe surfaces: `npm run browser:probe:dashboard` still covers the main cross-route dashboard transitions (downloads, purchases, settings) after entering the dashboard shell, while `npm run browser:probe:management` now adds hard-refresh shell checks for the main dashboard, creator, and admin entry routes so wrong-level app-root fallback regressions are not limited to manual repeated-refresh testing
- the GitHub Actions browser-smoke workflow now treats cloud CI as Chromium-only on purpose: it caches the Playwright browser bundle at `${{ github.workspace }}/.cache/ms-playwright`, installs only Chromium, and disables the local-only WebKit fallback path so `Install Playwright Browsers` does not keep re-downloading or provisioning an unused browser on every run
- the repo-owned browser probe now also samples public ↔ dashboard navigation coverage directly: the `resources-to-library` and `library-to-resources` scenarios record `data-loading-scope` frames and fail on blank-gap transitions, so dashboard-shell regressions are no longer limited to the heavier Playwright spec path
- the root layout now also mounts a lightweight `ResourcesEntryNavigationOverlay` for cross-group jumps into `/resources`, so dashboard/library → marketplace transitions can hold a `resources-browse` loading scope before the resources route group mounts and the repo-owned browser probe can catch missing coverage instead of silently skipping that gap
- the same probe layer now has a `dark-theme-logo` scenario that forces dark first paint, delays dark-logo asset delivery, and asserts the dark fallback layer stays visible instead of briefly exposing the light-theme logo while the custom asset is still loading
- the same repo-owned browser-probe layer now also covers direct-load public/admin informational pages (`npm run browser:probe:pages`) plus authenticated admin-analytics and creator-management flows (`npm run browser:probe:management`); GitHub Actions now runs the management probe in its own `Management Browser Probes` job, separate from the main `Browser Smoke` job, so management-route verification still executes even if the primary smoke bundle fails before later probe steps
- the same management/browser-probe layer now also has dashboard-overview, dashboard-library, downloads, purchases, settings, and membership hard-refresh shell checks plus creator hard-refresh shell checks, so the main `/dashboard*` and settings/subscription surfaces can catch brief app-root fallback regressions as runtime verification classes instead of relying on manual repeated refreshes
- the same management/browser-probe layer now also has admin-overview and admin-analytics hard-refresh shell checks, so the main `/admin` family entry surfaces can prove they stay inside the admin loading family instead of briefly surfacing the app-root fallback on repeated refreshes
- the same management/browser-probe layer now also has a creator resource-editor hard-refresh check, so `/dashboard/creator/resources/new` proves the dedicated `dashboard-creator-resource-editor` route-ready marker instead of relying only on the generic creator-shell probe
- the same management probe surfaced a real creator-analytics runtime bug on 2026-04-06: one creator repository raw query still joined `"ResourceStat"` instead of Prisma's mapped `"resource_stats"` table, which only showed up once `/dashboard/creator/analytics` was added to CI coverage
- the GitHub Actions browser-smoke workflow now explicitly enables the Postgres `pg_trgm` extension before `prisma db push`; CI does not replay raw migration SQL during `db push`, so the extension must be provisioned directly or the search/recommendation smoke routes fail on `similarity(...)`
- verification policy is now stricter at close-out time: Browser Smoke and post-deploy warm/perf runs are not considered "clean" from workflow status alone; operators are expected to review logs for hidden `flaky`, `retry #`, timeout, and threshold-failure signals before calling a run stable
- Post-deploy warm-cache + smoke perf workflow, with a manual `workflow_dispatch` fallback for CLI-driven deploys
- Warm workflow installs now retry `npm ci` and preserve install logs as artifacts, which makes failed warm runs debuggable even when the job dies before `warm-cache.log` exists
- The same post-deploy workflow now installs on Node 24 instead of Node 20 so GitHub Actions uses the same lockfile/npm resolution behavior that currently passes locally
- GitHub-maintained actions inside that workflow are now on `checkout@v6`, `setup-node@v6`, and `upload-artifact@v6`; the remaining Node 20 deprecation warning surface is expected to come from `grafana/setup-k6-action@v1` until Grafana publishes an explicitly updated action/runtime line
- Optimizer-compatible preview images now stay on Next Image by default, with selective bypass only for sources that are not safely optimizable
- Above-the-fold marketplace hero, spotlight, and card images now use targeted eager loading instead of blanket eager behavior
- Build-safe platform config on branding-only build paths

Primary bottleneck class is now:

**client personalization latency after hydration plus global client-JS overhead on public routes and cold-instance cache misses on heavy query paths**, not basic bundle size or simple rendering overhead.

Current perf-hardening baseline for the production UX initiative is:

- prioritize `/resources`, `/resources/[slug]`, `/creators/[slug]`, `/categories/[slug]`, and the warmed listing-control routes before broader infra changes
- treat warm failures as route-class incidents, not generic "deploy was slow" noise
- keep current p95 budgets as the baseline while cache-path and warm-shape mismatches are still being removed
- prefer code/cache/streaming fixes first; infra changes should only be discussed after the same route still shows tail spikes once warm targets and cache layers are aligned

---

## Important Fixes Already Landed

- `npm run build` no longer runs `prisma migrate deploy`
- post-deploy warm + smoke workflow is active, and can now be triggered manually when production deploys bypass GitHub deployment events
- resource detail route was decomposed into shell + deferred purchase/body/footer/review/related paths
- `/resources/[slug]` now keeps the route-entry shell cache separate from the metadata cache, so the blocking detail-shell read no longer carries the long-form description field that already streams later in the body section
- optional session work was pushed off several anonymous critical paths
- public remote preview image delivery now keeps optimizer-compatible hosts on Next Image, while still bypassing the optimizer for GIFs, non-HTTPS assets, and non-allowlisted hosts
- build-time Prisma warning from `platformSettings.findFirst()` was removed by separating build-safe platform config from admin live config
- root layout stopped SSR-seeding `SessionProvider` from `getServerSession`, which restores a cleaner caching baseline for public routes
- the root client provider tree no longer mounts `SessionProvider`; auth-aware navbar/pricing/checkout UI now use a smaller `/api/auth/viewer` fetch instead of the global NextAuth client-session baseline
- route-group navigation overlays are no longer mounted globally from `src/app/layout.tsx`; `ResourcesNavigationOverlay` now lives in `src/app/resources/layout.tsx` and `DashboardGroupNavigationOverlay` now lives in `src/app/(dashboard)/layout.tsx`, which trims client JS/hydration work from unrelated routes
- the full `HeroSearch` client bundle is now lazy-loaded on secondary public routes (support, category, creator, membership, resource-detail, and error/not-found surfaces), while loading shells now render the structural search placeholder directly instead of importing `HeroSearch`
- `HeroSearch` runtime code no longer carries bones-preview exports and fixture data in the same module; those previews now live in `HeroSearchPreviews.tsx`, so dev-only search fixtures do not pad the live marketplace search bundle
- the signed-in `/resources` personalized discover section now sits behind a dedicated lazy client boundary with a matching structural skeleton, so the main discover route no longer ships recommendation-section client logic in its initial payload
- public-route render hardening on 2026-04-08 narrowed the `/resources` viewer-state provider to viewer-aware card/personalization subtrees, so browse headings/filter chrome and other static server content no longer sit inside the owned-state hydration boundary
- the same pass also changed marketplace listing reads to overlap cached category-sidebar loading with the primary listing query whenever category-id resolution is not needed up front, removing a serial await from the common unfiltered listing/search paths
- the follow-up pass on 2026-04-08 moved `/resources` no-results search recovery behind a nested server `Suspense` boundary and out of the viewer-state grid path, so search-empty shells can stream before taxonomy recovery suggestions finish and that branch no longer hydrates the owned-state grid just to show recovery links
- the same pass narrowed `/resources/[slug]` detail viewer-state to the success/purchase/owner-review subtree and switched detail metadata to the lighter metadata reader, so the public detail shell avoids both an unnecessary full-payload metadata read and a route-wide personalization wrapper
- a follow-up client-payload pass on 2026-04-08 now lazy-loads the `/resources/[slug]` owner-review form only after base viewer-state confirms the viewer owns the resource, keeping that review-form bundle off anonymous and non-owner detail visits
- a later hydration-scope pass on 2026-04-08 moved `/resources` listing owned-state hydration into `ResourceGrid`'s deferred owned-id hydrator, so the main marketplace grid no longer sits under `ResourcesViewerStateProvider`; the route now keeps that provider only around the single spotlight card while the grid shell streams and patches owned badges afterward
- another discover-path follow-up on 2026-04-08 restored a server-rendered default "Top picks" section on `/resources` and only lazy-loads the heavier personalized discover module for authenticated viewers, so anonymous traffic no longer waits on that client bundle just to see the first recommendation row
- the next follow-up on 2026-04-08 moved `/resources` discover `Trending now` out of the shared personalized provider subtree and lets that section patch owned badges through its own deferred base-state fetch, trimming the remaining viewer-state boundary in discover mode down to the personalized module itself
- LHCI now samples the key `/resources` routes twice per run and treats the overall performance category, total blocking time, and cumulative layout shift as blocking floor assertions instead of advisory warnings, so obvious lab regressions fail faster before they hide behind a single noisy pass
- the post-deploy warm/perf workflow summary now emits a rollup with pass/fail counts, the worst p95 route, and the route closest to its budget, so production perf regressions are easier to triage from the GitHub Actions summary without downloading artifacts first
- the GitHub Actions perf-summary append step now uses a parser-safe inline `node --input-type=module -e ...` command instead of a heredoc block, after a broken YAML parse on push proved the previous summary script was too fragile inside `run: |`
- the repo now also has a repo-owned workflow syntax gate: `scripts/check-workflow-syntax.mjs` parses every file under `.github/workflows/`, and `npm run lint` calls it so GitHub Actions YAML regressions are caught before push/CI parser failures
- the post-deploy warm step now re-hits `/resources` twice on purpose, because production checks on 2026-04-07 showed that the first warm hit for the public home shell can still take ~10s immediately after deploy even when the steady-state smoke budget passes afterward
- repo-owned browser probes now test transition/loading fidelity too, not just URL/heading success; public ↔ dashboard transitions are expected to show a matching loading scope with no blank `main` gap, and dark-theme brand chrome is expected to keep a dark fallback visible until any delayed custom dark asset finishes loading
- `/api/auth/viewer` now reads the signed JWT cookie through `next-auth/jwt` instead of `getServerSession`, which removes a Prisma-backed session lookup from the lightweight public auth-chrome path
- the marketplace/detail private viewer-state APIs now read the same signed JWT snapshot instead of `getServerSession`, which removes another public-route session lookup from the Prisma pool before owned-state/review queries begin
- the auth-viewer hook no longer hydrates from module cache during the initial render, which avoids navbar server/client drift; navbar auth controls now hold their footprint with lightweight loading placeholders until the viewer request settles
- public navbar auth resolution now defers to browser idle time and warms on interaction, which trims eager auth fetch pressure on public routes while keeping auth-aware chrome responsive when users engage it
- local dev/HMR transient auth-viewer network failures now fall back silently to the signed-out snapshot instead of spamming `[AUTH_VIEWER_HOOK] Failed to fetch`, which keeps browser/dev logs usable while preserving real production/non-transient error reporting
- `/resources` and `/resources/[slug]` viewer-state providers now also defer auth-viewer resolution to idle time, so the two main public content routes no longer eagerly call `/api/auth/viewer` on first hydration
- `/resources` stopped reading cookies/session at the page level; auth-aware owned badges and signed-in discover sections now hydrate from `/api/resources/viewer-state`
- `/resources` marketplace viewer-state is now split into `scope=base` and `scope=discover` so owned badges can hydrate before heavier recommendation payloads
- `/resources` base viewer-state now uses a short-lived browser cache keyed by viewer id, reducing repeat owned-badge fetches on quick signed-in marketplace navigations without risking cross-user bleed
- `/resources` signed-in discover payloads now use short-lived private Redis + `unstable_cache` reuse so repeat navigations do not recompute the full recommendation state every time
- purchase-derived learning profiles used by signed-in discover hydration now also go through Redis + single-flight, reducing cross-instance rebuilds of the same viewer profile
- personalized discover now also pushes user-interest profiles and shared Phase 2 candidate pools through Redis + single-flight, which cuts cross-instance recomputation when recommendation requests fan out
- when a cold discover refresh hits Prisma pool pressure, section loaders now stop and let the outer best-effort discover response degrade for that request instead of spending extra fallback DB queries; local development also keeps section-source loading sequential to avoid starving auth/session requests on the small local pool
- recommendation impressions are no longer written from the cached discover miss path; they now fire from a client-side section exposure tracker through `/api/recommendations/impression`, which keeps the cached discover loader read-only and aligns analytics with actual viewport exposure
- marketplace discover personalization now also treats recommendation-path transient DB failures as best-effort and can return `null`/empty secondary personalized sections instead of failing the private viewer-state route under pool pressure
- repeat personalized client JSON fetches now use a small browser-side TTL/dedupe cache, reducing quick remount/refetch churn for discover and owner-review sections
- the discover hero is now a fixed repo-owned banner contract, which removes the older hero resolver/cache/analytics path from the public marketplace route entirely
- `/brand-assets/*` runtime delivery now guards against self-referential alias values and falls back to concrete default assets instead of redirecting a logo/icon request back to the same runtime route
- `/brand-assets/*` runtime alias routes now also bypass `src/proxy.ts`, removing unnecessary proxy/ranking-cookie overhead from logo/favicon requests
- trigram index coverage now extends beyond `Resource.title/description` to `Category.name`, `Tag.name`, `User.name`, and `User.email` so marketplace search and admin user lookup avoid the remaining text-search scan hotspots
- marketplace search and live search now share a broader weighted relevance query across title, slug, description, category, tag, and creator fields instead of using narrower title/description-only listing filters
- search now tokenizes multi-word queries and expands a small synonym/alias set for common study terms, which improves recall without adding a separate search engine
- synonym groups, recovery fallback terms, relevance boosts, and match-reason copy now live in a shared config module, which makes search tuning cheaper and less error-prone than editing multiple code paths
- the search config is now driven by typed term rules plus shared weight/copy maps, which lowers the risk of helper/repository drift when tuning synonyms, fallbacks, or ranking behavior
- search result pages default to `Best match` when a query is present, while still allowing alternate marketplace sort orders for the matched set
- shared public search bars now debounce suggestion fetches and always route full-result queries back to canonical `/resources` results, avoiding the old pattern of appending `?search=` to unrelated public routes
- typeahead suggestions now use an explicit lightweight `/api/search?view=suggestions` mode, which trims the ranked-search result shape for dropdowns and avoids extra review-count work that live suggestions never display
- typeahead search now reuses a short-lived browser-side suggestion cache, and no-result dropdown recovery now calls a dedicated `/api/search/recovery` endpoint so the ranked search query is not executed twice for the same miss
- ranked search results and recovery payloads now sit behind short-lived `unstable_cache` plus Redis + single-flight layers on the backend, cutting duplicate work both on warm instances and across repeated public queries
- the shared ranked-search SQL no longer couples every result page to `COUNT(*) OVER()`; live search now reads ranked rows only, and marketplace search computes totals in a separate path when needed, which reduces unnecessary window-count work on the hottest search requests
- the ranked-search SQL now stages a cheaper candidate-resource filter before it computes `tag_metrics` via lateral aggregation, which removes one of the biggest remaining per-query costs from obvious title/category/creator matches
- trigram index coverage now also includes `Resource.slug`, `Category.slug`, and `Tag.slug`, so the ranked query's slug-based `ILIKE` and similarity branches are no longer leaning only on btree uniqueness indexes
- marketplace cards, search dropdown thumbnails, and resource preview galleries now use a simplified shared image primitive that keeps images visible by default and relies on the container background for placeholder treatment, eliminating the class of "image fetched but still hidden until refresh" regressions caused by JS reveal state drift
- optimizer-compatible remote preview images no longer bypass Next Image automatically, the app now allows AVIF alongside WebP, and above-the-fold marketplace card surfaces can opt specific images into eager loading to reduce residual LCP pressure without over-eagering the whole catalog
- local browser reruns on 2026-04-02 stopped reproducing the old Next dev `loading="eager"` advice on `/resources`, `/resources?search=worksheet`, and `/resources/[slug]` after widening the eager window for query-driven listings, carrying eager preview URLs forward across repeated discover/personalized cards, and marking the active duplicate-src detail thumbnail eager/high alongside the main priority image
- the same public search endpoints now declare short-lived shared cache headers in source, but production verification on 2026-04-01 only surfaced `Cache-Control: public`, so CDN/edge response caching is still an open follow-up rather than a verified gain
- no-result search UX now recovers with alternate query suggestions plus category/tag browse links, reducing dead-end searches without adding a separate search backend
- `/resources` search headings now render search-specific copy instead of falling back to browse headings on uncategorized searches
- local verification now has a repo-owned `npm run smoke:local:search` path that checks the search results page, no-results recovery page, `/api/search`, search recovery, and `/api/auth/viewer` sequentially with retries, avoiding the flakiness of ad-hoc localhost curls in constrained environments
- the shared smoke path now gates on `/api/internal/ready` before deeper route/API assertions, which separates server-readiness problems from search/auth regressions and makes local verification more stable
- `npm run smoke:prod:search` now reuses the same verification flow against `https://krukraft.com`, while preview deployments can use `BASE_URL=<preview-url> npm run smoke:search`
- Playwright now provides a browser-level smoke layer (`npm run test:e2e`) for catching hydration/image regressions that route/API smokes and k6 cannot see; the local project still uses the `chromium` project name, but it now defaults to `channel: "chromium"` so local verification uses Playwright's bundled Chromium browser instead of the headless shell or installed Chrome stable. Use `PLAYWRIGHT_BROWSER_CHANNEL=chrome` only when you intentionally need installed-Chrome verification
- browser-level coverage now includes `/resources`, top-bar search submit into canonical `/resources?search=...`, canonical search results, no-results recovery, resource detail image rendering, and authenticated preview-image uploader flows on `/admin/resources/new` plus `/dashboard/creator/resources/new`
- `npm run smoke:local:browser` is now the repo-owned pre-merge Playwright smoke bundle for those key public/auth/uploader flows, and Playwright defaults its local base URL to `http://127.0.0.1:3000` so the smoke path can bring up the dev server itself
- `.github/workflows/browser-smoke.yml` now adds a cloud browser-smoke lane on GitHub Actions: Ubuntu runner, Postgres service, `prisma db push`, `db:seed`, Playwright browser install, then lint + typecheck + `npm run smoke:browser:ci`
- Root-layout Vercel Analytics / Speed Insights script injection is now production-only, so local dev and GitHub Actions browser smoke runs no longer emit cross-origin telemetry load noise that can mask real UI/runtime failures.
- The global security-header profile is now split by environment: production keeps HSTS and CSP `upgrade-insecure-requests`, while local dev / GitHub Actions browser smoke skip those directives so localhost asset redirects are not silently rewritten to `https://localhost` and misreported as UI/runtime regressions.
- `npm run smoke:browser:ci` intentionally focuses the cloud gate on public/auth/navigation/settings browser coverage and skips uploader specs until the CI environment owns storage credentials/config that match those upload routes
- the repo now also has first-party hooks for accessibility and perf auditing at the browser layer: `@axe-core/playwright` can be used inside Playwright specs, `@lhci/cli` is configured through `.lighthouserc.json` for key `/resources` routes, and `@next/bundle-analyzer` is wired behind `npm run analyze`
- 2026-04-02 bundle follow-up removed `framer-motion` from the admin notification stack entirely, replaced `next-auth/middleware` in `src/proxy.ts` with direct `next-auth/jwt` checks, and switched preview-image drag/drop upload to a native file-input + drag/drop implementation behind a lazy client boundary that mounts only on viewport proximity or user intent; the follow-up analyzer/build state no longer includes `framer-motion`, `next-auth/middleware`, or `react-dropzone`
- the protected creator resource create/edit routes now also defer the heavy client form bundle behind `next/dynamic` with structural loading shells, and admin create-form lazy loading now renders a matching skeleton while the client chunk hydrates
- the `/resources` discover home now uses a smaller curated server payload: source pools are capped at 6 items per section, rendered server sections/fallback rows are capped at 4 cards, and the category chip loader now uses a lean category projection instead of querying category resource counts the UI never displayed
- Storybook is now available as a design-system-only surface for primitives/components; `npm run storybook:build` and `npm run storybook:smoke` are the verified paths right now because Storybook v10's `dev --smoke-test` flow hit a local CLI port bug in this environment
- Next dev now explicitly allows `127.0.0.1` in `allowedDevOrigins`, which removes a noisy class of local Playwright/HMR cross-origin failures during browser verification
- the CSP header now allowlists `https://va.vercel-scripts.com`, so local/runtime browser verification no longer reports Vercel Analytics / Speed Insights scripts as blocked console errors
- the app now serves a generated `robots.txt` from `src/app/robots.ts` using build-safe public platform config, closing the old local/public 404 without making metadata generation DB-bound
- `/resources/[slug]` stopped reading cookies/session at the page level; ownership, payment-success recovery, and owner-review UI now hydrate from `/api/resources/[id]/viewer-state`
- `/resources/[slug]` detail viewer-state is now split into `scope=base` and `scope=review` so purchase/success/ownership UI does not wait on the owner-review query
- anonymous `/resources/[slug]` visits now skip the private detail viewer-state API entirely until the lightweight auth viewer confirms the user is signed in
- viewer-state hydration now starts without waiting for NextAuth client-session readiness to settle first
- repeated signed-in ownership reads now use short-lived private `unstable_cache` entries, detail refresh can bypass them after checkout, and detail base viewer-state now also has a short-lived browser cache to smooth remounts/revisits
- the detail purchase rail now shows a structural "Checking your library…" placeholder while deferred ownership state resolves, preventing buy-CTA flicker for signed-in owners after auth probing moved to idle
- pricing and buy-button CTA components now reuse idle auth-viewer resolution and explicitly prime on user intent, which removes the remaining eager auth probe from those public CTAs without making first interaction feel dead
- `PriceLabel` now resolves through theme-aware DS text tokens instead of hardcoded dark text, which removed the dark-detail purchase-rail price contrast regression without needing per-page overrides
- category smoke route now matches its actual page intent and is warmed explicitly
- the post-deploy warm script now burst-aligns the hot `/resources`, listing-control, hot resource-detail, hot creator-detail, and category-detail routes to the same 5-VU class used by the smoke suite, and it now reheats the listing-control pair plus the hot resource-detail, category, and creator-detail routes as the final route-class warm steps before k6, with creator detail ending that band so the creator smoke arm is not cooled behind a later category pass; creator public profiles also gained a Redis-backed cross-instance cache layer on top of `unstable_cache`, reducing post-deploy cold-tail variance on `creator_detail_smoke`
- `/creators/[slug]` metadata now uses its own lighter cached metadata reader instead of reusing the full creator public-profile payload, the full creator-profile cache now inlines creator momentum/status-badge fields from the main profile query rather than issuing a second `creatorStat` lookup inside the cached loader, and the internal creator warm path now seeds both metadata and full-profile caches for the hot creator identifiers
- `/creators/[slug]` now also splits creator shell data from the published-resource grid on the server path: the route starts both cache-backed promises together, only blocks the page root on the lighter shell read, and streams the published-resource section behind a structural fallback while the creator warm path primes the new shell/resource caches too
- the post-deploy public warm script now reheats `listing_recommended` and `listing_newest` as the final route-class warm step before k6, after creator/category pages have already been warmed, so the two control-arm listing routes that have shown the most frequent fresh-instance tail spikes finish as the freshest warmed surfaces
- `/categories/[slug]` now starts its marketplace listing read once and streams the hero count plus listing section behind structural `Suspense` fallbacks, so the category hero shell no longer waits on the full category listing payload before first render
- the same category route now renders a static server-led card grid instead of hydrating `ResourceGrid`'s progressive-load/search-context client machinery, trimming client work from the public category listing surface
- `/resources` discover fallback no longer swaps in fake CTA content while data resolves
- discover hero loading now falls back to a neutral reserved stage that keeps the live hero footprint without previewing fake banner content; discover sections still fall back to section/card skeletons that match final geometry
- route-level `/resources/loading` now matches the discover UI more closely instead of showing a stale meta strip or a generic card wall
- creator activation and ranking debug admin reports now use short-lived service-level caching instead of re-running the same read-heavy queries every request
- platform metrics, purchase analytics, and recommendation report admin reads now use a Redis-backed cross-instance cache layer in addition to `unstable_cache`
- several admin analytics/creator pages no longer repeat `requireAdminSession()` inside the page because the admin layout already gates that subtree

---

## Current High-Value Optimization Areas

### Route-Class Incident Ledger Baseline

- `listing_newest_smoke`
  - main class: cold-instance fanout mismatch on the control/newest listing route
  - current mitigation: warm against `ranking_variant=A` and match the later smoke-VU fanout with a burst of `5`
- `creator_detail_smoke`
  - main class: creator public-profile tails can still appear on fresh instances when the route has to pay both metadata/profile work and the full creator page render under load
  - current mitigation: Redis-backed shared cache plus a stable `unstable_cache` wrapper per slug, lighter cached metadata reads for `/creators/[slug]`, inlined creator-stat fields inside the main profile query, shell/resources cache separation with streamed published-resource rendering, and burst-aligned warm coverage against the hot creator slug
- `category_listing_smoke`
  - main class: fresh-instance tail on category listing renders under the 5-VU smoke ramp and the route shell used to wait on the full listing payload before returning HTML
  - current mitigation: explicit category warm target with `repeat: 2` and `burst: 5`, plus streamed category shell/listing separation with structural in-page fallbacks
- `listing_recommended_smoke`
  - main class: the treatment/recommended listing route can still show cold-instance tail latency if warm only touches one worker, even when the control/newest path is already aligned
  - current mitigation: match the smoke route's 5-VU fanout with `repeat: 2` plus `burst: 5`
- `resource_detail_smoke`
  - main class: a single hot detail warm hit can still leave one late fresh instance cold during the later 5-VU smoke ramp even when the detail shell/data caches themselves are aligned
  - current mitigation: keep the detail shell cache narrow, separate metadata from the route-entry shell payload, warm the hot detail route with `repeat: 2` plus `burst: 5`, and reheat that same hot detail route again as one of the final warm steps before k6
- post-deploy warm endpoint layering
  - when `PERFORMANCE_WARM_SECRET` is available, the warm script should call `/api/internal/performance/warm` before the public HTTP fanout pass
  - intent: prime service-level Redis/precomputed listing caches first, then let route-level warming handle page shells, streamed HTML bodies, and image-optimizer hints
  - the workflow should not run a second standalone internal-warm step after route fanout; the final action before the smoke suite should stay the route-level warm pass so `/resources` and listing shells are the freshest warmed surfaces when k6 starts
- `resources_home_smoke`
  - main class: discover-home stream and page shell were still seeing fresh-instance tails after deploy
  - current mitigation: `/resources` now warms as a required route with `repeat: 3` and `burst: 5` so the discover-home shell sees the same 5-VU fanout shape the smoke suite later measures
- `listing_newest_smoke`
  - main class: the control/newest listing can still leave one late fresh instance cold even after the first burst-aligned pass
  - current mitigation: retain `burst: 5`, keep repeated warm passes, and reheat the listing route again as one of the last warm steps immediately before k6 begins
- `listing_recommended_smoke`
  - main class: the recommended listing can still spike when it was warmed successfully earlier in the sequence but is no longer the freshest route-class surface by the time k6 starts
  - current mitigation: retain `burst: 5`, keep repeated warm passes, and reheat the listing route again as one of the last warm steps immediately before k6 begins
- public route request-binding audit (2026-04-08)
  - `/resources`, `/resources/[slug]`, `/creators/[slug]`, and `/categories/[slug]` do not currently read `cookies()`, `headers()`, or server-session state at the page level
  - the remaining perf work should therefore focus on cache reuse, streaming shape, and hydration scope rather than re-removing obvious page-level request binding

### 1. Cold-tail variance on warmed routes

- Smoke failures can still happen when a route is not warmed or is warmed against the wrong query path.
- Keep post-deploy warm targets aligned with the actual perf routes and route intent.
- Some deploys still show first-hit or fresh-instance instability on `/resources`; the warm workflow now intentionally gives that route a second pass plus a small concurrent burst before k6 begins, instead of loosening the budget blindly.

### 2. Discover feed cold path

- `/resources` is still a data-heavy route with multiple cached sections and post-hydration personalization.
- The route-level auth/cookie bottleneck was removed, and owned-state now hydrates ahead of recommendation/discover personalization.
- Signed-in personalization still depends on a private client fetch after hydration, but it no longer blocks owned badges and repeat navigations now reuse a short-lived private cache.

### 2.5 Auth-aware public chrome

- Global NextAuth client-session hydration was removed from the root.
- Remaining public auth-aware UI now depends on a lightweight auth-viewer request, which is smaller but still a client-side personalization step.

### 2.75 Global client-JS scope

- Bundle/Lighthouse baseline work on 2026-04-07 still points to unused JavaScript / main-thread blocking as the clearest remaining client-side signal on `/resources` and `/resources/[slug]`.
- Route-specific transition overlays now mount only inside their matching route layouts, but further client-boundary and lazy-loading work is still a likely high-value path before deeper query refactors.

### 3. Search indexing

- Search still relies on `contains` / `ILIKE`-style matching.
- The major missing trigram indexes for marketplace/admin search are now covered; remaining search work would mean changing the search strategy itself, not just adding obvious indexes.
- The search strategy itself is now more usable than before, but it is still Postgres-backed relevance scoring, not a dedicated full-text/vector engine.

### 4. First query on resource detail pages

- Resource detail shell/body/footer/purchase decomposition is in place.
- The first `getResourceBySlug()` path is still the main blocking query to inspect if detail TTFB regresses again, but it now serves a narrower shell projection while metadata and description live in separate cached reads.
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
3. Search indexing is no longer the obvious gap; remaining work is query-plan tuning and deciding whether Postgres-backed relevance is still enough long-term
4. Future regressions should be judged against the warmed perf workflow, not older cold-path assumptions
5. LHCI is still configured against `npm run dev`, so local Lighthouse numbers remain useful for regression detection but not as production-grade LCP truth
6. The stronger LHCI gate is meant to catch obvious regressions early from the current repo baseline, not to replace warmed post-deploy k6 verification on production URLs or to act as an aspirational production budget by itself
7. Operational perf review order is now explicit: check the warmed post-deploy perf summary first, then Speed Insights, then runtime logs if the route still needs deeper investigation
8. Close-out reporting for non-trivial runtime work now also requires `Verification`, `Knowledge triage`, and `Residual risk`; a green workflow without log review is not a complete verification summary
9. A post-deploy run where `Warm Public Cache` passes but perf verification fails should be treated as its own recurring failure class: the workflow warmed successfully, but one or more measured route shapes are still unstable, mismatched with the warm target, or vulnerable to fresh-instance variance; when the failing smoke route ramps to 5 VUs, first check whether the warm burst still undershoots that fanout before loosening budgets
10. Hard-refresh reports that "dashboard briefly became another page" have recently resolved to wrong-level fallback hierarchy, not an actual router jump; check `src/app/loading.tsx` and route-family loading boundaries before treating that class as a route bug

---

## What Is No Longer the Main Source of Truth

Older assumptions that should not be treated as current truth:

- “Build runs migrations” — false now
- “Platform settings DB lookup warns during build” — fixed
- “Resource detail is monolithic and blocks on session/trust/reviews” — largely fixed
- “Every public preview image should bypass `/_next/image`” — false now

---

*Refreshed against the repo state on 2026-04-05.*
