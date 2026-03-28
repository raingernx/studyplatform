# Perf Phase 29: Post-Deploy Measurement Checklist

## Preconditions

- Start from a clean worktree:
  - `git status --short`
- Make sure `node`, `npm`, `tsx`, and `k6` are available in your shell.
- Do not use `npm run build` as a verification gate in this repo:
  - `build` runs `prisma migrate deploy`
  - that step can fail when DB connectivity is unavailable

## Repo Perf Tooling

- Warm public cache:
  - `npm run warm:cache`
  - implementation: `scripts/warm-cache.ts`
- Post-deploy smoke suite:
  - `npm run perf:post-deploy`
  - implementation: `scripts/run-post-deploy-perf.ts --suite=smoke`
- Full post-deploy suite:
  - `npm run perf:full:prod`
  - implementation: `scripts/run-post-deploy-perf.ts --suite=full`
- Internal performance warm endpoint:
  - `npm run performance:warm`
  - implementation: `scripts/warm-public-cache.ts`
- Supporting k6 routes for this phase:
  - `k6/routes/resources-home-smoke.js`
  - `k6/routes/resource-detail-smoke.js`
  - `k6/routes/resources-home.js`
  - `k6/routes/resource-detail-hot.js`

## Required Environment Variables

- `BASE_URL`
  - required for `npm run warm:cache`
  - required for `npm run perf:post-deploy`
  - required for `npm run perf:full:prod`
- `WARM_BASE_URL`
  - optional fallback for `npm run warm:cache`
  - primary base URL for `npm run performance:warm`
- `NEXTAUTH_URL`
  - optional fallback base URL for `npm run warm:cache`
  - optional fallback base URL for `npm run performance:warm`
- `PERFORMANCE_WARM_SECRET`
  - required for `npm run performance:warm`
- `HOT_SLUG`
  - optional override for the detail route warmed/measured by the scripts
- `PERF_RESULTS_DIR`
  - optional override for k6 artifact output
- `PERF_SUMMARY_PATH`
  - optional override for the summary JSON path
- `PERF_SUITE`
  - optional suite override (`smoke` or `full`) for `scripts/run-post-deploy-perf.ts`
- `SESSION_TOKEN`
  - only needed if you run authenticated k6 scripts directly
- `COOKIE_NAME`
  - optional override when running authenticated k6 scripts directly

## Warm Then Smoke Flow

Run these in order against the same deployment.

### 1) Warm cache

```bash
BASE_URL="https://<YOUR_DEPLOYMENT_URL>" npm run warm:cache
```

Notes:
- `scripts/warm-cache.ts` warms:
  - `/resources`
  - `/resources?category=all&sort=recommended` with `ranking_variant=B`
  - `/resources?category=all&sort=newest`
  - `/resources/<HOT_SLUG>`
- The script fully reads the response body before declaring a route warm.

### 2) Post-deploy smoke

```bash
BASE_URL="https://<YOUR_DEPLOYMENT_URL>" npm run perf:post-deploy
```

This runs the smoke suite from `scripts/run-post-deploy-perf.ts`:
- `k6/routes/resources-home-smoke.js`
- `k6/routes/listing-recommended-smoke.js`
- `k6/routes/listing-newest-smoke.js`
- `k6/routes/resource-detail-smoke.js`

### 3) Optional internal warm endpoint

Only run this if you have the internal secret.

```bash
WARM_BASE_URL="https://<YOUR_DEPLOYMENT_URL>" PERFORMANCE_WARM_SECRET="<SECRET>" npm run performance:warm
```

## What To Record

For `/resources`:
- Anonymous TTFB
- Signed-in TTFB
- Total server time if traces/logs expose it
- DB query count or query timing if observability exposes it
- Whether anonymous requests skip:
  - optional session lookup
  - owned IDs loading
  - learning profile loading
- Whether signed-in requests render the catalog before owned badges resolve

For `/resources/[slug]`:
- Anonymous TTFB
- Signed-in TTFB
- Total server time if traces/logs expose it
- DB query count or query timing if observability exposes it
- Whether the detail route still resolves ownership correctly for signed-in users

For signed-in visual checks:
- Owned badges should stream in after initial `/resources` render without layout shift
- “Load more” appended cards should eventually show `Owned` if applicable

## Expected Behavior After Recent Perf Phases

- Anonymous `/resources` should not trigger:
  - optional session lookup
  - owned IDs loading
  - learning profile loading
- Signed-in `/resources` should render main catalog content before owned IDs finish resolving
- Owned badges should appear later without changing card height
- `/resources` active card surfaces should use intent-based prefetch, not viewport prefetch
- `/resources/[slug]` should not do extra analytics-only request reads

## Troubleshooting

- Missing `BASE_URL`
  - set `BASE_URL="https://<YOUR_DEPLOYMENT_URL>"`
- Missing `WARM_BASE_URL`
  - set `WARM_BASE_URL="https://<YOUR_DEPLOYMENT_URL>"`
- Missing `NEXTAUTH_URL`
  - only needed as a fallback base URL for warm scripts
- Missing `PERFORMANCE_WARM_SECRET`
  - required only for `npm run performance:warm`
- Missing `SESSION_TOKEN`
  - only required for direct authenticated k6 runs
- If lint fails because of stale `.next` output:

```bash
npm run clean
npm run lint
```
