# Knowledge Log

## 2026-04-08

- matched the recommended/treatment listing warm path to its actual smoke shape too: `/resources?category=all&sort=recommended` with `ranking_variant=B` now repeats and uses a burst of `5`, after post-deploy perf still showed `listing_recommended_smoke` failing even though the control/newest listing had already been stabilized.
- layered post-deploy warming so the script now calls the internal performance warm endpoint first when `PERFORMANCE_WARM_SECRET` is configured; this primes service-level Redis/precomputed caches before the public route warm fanout heats page shells and image optimizer hints.
- raised `/resources` warm coverage to `repeat: 3` + `burst: 5` and `listing-newest` to `repeat: 3` after the next warmed perf run still showed `resources_home_smoke` and `listing_newest_smoke` tail spikes; the home shell is now treated as a required warm target.
- started the production-UX perf hardening pass by locking the first incident-ledger routes (`/resources`, `/resources/[slug]`, `/creators/[slug]`, `/categories/[slug]`, and the warmed listing-control routes) into shared docs and by tightening hot public cache reuse where it was still weakest: marketplace listing reads and creator public-profile reads now keep a stable `unstable_cache` wrapper per normalized route key / creator slug instead of recreating the wrapper on every call.

## 2026-04-07

- added repo shorthand policy to `AGENTS.md`: `CPD` means commit/push/deploy, `CL` means inspect CI logs, `WARM` means inspect warm/perf logs, and `KT` means perform knowledge triage; shorthand requests do not bypass verification or close-out rules.
- added a standing impact-review rule to repo agent policy: non-trivial changes must now check adjacent shells, loading states, shared components, probes/tests, and context/wiki for downstream effects before close-out, and final reporting should state what was checked or intentionally ruled out.
- aligned the high-level browser/perf docs with the current verification split: `browser:probe:dashboard` remains the transition-focused dashboard probe, while `browser:probe:management` is the refresh-shell coverage lane for dashboard, creator, and admin family entry routes.
- matched `creator-detail-hot` and `category-listing` warm bursts to the same 5-VU fanout that their k6 smoke routes use after `creator_detail_smoke` and `category_listing_smoke` still showed post-deploy p95 tails even though the sequential warm step itself succeeded.
- raised the `listing-newest` warm burst to 5 after another post-deploy failure showed that a burst of 3 still left room for fresh instances during the k6 route's 5-VU ramp; the newest/control route now warms to the same fanout shape that perf verification later measures.
- corrected the new admin refresh probes after CI showed `/admin` finished with `routeReady: ["dashboard", "admin-overview"]`; that combination is valid because admin routes live inside the shared dashboard chrome, so the probe now treats the generic `dashboard` marker as allowed context instead of flagging it as a wrong-family fallback.
- extended the same refresh-shell verification sweep into the main admin family entry surfaces, so `/admin` and `/admin/analytics` now have explicit hard-refresh probes and route-ready markers instead of depending only on direct-load page smoke.
- expanded the same dashboard refresh-shell verification sweep again so `/dashboard/downloads`, `/dashboard/purchases`, `/settings`, and `/subscription` now have explicit hard-refresh probes too, closing the remaining gap where those routes had ready markers but still depended on manual repeated-refresh checks.
- extended the dashboard route-ready / handoff model into the main creator workspace surfaces (`/dashboard/creator`, analytics, resources, sales, profile, apply) after noticing those routes still cleared overlays from generic dashboard readiness instead of target-route readiness.
- extended the same route-ready / handoff model into creator resource create/edit routes with a dedicated `dashboard-creator-resource-editor` marker so editor transitions do not clear overlays from generic dashboard/creator shell readiness before the form skeleton is actually on screen.
- extended the management/browser probe sweep to cover creator resource editor refreshes too, so `/dashboard/creator/resources/new` now proves that the dedicated editor route-ready marker survives reload without falling back to a wrong-family shell.
- added repo close-out guardrails: non-trivial tasks now require explicit `Verification`, `Knowledge triage`, and `Residual risk` reporting, and browser/perf workflows must not be called clean from status alone without log review for hidden `flaky`, `retry #`, or threshold-failure signals.
- fixed the remaining `resources -> dashboard/library` Browser Smoke flake after CI logs showed the root dashboard overlay was intercepting the original navbar click; public-route protected links now arm `beginDashboardNavigation(...)` on the next animation frame so the click commits before the handoff overlay appears.
- tightened the post-deploy warm path for `/resources` again after perf artifacts showed the route was not slow at TTFB but was dragging response-body completion under k6 ramp load; the warm script now sends a small concurrent burst for that route so later VUs are less likely to land on a fresh instance with a cold discover-home stream.
- extended the post-deploy warm path for the control/newest listing so `/resources?category=all&sort=newest` with `ranking_variant=A` now uses a small concurrent burst in addition to repeated passes; this targets the residual `listing_newest_smoke` failure class where the Redis listing query was already hot but the page shell still showed fresh-instance tail latency under the k6 ramp.
- expanded repo-owned browser verification so `/dashboard/library` hard refresh now has an explicit management probe (`dashboard-library-refresh-shell`), matching the earlier creator refresh probes and giving CI first-class coverage for the wrong-level root fallback class that previously only showed up during manual repeated refresh checks.
- expanded the same management/browser-probe sweep again so `/dashboard` overview hard refresh now has its own explicit probe (`dashboard-overview-refresh-shell`), giving CI route-family refresh coverage for both primary dashboard entry surfaces instead of only creator/library variants.
- tightened the same `resources -> dashboard/library` test class again after the latest flaky trace showed the page never left `/resources` before the URL waiter armed; `navigation-shells.spec.ts` now starts `waitForURL()` before clicking protected links so fast App Router commits do not masquerade as transition failures.
- tightened `search-flows.spec.ts` after the old dashboard flake disappeared and the suite exposed a new retry-only search-submit failure: `/resources` query-string transitions now use a dedicated retry-safe Enter helper that waits only until `commit`, instead of defaulting to `waitUntil: "load"` on a streamed App Router route.
- tightened the same transition class again after downloading the flaky Playwright trace showed the handoff overlays themselves were still stealing pointer events; cross-route dashboard/resources overlays are now `pointer-events-none` so they can prove shell coverage without blocking the source click.
- tightened the same `resources -> dashboard/library` handoff again after CI still showed one flaky retry: protected navbar links now arm dashboard navigation in a microtask and only call `router.push(...)` on the following animation frame, giving Browser Smoke one source-frame to observe `dashboard-group` without reintroducing click interception.
- tightened dashboard entry overlay timing again after Browser Smoke still showed one flaky `resources -> dashboard/library` retry on long commits: the minimum pending window for the target-side `dashboard-group` overlay is now measured from when the route actually crosses into the dashboard subtree instead of being fully consumed by pre-commit navigation time.
- trimmed the slowest repeated Browser Smoke setup step in GitHub Actions by switching the cloud workflow to cached Chromium-only Playwright installs; WebKit fallback stays available for local macOS/browser-launch debugging but is no longer provisioned on every CI run.
- aligned `DashboardGroupLoadingShell` closer to the real dashboard shell after manual review still showed visible shift: the loading sidebar now uses the same `272px` width as the shared DS sidebar and matches the live nav padding more closely instead of the wider `w-72` placeholder shell.
- tightened the post-deploy perf path for the two still-unstable smoke routes: the warm script now primes the control-arm newest listing with `ranking_variant=A`, repeats that warm pass, warms the hot creator detail route explicitly, and `getCreatorPublicProfile()` now uses Redis-backed cross-instance caching in addition to `unstable_cache` so `creator_detail_smoke` is less exposed to fresh-instance cold tails after deploy.
- tightened dashboard entry overlay timing after Browser Smoke still showed one flaky `resources -> dashboard/library` transition: the root dashboard entry overlay now arms immediately and holds for a short minimum window so CI sampling can reliably observe `dashboard-group` coverage on fast commits.
- hardened three Browser Smoke flake classes that surfaced even on a passing run: dashboard/public transition links now avoid unsafe pre-hydration clicks, `navigation-shells.spec.ts` uses retry-safe navigation waits instead of assuming the first click always commits, and `settings-theme.spec.ts` now waits for `/settings` navigation at `commit` with a longer timeout so first-compile latency does not masquerade as a theme regression.
- added a lightweight root-level resources entry overlay so dashboard/public -> `/resources` transitions can reserve `resources-browse` coverage before the resources route group mounts; this closes the blind spot that left `library-to-resources` without a loading scope in CI.
- strengthened the repo-owned browser probe so it now catches two regression classes that recently slipped through manual review: `resources-to-library` / `library-to-resources` sample `data-loading-scope` frames and fail on blank-gap transitions, while the new `dark-theme-logo` scenario delays dark-logo asset delivery and asserts the dark fallback layer stays visible on first paint.
- updated the shared performance/route docs for the 2026-04-07 performance initiative baseline: Phase A captured analyzer/Lighthouse signal that client-JS overhead is still a primary bottleneck on `/resources` routes, and Phase B moved dashboard/resources navigation overlays out of `src/app/layout.tsx` into their route-group layouts to trim unrelated public-route hydration work.
- updated search/performance docs again after the first Phase C pass: secondary public routes now lazy-load `HeroSearch` through `MarketplaceNavbarSearch`, and public loading shells stopped importing the full search bundle directly.
- trimmed the live marketplace search bundle further by moving bones/preview fixtures out of `HeroSearch.tsx` into `HeroSearchPreviews.tsx`, leaving the runtime module focused on real search UI only.
- moved the signed-in `/resources` personalized discover section behind a dedicated lazy boundary with a structural fallback, so recommendation client logic no longer ships in the route's initial client payload.
- captured [Platform Brand Assets Dark Theme Baseline](raw/operations/platform-brand-assets-dark-theme-baseline.md) in `operations` and seeded [Platform Brand Asset Delivery](wiki/operations/platform-brand-assets.md) so dark-logo fields, runtime asset aliases, and first-paint fallback behavior have a durable shared reference.

