# Browser Verification

## Summary

Krukraft uses a split browser-verification model: local repo-owned probes for debugging and GitHub Actions browser smoke for authoritative cloud verification.

## Current Truth

- Local verification prefers `browser:probe` over full `playwright test` on this macOS environment.
- CI runs `smoke:browser:ci` plus dashboard/page/management probes.
- Browser verification was recently hardened around auth login, route transitions, admin pages, and resource detail shell readiness.
- The split model is now also captured as a raw evidence note so the wiki can cite a maintained snapshot instead of only canonical repo docs.

## Why It Matters

This split model keeps local debugging practical while giving the repo a stable cloud truth source.

## Key Files

- `playwright.config.ts`
- `scripts/run-playwright-stable.mjs`
- `scripts/browser-probe-local.ts`
- `tests/e2e/*`
- `.github/workflows/browser-smoke.yml`

## Flows

- local browser probe against a dev server
- CI browser smoke against cloud Linux runner
- repo-owned page, dashboard, and management probe passes after Playwright smoke

## Invariants

- Local browser probe should remain the preferred macOS debugging path.
- CI browser smoke should stay green without tolerated flaky retries as a success criterion.
- Route and transition tests should use stable shell markers when available.

## Known Risks

- Local browser runtime issues can still make `playwright test` less stable than direct Playwright API launch.
- Browser smoke can pass while low-coverage paths still have regressions.

## Related Pages

- [CI Browser Smoke](../operations/ci-browser-smoke.md)
- [Auth System](../systems/auth.md)
- [Dashboard Library](../routes/dashboard-library.md)
- [Resource Detail](../routes/resource-detail.md)

## Sources

- [Browser Verification Split Model](../../raw/repo-docs/browser-verification-split-model.md)
- [`krukraft-ai-contexts/03-tech-stack.md`](../../../krukraft-ai-contexts/03-tech-stack.md)
- [`tests/e2e/navigation-shells.spec.ts`](../../../tests/e2e/navigation-shells.spec.ts)
- [`tests/e2e/resources.smoke.spec.ts`](../../../tests/e2e/resources.smoke.spec.ts)

## Last Reviewed

- 2026-04-06
