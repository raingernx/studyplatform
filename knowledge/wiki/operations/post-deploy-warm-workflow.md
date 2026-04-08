# Post-Deploy Warm Workflow

## Summary

The post-deploy warm workflow warms critical public routes, then runs a k6-backed smoke perf suite against production and publishes artifacts plus a workflow-summary rollup.

## Current Truth

- The workflow auto-runs on production deployment success and can also be triggered manually with `workflow_dispatch`.
- `Warm Public Cache` waits for `/resources` to return success, then warms public routes and optional internal cache layers before perf verification starts.
- The warm script now gives `/resources` a deliberate second pass before the k6 smoke suite starts, and each pass sends a small concurrent burst instead of a single request, because production checks showed that sequential warms still left later k6 VUs free to hit fresh instances with a cold discover-home stream.
- The same warm script now also warms the control-arm newest listing with `ranking_variant=A`, a repeated pass, and a concurrent burst sized to the smoke route's 5-VU ceiling, and it warms the hot creator detail plus category listing routes with the same repeated burst strategy, because the smoke suite measures those exact shapes and they were still alternating between pass/fail when only the generic public warm set ran.
- `Run Post-Deploy Performance Verification` executes `npm run perf:post-deploy`, which runs the smoke k6 suite and fails the job when any route exceeds its p95 budget or crosses a 1% failure rate.
- The generated `artifacts/perf-summary.json` now includes a rollup with overall status, pass/fail counts, the worst p95 route, and the route nearest its budget.
- The workflow summary now includes that rollup directly, so reviewers do not need to download artifacts first to see which route regressed.

## Why It Matters

This workflow is the repo-owned production perf truth source after deploy. It verifies that warm-cache assumptions still match real routes and that high-traffic public paths stay inside practical latency budgets.

## Key Files

- `.github/workflows/post-deploy-warm-cache.yml`
- `scripts/run-post-deploy-perf.ts`
- `artifacts/perf-summary.json`

## Flows

- resolve production deployment context
- wait for the production `/resources` route to go live
- warm public and optional internal cache layers
- run the smoke k6 suite against key public routes
- interpret the result in two stages:
  - did `Warm Public Cache` itself fail
  - or did warm pass and only the later perf-verification step fail
- upload perf artifacts and append the perf rollup to the GitHub Actions step summary

## Invariants

- Warm targets and perf targets must stay aligned; otherwise the workflow can report cold-path regressions as if they were warmed-route failures.
- `/resources` is expected to receive extra warm passes; removing them without replacing the stabilization strategy reintroduces noisy first-hit perf failures after deploy.
- `/resources` is also expected to receive a concurrent warm burst that matches the 5-VU smoke fanout, and the route is treated as required. Sequential single-request repeats alone are not sufficient evidence that later multi-VU smoke traffic will avoid cold-tail stream variance.
- `listing_recommended_smoke`, `listing_newest_smoke`, `creator_detail_smoke`, and `category_listing_smoke` are expected to be warmed against the same treatment/control cookie / creator slug / category slug that the k6 suite measures; warming only adjacent routes is not sufficient evidence of stability.
- When those smoke routes ramp to 5 VUs, the warm burst should match that fanout. Sequential repeats alone are not enough evidence that later multi-instance smoke traffic will avoid cold tails, and historically noisy routes such as `/resources` and `listing_newest_smoke` may still need an extra third pass to catch late fresh-instance shells.
- If a hot public route already uses `unstable_cache`, keep the wrapper function itself stable per route key or slug; recreating the wrapper on every call weakens same-instance reuse and can still leave warmed smoke routes vulnerable to cold-tail variance even when the Redis layer is hot.
- If `PERFORMANCE_WARM_SECRET` is configured, the post-deploy script should trigger `/api/internal/performance/warm` before the route-level HTTP fanout. The internal warm primes service-level/precomputed caches; the route-level pass then warms streamed page shells and image optimizer paths on top.
- The smoke perf suite is a blocking gate: route budgets are not advisory.
- `Warm Public Cache` passing does not mean the workflow passed; when later perf verification fails, the failure class is usually warmed-route instability, target-shape mismatch, or fresh-instance variance, not a generic warm-step failure.
- Artifact JSON and GitHub step summary should tell the same story about which route was worst and which routes failed.

## Known Risks

- LHCI and local lab runs are still useful only for regression detection, not as a substitute for the warmed production perf suite.
- Preview or protected deployment URLs can block perf verification unless the workflow resolves a public production host.
- k6 budgets that drift away from real route shape can cause either noisy failures or a false sense of safety.
- Manual traffic during the workflow can perturb shared production cache state, but if one extra hit is enough to flip pass/fail then the underlying route is still not stable enough to treat as solved.

## Related Pages

- [CI Browser Smoke](ci-browser-smoke.md)
- [Browser Verification](../testing/browser-verification.md)
- [Performance Observability](performance-observability.md)
- [Knowledge Layer Operations](knowledge-layer.md)

## Sources

- [Post-Deploy Warm Workflow Baseline](../../raw/operations/post-deploy-warm-workflow-baseline.md)
- [Canonical source: .github/workflows/post-deploy-warm-cache.yml](../../../.github/workflows/post-deploy-warm-cache.yml)
- [Canonical source: scripts/run-post-deploy-perf.ts](../../../scripts/run-post-deploy-perf.ts)

## Last Reviewed

- 2026-04-08
