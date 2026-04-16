# Krukraft — Tech Stack

## Stack Overview

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI Library | React 18 |
| Styling | Tailwind CSS |
| Components | Repo design system + selected Radix/shadcn foundations |
| Authentication | NextAuth |
| ORM | Prisma |
| Database | PostgreSQL |
| Payment (Primary) | Stripe |
| Payment (Secondary) | Xendit |
| File Storage | Cloudflare R2 |
| Caching | Upstash Redis + `unstable_cache` + `runSingleFlight` |
| Deployment | Vercel |
| Analytics | Vercel Analytics + Vercel Speed Insights |
| Icons | lucide-react |

## Runtime / Tooling Notes

- `build`: `prisma generate && next build --webpack`
- `typecheck`: `tsc -p tsconfig.typecheck.json --noEmit`
- `lint`: scoped ESLint run plus `npm run skeleton:check`, which blocks inline `*Skeleton` / `*Fallback` component declarations inside `src/app/**`
- `workflow:check`: repo-owned GitHub Actions YAML parser check powered by `scripts/check-workflow-syntax.mjs`; `lint` now runs it so broken workflow syntax fails locally/CI before GitHub rejects the file on push
- `wiki:lint`: repo-owned knowledge-layer validation that checks required `knowledge/` roots, schema files, wiki-page section headings, and `knowledge/index.md` coverage
- `wiki:index`: regenerates `knowledge/index.md` from the current wiki tree
- `wiki:lint:semantic`: flags duplicate wiki titles, uncited raw notes, and wiki pages that rely only on low-priority knowledge links without canonical source backing
- `wiki:coverage`: prints raw-note citation coverage and canonical-source coverage for the repo-owned knowledge layer
- `wiki:stale`: flags wiki pages whose `Last Reviewed` date is older than the configured threshold or whose `Sources` section has no links
- `wiki:drift`: flags wiki pages whose implementation-linked files or raw evidence notes changed in the current diff while the page itself was not updated, which helps keep page-level knowledge in sync with code/runtime changes without over-triggering on broad meta-doc edits
- `wiki:ingest`: creates a raw knowledge note, appends `knowledge/log.md`, regenerates `knowledge/index.md`, can optionally seed a wiki page in one command, and now suggests related wiki pages/backlinks from title/source overlap
- `wiki:ingest:dry-run`: previews raw/wiki targets, related-page suggestions, and backlink writes without changing files
- `wiki:ingest:batch` / `wiki:ingest:batch:dry-run`: ingest a JSON batch plan for multiple raw captures/wiki stubs in one pre-validated pass, support explicit shared wiki merge targets through `wikiTargets` + `wikiTargetId`, and now also support `skipRawCapture: true` for source-only merge items that should update a wiki target without creating standalone raw notes
- dry-run ingest also supports `--format json`, and the repo now exposes `wiki:ingest:dry-run:json` plus `wiki:ingest:batch:dry-run:json` helpers for machine-readable plan export; those JSON previews now carry per-item/per-target `decision` hints (`actions`, `reasons`, `severity`), a top-level `decisionSummary`, `confidence` / `policy` metadata for apply-vs-review gating, top-level batch `policy` overrides for CI-enforced review thresholds, and `--enforce-policy` / `*:enforce` helpers that return non-zero on `blocked_by_policy`. Write-mode `wiki:ingest:enforce` / `wiki:ingest:batch:enforce` now apply the same policy gate before any files are written, `--report-file` can persist the serialized plan for CI artifacts, and `--report-format bundle` upgrades that artifact into one file with `textSummary`, path-level artifact hints, review annotations, GitHub-ready summary/annotation hints, sectioned JSON, and the original plan.
- default workflow is now `Codex triages first`: the agent should decide whether a change should be skipped, ingested as single-source knowledge, merged into an existing wiki page, or handled as a batch topic, then report that decision back to the user
- `db:deploy`: `prisma migrate deploy`
- `db:push`: `prisma db push`
- `db:migrate`: `prisma migrate dev`
- `db:local:start`: starts the clean local Postgres cluster at `.local-db/pgdata` on port `54329`
- `db:local:stop`: stops that local Postgres cluster
- `db:local:status`: health-checks the local Postgres cluster on `127.0.0.1:54329`
- `dev:full`: now boots the local Postgres cluster first, then starts Next.js dev, so the repo's one-click local dev path no longer depends on manually starting the clean DB beforehand
- `perf:post-deploy`: warm cache + smoke perf suite
- `cpd:verify`: repo-owned CPD guardrail that fails unless `origin` points at the canonical GitHub repo (`https://github.com/raingernx/KRUKRAFT.git`), `HEAD` matches `origin/main`, and GitHub deployment evidence exists for the pushed commit
- post-deploy perf review is now a layered workflow: use LHCI for local regression floors, then the warmed k6 summary/rollup in GitHub Actions, then Vercel Speed Insights and runtime logs for production-only drift
- GitHub post-deploy warm workflow supports both `deployment_status` and manual `workflow_dispatch` runs, which covers direct CLI production deploys
- the post-deploy warm workflow now retries `npm ci` and uploads install logs alongside warm artifacts, so failed warm runs do not die without diagnostics
- the post-deploy warm/perf workflow now installs on Node 24, matching the current local `npm ci` / lockfile resolver behavior and avoiding the old Node 20/npm 10 mismatch
- the post-deploy warm/perf workflow now uses `actions/checkout@v6`, `actions/setup-node@v6`, and `actions/upload-artifact@v6`, which all declare `node24` runtimes upstream; `grafana/setup-k6-action@v1` remains unchanged because no newer upstream action line with explicit Node 24 guidance was available
- `test:e2e`: Playwright browser verification for `/resources`, canonical search flows, no-result recovery, and resource detail image rendering
- `browser:probe` / `browser:probe:headed`: local repo-owned Playwright API probe path that bypasses `playwright test` and verifies launch, `/resources -> /dashboard-v2/library`, `/dashboard-v2/library -> /resources`, and `settings-theme` against a real local dev server
- `browser:probe:dashboard`: repo-owned dashboard runtime probe for `/dashboard-v2/downloads`, `/dashboard-v2/purchases`, and `/dashboard-v2/settings` transitions after entering the dashboard shell
- `browser:probe:pages`: repo-owned direct-load probe for public/product informational pages (`/membership`, legal/support, checkout status) plus the remaining admin root/index pages (`/admin`, activity, audit, categories, orders, reviews, tags, users)
- `browser:probe:management`: repo-owned authenticated management probe for `/admin`, `/admin/analytics`, `/admin/analytics/recommendations`, `/dashboard-v2`, `/dashboard-v2/library`, `/dashboard-v2/downloads`, `/dashboard-v2/purchases`, `/dashboard-v2/settings`, `/dashboard-v2/membership`, `/dashboard-v2/creator/resources`, `/dashboard-v2/creator/resources/new`, `/dashboard-v2/creator/profile`, and `/dashboard-v2/creator/analytics`; it now includes admin-overview and admin-analytics hard-refresh shell verification, dashboard-overview/library/downloads/purchases/settings/membership hard-refresh shell verification, plus both creator hard-refresh shell verification and creator resource-editor hard-refresh verification
- `browser:probe:sentinel`: repo-owned blind-spot probe lane for routes that were historically under-measured by the core/browser management probes; it currently covers `/resources -> account dropdown -> /dashboard-v2|/dashboard-v2/purchases|/dashboard-v2/settings`, `/dashboard-v2 -> avatar menu -> /dashboard-v2/library|/dashboard-v2/purchases|/dashboard-v2/settings`, filtered/search marketplace listing pages (`/resources?category=art-creativity`, `/resources?category=science`, `/resources?search=worksheet`), and `/admin/resources/new|[id]`
- platform branding now includes dedicated `logoFullDarkUrl` / `logoIconDarkUrl` fields end-to-end (Prisma, admin settings, public config, and runtime `/brand-assets/*` aliases), so dark-theme logo swaps no longer need to reuse the light asset
- `src/components/brand/Logo.tsx` now treats brand images as critical-path UI without cross-fading between repo fallbacks and uploaded runtime assets on success: light/dark logo layers render the active configured asset directly, and only fall back to the repo-owned local asset if that theme-specific upload fails to load
- dark runtime logo resolution no longer falls back to uploaded light logos; if no dedicated dark asset is stored, the stack now stays on the repo-owned dark fallback instead of settling on a light custom logo after refresh
- the logo stack still requests the active light/dark runtime logo images at high priority from SSR markup, but repo-owned fallback assets are now a true failure path rather than a first-paint overlay; this avoids position jumps caused by swapping between local fallback artwork and uploaded logo files with different whitespace/artboards
- the navbar brand itself now opts into repo-owned local light/dark assets on purpose, so the most visible first-paint chrome no longer waits on uploaded remote logo files and refresh-time brand flicker is isolated away from the navbar
- the root layout no longer mounts a dashboard entry overlay; dashboard navigation now targets canonical `/dashboard-v2/*` routes directly, and legacy `/dashboard*`, `/settings`, and `/subscription` URLs are intentionally unsupported after the Phase 5 hard cut
- `src/services/resources/index.ts`: top-level import surface intentionally exposes only public marketplace/detail reads plus viewer-state helpers; route handlers and admin/mutation paths must import `resource.service` / `mutations` subpaths directly so browser-facing bundles do not accidentally pull `server-only` or `next/cache` mutation code
- `src/components/resources/detail/ResourceDetailLoadingShell.tsx`: the client loading shell is intentionally self-contained and must not import `ResourceDetailSections.tsx` or other service-backed section files, because that overlay path mounts in browser navigation flows
- `knowledge/`: repo-owned LLM wiki split into `knowledge/raw/` evidence captures, `knowledge/wiki/` synthesized topic pages, and `knowledge/schema/` ingest/query/lint rules; the layer is intentionally lighter-weight than a full external RAG stack and is maintained inside the repo
- `smoke:local:browser`: local browser-debug entrypoint now mapped to the repo-owned `browser:probe` flow instead of the full Playwright Test CLI smoke bundle, because this macOS environment can still abort during `playwright test` browser launch even when direct Playwright API launch succeeds
- `smoke:browser:ci`: GitHub Actions-safe Playwright smoke bundle for cloud runners; it keeps the public/auth/navigation/settings coverage but intentionally skips uploader specs that depend on storage configuration beyond the repo-owned local fallback path
- `.github/workflows/browser-smoke.yml`: cloud CI workflow that provisions Postgres 16, explicitly enables `pg_trgm`, then runs `prisma db push` + `db:seed`, installs Playwright browsers, and runs lint, typecheck, and `npm run smoke:browser:ci`
- `.github/workflows/browser-smoke.yml` now follows a layered `core + sentinel` model: it still boots fresh `next dev` instances for the repo-owned core probes (`browser:probe:dashboard` and `browser:probe:pages`) after the Playwright smoke bundle, it adds a separate `browser:probe:sentinel` pass for dropdown-origin navigation, filtered listing pages, and admin resource editors, and it still runs `npm run browser:probe:management` in a separate `Management Browser Probes` job so admin-analytics and creator-management verification executes even if the main smoke bundle flakes first
- `.github/workflows/post-deploy-warm-cache.yml` now follows a layered perf model too: the main gated perf job remains the core suite, while an extra report-only sentinel perf job runs after deploy for non-core public listing blind spots, and manual `workflow_dispatch` runs can select a specific perf suite (`smoke`, `full`, `sentinel`, or `listing-drilldown`) without editing the workflow file
- `storybook:smoke`: build-based Storybook smoke for design-system primitives/components
- `chromatic`: Chromatic CLI is installed as an optional visual-regression publish/review surface for Storybook once a `CHROMATIC_PROJECT_TOKEN` is configured
- `skeleton:boneyard:build` / `skeleton:boneyard:build:force`: optional DOM-capture skeleton generation via `boneyard-js`, writing generated bones under `src/bones`
- the repo now pins `boneyard-js` at `^1.6.7`; skeleton capture flows should assume the newer registry-import detection and route-scanning behavior from the 1.6.7 line rather than the older 1.6.2 baseline
- `repomix` / `repomix:split`: local repo-pack scripts for AI handoff/research workflows; output is intentionally excluded from git, and `.repomixignore` strips secrets, artifacts, and local tool state from packed context
- the package/lockfile identity now uses `krukraft`, matching the repo folder rename and local service naming
- `lhci:*`: Lighthouse CI collection/assertion flow backed by `.lighthouserc.json`
- `analyze`: Next bundle analyzer via `ANALYZE=true npm run build`
- `/api/auth/viewer` now reads the signed NextAuth JWT through `next-auth/jwt` instead of `getServerSession`, which keeps lightweight auth-chrome checks off the Prisma pool
- the marketplace/detail private viewer-state APIs now use the same JWT-token snapshot pattern instead of Prisma-backed `getServerSession` reads, which removes a second source of auth-related pool pressure on public routes
- local fallback logo assets now include `/brand/krukraft-logo-dark.svg` and `/brand/krukraft-mark-dark.svg`, which act as the always-available first-paint branding layer whenever a custom uploaded logo has not loaded yet
- local-only metadata/state folders `.byom/`, `.codex/environments/`, and ad-hoc `.agents/skills/*` copies are intentionally gitignored; only the tracked `.agents/skills/next-best-practices` subtree should remain under version control
- `lint` now includes `npm run wiki:lint`, so repo-owned knowledge pages must stay structurally valid alongside the code/docs checks

