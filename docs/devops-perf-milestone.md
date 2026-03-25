# KruCraft — DevOps & Performance Milestone (Post-Deploy Phase)

## Status

- Completed
- Production-ready post-deploy pipeline with automated cache warming and performance verification

## What Was Implemented

- GitHub Actions workflow on `push` to `main`
- Wait until production `/resources` is live
- Run `npm run warm:cache`
- Run smoke k6 verification after warm
- Upload perf artifacts

## Cache Warm Routes

- `/resources`
- `/resources?category=all&sort=recommended`
- `/resources?category=all&sort=newest`
- `/resources/[hot-slug]`

## Smoke Perf Checks

- `resources_home`
- `listing_recommended`
- `listing_newest`
- `resource_detail`

## Thresholds

- `/resources` p95 < 2000ms
- Listing routes p95 < 2000ms
- Detail p95 < 2500ms
- Fail rate < 1%

## Artifacts

- `artifacts/perf-summary.json`
- `artifacts/k6/*.json`

## Manual Full Benchmark

- `BASE_URL=https://krucrafts.com npm run perf:full:prod`

## Latest Smoke Baseline

- `resources_home` ~300ms p95
- `listing_recommended` ~1.4s p95
- `listing_newest` ~650ms p95
- `resource_detail` ~360ms p95

## Outcome

- No cold-start slowdown after deploy
- Automatic perf verification on every release
- Clear separation between CI smoke checks and manual full benchmarks

## Optional Next Steps

- Perf history dashboard
- Alert integration
- Additional caching / prefetch refinement
