# Knowledge Log

## 2026-04-07

- fixed the remaining `resources -> dashboard/library` Browser Smoke flake after CI logs showed the root dashboard overlay was intercepting the original navbar click; public-route protected links now arm `beginDashboardNavigation(...)` on the next animation frame so the click commits before the handoff overlay appears.
- tightened the same `resources -> dashboard/library` handoff again after CI still showed one flaky retry: protected navbar links now arm dashboard navigation in a microtask and only call `router.push(...)` on the following animation frame, giving Browser Smoke one source-frame to observe `dashboard-group` without reintroducing click interception.
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
- Tightened the post-deploy warm workflow so `/resources` gets a deliberate second warm pass before k6 starts, after production repros showed first-hit instability on the public home shell even when warmed steady-state latency later passed budget.