Important: build must stay schema-mutation-free. Migration deploy is a separate operational step.

## Prisma Workflow

- `db:push` is draft mode for local schema experimentation. Use it while fields/relations are still changing.
- `db:migrate` is record-history mode. Use it once the schema change is stable and should be committed as a real migration.
- `db:deploy` is apply-history mode. Use it only to apply existing migrations to clean or properly baselined databases.

Recommended field-add flow:

1. Edit `prisma/schema.prisma`.
2. If still iterating locally, use `db:push`.
3. Update code paths that depend on the new field.
4. When the schema is settled, run `db:migrate`.
5. Verify `typecheck`, `lint`, and the affected runtime flow.
6. Commit schema, migration, and code together.
7. Use `db:deploy` for other environments.

Current repo caveat:

- The current local database has schema state that is not fully tracked by Prisma Migrate history, so `db:deploy` is not the safe default path for that database.
- For narrowly scoped local DB fixes, prefer a clean dev DB or narrow SQL over forcing `db:deploy` or `db:push --accept-data-loss`.
- The clean local Postgres path is now verified again: a fresh database can bootstrap through `db:deploy` + `db:seed`, and the repo includes `20260415013823_add_user_provider_image` so `User.providerImage` is no longer a schema drift that breaks fresh seeds.

