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
- `db:deploy`: `prisma migrate deploy`
- `perf:post-deploy`: warm cache + smoke perf suite
- GitHub post-deploy warm workflow supports both `deployment_status` and manual `workflow_dispatch` runs, which covers direct CLI production deploys
- the post-deploy warm workflow now retries `npm ci` and uploads install logs alongside warm artifacts, so failed warm runs do not die without diagnostics
- the post-deploy warm/perf workflow now installs on Node 24, matching the current local `npm ci` / lockfile resolver behavior and avoiding the old Node 20/npm 10 mismatch
- the post-deploy warm/perf workflow now uses `actions/checkout@v6`, `actions/setup-node@v6`, and `actions/upload-artifact@v6`, which all declare `node24` runtimes upstream; `grafana/setup-k6-action@v1` remains unchanged because no newer upstream action line with explicit Node 24 guidance was available
- `test:e2e`: Playwright browser verification for `/resources`, canonical search flows, no-result recovery, and resource detail image rendering
- `smoke:local:browser`: repo-owned pre-merge Playwright smoke path for key public/auth/uploader browser flows, including authenticated preview-image upload on admin and creator resource forms
- `storybook:smoke`: build-based Storybook smoke for design-system primitives/components
- `chromatic`: Chromatic CLI is installed as an optional visual-regression publish/review surface for Storybook once a `CHROMATIC_PROJECT_TOKEN` is configured
- `skeleton:boneyard:build` / `skeleton:boneyard:build:force`: optional DOM-capture skeleton generation via `boneyard-js`, writing generated bones under `src/bones`
- `repomix` / `repomix:split`: local repo-pack scripts for AI handoff/research workflows; output is intentionally excluded from git, and `.repomixignore` strips secrets, artifacts, and local tool state from packed context
- the package/lockfile identity now uses `krukraft`, matching the repo folder rename and local service naming
- `lhci:*`: Lighthouse CI collection/assertion flow backed by `.lighthouserc.json`
- `analyze`: Next bundle analyzer via `ANALYZE=true npm run build`
- `/api/auth/viewer` now reads the signed NextAuth JWT through `next-auth/jwt` instead of `getServerSession`, which keeps lightweight auth-chrome checks off the Prisma pool
- the marketplace/detail private viewer-state APIs now use the same JWT-token snapshot pattern instead of Prisma-backed `getServerSession` reads, which removes a second source of auth-related pool pressure on public routes
- local-only metadata/state folders `.byom/`, `.codex/environments/`, and ad-hoc `.agents/skills/*` copies are intentionally gitignored; only the tracked `.agents/skills/next-best-practices` subtree should remain under version control

Important: build must stay schema-mutation-free. Migration deploy is a separate operational step.

## Analytics / Observability

- Vercel Analytics via `@vercel/analytics`
- Vercel Speed Insights via `@vercel/speed-insights`
- Custom server-side performance tracing utilities live under `src/lib/performance/*`

## File Storage Pattern

| Use case | Method |
|---------|--------|
| Public preview image | `next/image` + shared `RevealImage` for optimizer-compatible HTTPS sources; bypass optimizer only for non-optimizable cases |
| Paid/private file | protected route: `/api/download/[resourceId]` |
| Secure file delivery | purchase/ownership check → guarded access / signed URL flow |

## Browser / UI Verification Surfaces

- Playwright is configured in `playwright.config.ts`; the local project name remains `chromium`, and it now defaults to `channel: "chromium"` so local verification uses Playwright's bundled Chromium browser instead of the bundled headless shell or installed Chrome stable. Set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` only when you intentionally want installed-Chrome coverage. The default local base URL resolves to `http://127.0.0.1:3000`.
- Storybook is intentionally scoped to `src/design-system/primitives/**/*.stories.*` and `src/design-system/components/**/*.stories.*`.
- Chromatic is available on top of that same Storybook surface for hosted visual review, but it is not wired into CI or usable until a project token is provisioned.
- Theme bootstrap now defaults first paint to `light`; stored `dark` and user-selected `system` preferences still override that baseline at runtime, and the Prisma `UserPreference.theme` default now matches that same `light` baseline for newly created rows.
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