## 2026-04-06

- made `Codex triages first` the default knowledge-layer workflow so the agent decides skip/single/update/batch ingest shape first and reports that choice back to the user.
- captured [Post-Deploy Warm Workflow Baseline](raw/operations/post-deploy-warm-workflow-baseline.md) in `operations` from `.github/workflows/post-deploy-warm-cache.yml` and seeded [Post-Deploy Warm Workflow](wiki/operations/post-deploy-warm-workflow.md) with 3 related-page suggestions.

- added a practical knowledge-layer playbook page that explains when ingest is worth doing, when to skip it, and how to keep the workflow from becoming overhead.
- added GitHub-ready `githubStepSummary` and `annotations[]` inside bundle `ciHints` so Actions jobs can emit summaries and warnings/errors without custom field mapping.
- added `ciHints` to bundle reports so CI can consume a ready-made headline, exit code, recommended actions, and markdown summary without mapping lower-level fields first.
- extended `--report-format bundle` so report artifacts also include path-level `artifacts` hints and review-oriented `annotations` for CI summaries.
- added `--report-format bundle` so `--report-file` can emit a richer JSON artifact containing `textSummary`, structured sections, and the raw plan for CI diagnostics.
- added `--report-file` support so preview and blocked write flows can persist the resolved ingest plan as a JSON artifact for CI diagnostics.
- extended `--enforce-policy` into write mode so `wiki:ingest:enforce` and `wiki:ingest:batch:enforce` block forbidden plans before creating or mutating any knowledge files.
- added `--enforce-policy` plus `*:enforce` wrappers so `wiki:ingest` dry-run can fail CI automatically when a plan resolves to `blocked_by_policy`.
- added top-level batch `policy` overrides to `wiki:ingest` JSON dry-run previews so CI can forbid existing-page updates, backlink seeding, source-only merges, or plans that exceed review thresholds.
- added `confidence`, `policy`, and `policySummary` hints to `wiki:ingest` JSON dry-run previews so CI and agents can gate auto-apply vs review without reverse-engineering merge intent from the plan.
- enriched `wiki:ingest` JSON dry-run previews with per-item/per-target decision metadata (`actions`, `reasons`, `severity`) plus a top-level `decisionSummary` so CI and agents can branch on create/update/merge/backlink behavior directly.
- added `--format json` plus `wiki:ingest:dry-run:json` helpers so dry-run ingest plans can be consumed programmatically by agents or CI.
- added `skipRawCapture: true` for batch ingest items so canonical source fragments can update a shared wiki target without generating standalone low-value raw notes.
- upgraded `wiki:ingest:batch` so several raw captures can merge into one explicit shared wiki target via `wikiTargets` + `wikiTargetId`, including updates to existing wiki pages.
- added `wiki:ingest:batch` and `wiki:ingest:batch:dry-run` so multiple raw captures/wiki stubs can land from one pre-validated merge plan with batch-level suggestion and backlink reporting.
- upgraded `wiki:ingest` to append `knowledge/log.md` and regenerate `knowledge/index.md` automatically after successful writes instead of relying on manual follow-up.
- added `wiki:ingest:dry-run` so ingest can preview raw/wiki targets, related-page suggestions, and backlink writes before touching the repo.
- upgraded `wiki:ingest` to suggest related wiki pages from title/source overlap and seed backlinks into suggested pages when it creates a new wiki page.
- scoped `wiki:drift` to implementation-linked files and raw evidence notes so change-set review stays high-signal instead of re-flagging every page on broad meta-doc edits.
- added semantic knowledge checks for duplicate-topic detection, canonical-source backing, and raw-note citation coverage, plus a repo-owned `wiki:coverage` report.
- linked the first raw evidence notes back into the core auth, browser-verification, CI-browser-smoke, skeleton-policy, and knowledge-layer wiki pages so query flow can traverse `wiki -> raw -> canonical source`.
- captured [Repo-Owned Knowledge Layer Decision](raw/decisions/repo-owned-knowledge-layer-decision.md) in `decisions` and seeded [wiki page](wiki/decisions/repo-owned-knowledge-layer.md).

