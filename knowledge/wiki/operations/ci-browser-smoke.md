# CI Browser Smoke

## Summary

GitHub Actions `Browser Smoke` is the cloud verification workflow for marketplace, dashboard, admin, and management browser flows.

## Current Truth

- The workflow provisions Postgres, enables `pg_trgm`, seeds the app, runs lint and typecheck, then executes browser smoke.
- Additional probe jobs cover dashboard, public/admin pages, and management pages.
- Recent stabilization work removed flaky auth navigation, invalid admin audit table markup, and detail-shell readiness issues from the main smoke path.

## Why It Matters

This workflow is the main browser truth source when local browser environments are noisy or unreliable.

## Key Files

- `.github/workflows/browser-smoke.yml`
- `scripts/run-playwright-stable.mjs`
- `scripts/browser-probe-local.ts`
- `tests/e2e/*`

## Flows

- install dependencies and Playwright browsers
- prepare DB and seed fixtures
- run `smoke:browser:ci`
- run dashboard/page/management probes
- upload artifacts and logs

## Invariants

- CI browser smoke should remain independent of local machine browser quirks.
- `curl: (7)` inside probe startup loops is not itself a failure if the readiness loop later succeeds and the page probes pass.
- CI failures should be interpreted from the final failing assertion or probe, not from startup-noise lines.

## Known Risks

- A single green run is useful but not the same as long-horizon flake elimination.
- Storage fidelity is lower in CI when using local fallback instead of real R2.

## Related Pages

- [Browser Verification](../testing/browser-verification.md)
- [Post-Deploy Warm Workflow](post-deploy-warm-workflow.md)
- [Search](../systems/search.md)
- [Storage And Downloads](../systems/storage-downloads.md)

## Sources

- [Browser Smoke Workflow Baseline](../../raw/operations/browser-smoke-workflow-baseline.md)
- [`krukraft-ai-contexts/03-tech-stack.md`](../../../krukraft-ai-contexts/03-tech-stack.md)
- [`.github/workflows/browser-smoke.yml`](../../../.github/workflows/browser-smoke.yml)

## Last Reviewed

- 2026-04-06
