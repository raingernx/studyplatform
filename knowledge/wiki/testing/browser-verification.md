# Browser Verification

## Summary

Krukraft uses a split browser-verification model: local repo-owned probes for debugging and GitHub Actions browser smoke for authoritative cloud verification.

## Current Truth

- Local verification prefers `browser:probe` over full `playwright test` on this macOS environment.
- CI runs `smoke:browser:ci` plus dashboard/page/management probes.
- Browser verification was recently hardened around auth login, route transitions, admin pages, and resource detail shell readiness.
- The split model is now also captured as a raw evidence note so the wiki can cite a maintained snapshot instead of only canonical repo docs.
- Recent Browser Smoke flakes clustered around three patterns: pre-hydration dashboard/public links that were visible before they were safe to click, shell-coverage assertions that needed one retry-safe navigation helper, and `/settings` theme verification waiting too deep into route load (`domcontentloaded`) instead of proving the contract after navigation commit.

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
- Cross-group navigation links that drive shell-coverage tests should not become interactable before hydration if that risks falling back to hard navigation or inconsistent overlay state.
- Theme tests should assert runtime theme stability after navigation commit and explicit page assertions, not rely on slower document lifecycle milestones when the route can compile on first hit.

## Known Risks

- Local browser runtime issues can still make `playwright test` less stable than direct Playwright API launch.
- Browser smoke can pass while low-coverage paths still have regressions.
- A green Browser Smoke run can still hide flaky retries. CI log review should scan for `retry #1`, especially in `navigation-shells.spec.ts` and `settings-theme.spec.ts`, before calling the suite stable.
- Dashboard/public transition flakes often show up as missing `data-loading-scope` samples or a visible link that was rendered before hydration finished, even when the final route eventually loads.

## Related Pages

- [Auth System](../systems/auth.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)
- [Dashboard Library](../routes/dashboard-library.md)
- [Post-Deploy Warm Workflow](../operations/post-deploy-warm-workflow.md)
- [Resource Detail](../routes/resource-detail.md)

## Sources

- [Browser Verification Split Model](../../raw/repo-docs/browser-verification-split-model.md)
- [`krukraft-ai-contexts/03-tech-stack.md`](../../../krukraft-ai-contexts/03-tech-stack.md)
- [`tests/e2e/navigation-shells.spec.ts`](../../../tests/e2e/navigation-shells.spec.ts)
- [`tests/e2e/resources.smoke.spec.ts`](../../../tests/e2e/resources.smoke.spec.ts)
- [`tests/e2e/settings-theme.spec.ts`](../../../tests/e2e/settings-theme.spec.ts)

## Last Reviewed

- 2026-04-07