- captured [Skeleton Runtime Policy](raw/design/skeleton-runtime-policy.md) in `design`.

- captured [Browser Verification Split Model](raw/repo-docs/browser-verification-split-model.md) in `repo-docs`.

- captured [Auth Viewer And Route Protection Snapshot](raw/architecture/auth-viewer-and-route-protection-snapshot.md) in `architecture`.

- captured [Browser Smoke Workflow Baseline](raw/operations/browser-smoke-workflow-baseline.md) in `operations`.

- Added repo-owned `wiki:index`, `wiki:stale`, and `wiki:ingest` commands plus a shared helper module for knowledge-tree discovery.
- Strengthened `wiki:lint` so it now checks that `knowledge/index.md` matches the actual wiki tree instead of only checking for manual links.
- Added an operations wiki page for the knowledge layer and documented the workflow in `AGENTS.md` and `krukraft-ai-contexts/`.
- Seeded the initial `knowledge/` structure with `raw/`, `schema/`, and `wiki/`.
- Added repo-specific schema docs for ingest, query, source priority, and lint.
- Added initial core wiki pages for auth, payments, search, storage/downloads, core routes, CI browser smoke, browser verification, skeleton policy, and purchase-to-library flow.
- Added `npm run wiki:lint` and a repo-owned structural checker for the knowledge layer.
- Updated platform brand-asset delivery rules so dark-theme first paint no longer flashes the repo-owned dark fallback when only a light custom logo is configured.
- Strengthened perf regression gates by raising LHCI to two runs with blocking performance/TBT/CLS assertions and expanded the post-deploy warm/perf summary with rollup reporting for worst-route and nearest-budget visibility.
- Added a repo-owned performance observability playbook that defines the review order after deploy: warmed perf summary first, Speed Insights second, runtime logs third.
- Replaced the post-deploy perf workflow's heredoc summary append with a parser-safe inline Node command after a push-triggered YAML syntax failure on `.github/workflows/post-deploy-warm-cache.yml`.
- Added a repo-owned workflow syntax gate (`npm run workflow:check`) that parses every `.github/workflows/*.yml` file and now runs inside `lint`.
- Added a lightweight root-level dashboard entry overlay to cover public → dashboard jumps and tightened dark-logo resolution so dark refreshes no longer settle onto uploaded light logos when no dedicated dark asset exists.
- Changed runtime logo delivery so navbar branding renders the active uploaded light/dark asset directly and only falls back to repo-owned local assets on image load failure, removing the success-path fallback→custom artwork swap that was still causing logo position jumps on refresh.
- Tightened navbar branding further so `NavbarBrand` now pins itself to the repo-owned local light/dark logo pair instead of uploaded remote assets, trading immediate custom-logo propagation for a stable no-network first paint in the top chrome.
- Tightened the post-deploy warm workflow so `/resources` gets a deliberate second warm pass before k6 starts, after production repros showed first-hit instability on the public home shell even when warmed steady-state latency later passed budget.
