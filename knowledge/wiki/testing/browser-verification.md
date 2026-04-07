# Browser Verification

## Summary

Krukraft uses a split browser-verification model: local repo-owned probes for debugging and GitHub Actions browser smoke for authoritative cloud verification.

## Current Truth

- Local verification prefers `browser:probe` over full `playwright test` on this macOS environment.
- CI runs `smoke:browser:ci` plus dashboard/page/management probes.
- GitHub Actions browser smoke is intentionally Chromium-only now; WebKit remains a local fallback path for macOS/browser-launch instability, not a browser that cloud CI should install on every run.
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
- creator workspace refresh verification now also has a repo-owned probe path, so wrong-level app-root fallback on `/dashboard/creator/*` can be caught without depending only on manual repeated refresh checks
- creator resource editor refresh now has its own repo-owned probe path as well, so `/dashboard/creator/resources/new` can verify the dedicated editor route-ready marker instead of inheriting only the generic creator-shell checks
- dashboard overview, library, downloads, purchases, settings, and membership hard refreshes now have their own repo-owned probe paths too, so the main authenticated dashboard surfaces can assert family-specific readiness directly and catch wrong-level app-root fallback without relying on manual repeated refresh testing
- admin overview and admin analytics now also have explicit hard-refresh probes, so the main admin family entry surfaces can prove admin-scoped readiness instead of relying only on direct-load smoke coverage
- close-out for browser verification work now requires both a `Verification:` summary and a `Knowledge triage:` decision; "green" workflow status alone is not enough for a stable close-out

## Invariants

- Local browser probe should remain the preferred macOS debugging path.
- CI browser smoke should stay green without tolerated flaky retries as a success criterion.
- A Browser Smoke run is only "clean" after log review confirms there were no hidden `flaky`, `retry #`, or equivalent retry-only failures.
- Route and transition tests should use stable shell markers when available.
- Cross-group navigation links that drive shell-coverage tests should not become interactable before hydration if that risks falling back to hard navigation or inconsistent overlay state.
- Entry overlays that prove transition coverage should stay visible long enough to survive fast route commits; zero-duration handoff overlays are prone to disappearing before CI sampling can observe the intended scope.
- For cross-group entry overlays, minimum pending time should be measured from when the target route group is entered, not only from the original navigation start time; long navigations can otherwise consume the whole pending window before CI samples the target-side overlay.
- Entry overlays must also avoid intercepting the source click that starts the transition; when a public-route link begins dashboard navigation, arm the overlay after the click frame rather than before the originating pointer event finishes.
- For public-to-dashboard links that both prove shell coverage and avoid click interception, the safest timing is: prevent default, let the click finish, arm dashboard navigation in a microtask, then `router.push(...)` on the next animation frame.
- Cross-route loading overlays should be visual-only layers. If a `dashboard-group`, `resources-browse`, or `resource-detail` handoff overlay can intercept pointer events, Browser Smoke may hang on the source click and only pass on retry even when the final navigation succeeds.
- In `navigation-shells.spec.ts`, arm `page.waitForURL(...)` before calling `locator.click()` for client-routed transitions; starting the waiter after the click can miss a fast App Router commit and create a false retry-only flake.
- Query-string search transitions on `/resources` should also wait only until `commit` and use a retry-safe submit helper; default `waitUntil: "load"` is too sensitive to first-compile/streaming variance and can create retry-only flakes in `search-flows.spec.ts`.
- Dashboard shell loading geometry must match the real shell width and padding, not just the content hierarchy; even when `data-loading-scope="dashboard-group"` is present, a wider sidebar shell (for example `w-72` instead of the real `272px`) still produces visible shift on handoff.
- Theme tests should assert runtime theme stability after navigation commit and explicit page assertions, not rely on slower document lifecycle milestones when the route can compile on first hit.

## Known Risks

- Local browser runtime issues can still make `playwright test` less stable than direct Playwright API launch.
- Browser smoke can pass while low-coverage paths still have regressions.
- A green Browser Smoke run can still hide flaky retries. CI log review should scan for `retry #1`, especially in `navigation-shells.spec.ts` and `settings-theme.spec.ts`, before calling the suite stable.
- When a Browser Smoke failure turns out to be a brittle assertion, probe bug, or workflow issue instead of a product regression, the close-out should say so explicitly and record the error class in `knowledge/log.md` or this page before the issue is considered learned.
- Dashboard/public transition flakes often show up as missing `data-loading-scope` samples or a visible link that was rendered before hydration finished, even when the final route eventually loads.

## Close-Out Guardrails

- Treat `success` + `flaky` as unfinished work. The suite is green, but not clean.
- Separate failure classes before patching:
  - product/runtime regression
  - brittle test or probe assertion
  - workflow/CI harness problem
- If the same failure class is likely to recur, update this page or `knowledge/log.md` before closing the task.
- Browser-verification close-out should include:
  - `Verification:`
  - `Knowledge triage:`
  - `Residual risk:`

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