## Analytics / Observability

- Vercel Analytics via `@vercel/analytics`
- Vercel Speed Insights via `@vercel/speed-insights`
- Custom server-side performance tracing utilities live under `src/lib/performance/*`
- Root-layout browser telemetry is production-only; local dev and CI browser verification do not inject the Vercel Analytics / Speed Insights scripts anymore, which keeps smoke suites from depending on outbound telemetry requests.
- Security headers now use a production-only strict-transport profile: `Strict-Transport-Security` and CSP `upgrade-insecure-requests` stay enabled in production, but local dev / CI browser verification no longer upgrades `http://localhost` asset redirects to broken `https://localhost` requests.
- Operational review order is: warmed post-deploy perf summary first, Speed Insights second, runtime logs third.

## File Storage Pattern

| Use case | Method |
|---------|--------|
| Public preview image | `next/image` + shared `RevealImage` for optimizer-compatible HTTPS sources; bypass optimizer only for non-optimizable cases |
| Paid/private file | protected route: `/api/download/[resourceId]` |
| Secure file delivery | purchase/ownership check → guarded access / signed URL flow |

## Browser / UI Verification Surfaces

- Playwright is configured in `playwright.config.ts`; the local project name remains `chromium`, and it now defaults to `channel: "chromium"` so local verification uses Playwright's bundled Chromium browser instead of the bundled headless shell or installed Chrome stable. Set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` only when you intentionally want installed-Chrome coverage. The default local base URL resolves to `http://127.0.0.1:3000`.
- On this current macOS local machine, `playwright test` browser launch is still less stable than direct Playwright API launch. For high-signal local debugging, prefer `npm run browser:probe -- <scenario...>` or `npm run smoke:local:browser`; keep the full Playwright Test suite as the CI/cloud verification surface.
- `chrome-devtools-mcp` is now an approved local browser-runtime verification companion for this repo. Use it for authenticated Chrome-session probing, DOM/console/network inspection, layout/overlay debugging, and targeted click-through validation when the goal is to inspect the real browser state rather than record a regression test.
- Verification policy is now layered: request-level smoke for auth/redirect/ownership, `chrome-devtools-mcp` for local browser/runtime proof, and Playwright for canonical assertions/regression/CI. `chrome-devtools-mcp` should not replace Playwright in GitHub Actions or other durable test-suite contexts.
- On the current local machine, Chrome for Testing may expose the DevTools endpoint on `::1:9222` while MCP expects `127.0.0.1:9222`; when that happens, keep a local TCP bridge in front of the Chrome debug instance before attaching `chrome-devtools-mcp`.
- GitHub Actions browser smoke now uses the same Playwright config surface but runs in cloud Linux with a repo-owned Postgres service and seeded demo data, which gives the project a browser verification path that does not depend on the quirks of a specific local macOS browser runtime.
- Storybook is intentionally scoped to `src/design-system/primitives/**/*.stories.*` and `src/design-system/components/**/*.stories.*`.
- Chromatic is available on top of that same Storybook surface for hosted visual review, but it is not wired into CI or usable until a project token is provisioned.
- Theme bootstrap now defaults first paint to `system`; stored `light` and `dark` preferences still override that baseline at runtime, and the Prisma `UserPreference.theme` default now matches that same `system` baseline for newly created rows. The `/dashboard-v2/settings` preference form now materializes the current runtime theme mode into `localStorage` when no stored theme exists yet, so opening settings no longer feels like it auto-switches to a DB-backed theme behind the user's back.
- Accessibility checks are available through `@axe-core/playwright`.
- Lighthouse CI is configured through `.lighthouserc.json`.
- Bundle inspection is available through `@next/bundle-analyzer`.
- Repomix is available as a local AI-context packing utility; `.repomixignore` is part of the repo and should remain aligned with secret/artifact handling policy when new generated directories or sensitive files are introduced.

## Environment Variables (Core)

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_ANNUAL_PRICE_ID
STRIPE_TEAM_MONTHLY_PRICE_ID
STRIPE_TEAM_ANNUAL_PRICE_ID
XENDIT_SECRET_KEY
XENDIT_WEBHOOK_TOKEN
R2_ENDPOINT
R2_BUCKET
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Environment Variable Notes

- `DATABASE_URL` is the app runtime DB connection.
- `DIRECT_URL` is still required operationally for Prisma CLI / migration workflows because `prisma/schema.prisma` declares `directUrl`.
- `RESEND_API_KEY` + `EMAIL_FROM` are needed for verify-email / reset-password mail delivery.
- `PERFORMANCE_WARM_SECRET` is used by internal warm routes and post-deploy perf jobs.
- Current production warning: `XENDIT_SECRET_KEY` is still a test key.

---

*Refreshed against the repo state on 2026-04-05.*
