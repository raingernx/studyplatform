# Dashboard Library Route

## Summary

`/dashboard-v2/library` is the signed-in ownership surface for purchased or claimed resources.

## Current Truth

- Browser verification covers both `resources -> dashboard-v2/library` and `dashboard-v2/library -> resources`.
- Navigation state, route shells, and transition overlays were hardened to avoid blank gaps during these transitions.
- The recent hard-refresh bug on `/dashboard-v2/library` was not a real jump to another page; the route was briefly showing the app-level fallback before the dashboard-v2 family/library fallback mounted.
- The route now has an explicit route-ready marker and dashboard-specific handoff timing so entry overlays should wait for `dashboard-library` readiness rather than treating generic dashboard-shell readiness as sufficient.
- The library route is also part of the post-purchase path from checkout.

## Why It Matters

Library is where marketplace ownership becomes concrete for the user.

## Key Files

- `src/app/(dashboard-v2)/dashboard-v2/library/page.tsx`
- `src/app/(dashboard-v2)/dashboard-v2/library/loading.tsx`
- `src/components/skeletons/DashboardUserRouteSkeletons.tsx`
- `tests/e2e/navigation-shells.spec.ts`

## Flows

- authenticated user opens library
- marketplace user navigates into library
- library user returns to resources
- post-purchase user lands on library-owned state

## Invariants

- Route transitions must not show a blank gap.
- Library shell and resources shell ownership must stay consistent across navigation.
- Library access requires authenticated ownership context.
- Hard refresh on `/dashboard-v2/library` must prefer either a neutral root fallback or the dashboard-v2/library family shell; it must not render a public-route-shaped loading shell that looks like a different page.

## Known Risks

- Auth timing and transition state can reintroduce flaky browser tests.
- Dashboard and marketplace overlay ownership can drift if changed independently.
- Wrong-level App Router fallbacks can be mistaken for a route jump even when the router never left `/dashboard-v2/library`; verify fallback hierarchy before treating the issue as a wrong-route bug.

## Related Pages

- [Auth System](../systems/auth.md)
- [Purchase To Library](../flows/purchase-to-library.md)
- [Browser Verification](../testing/browser-verification.md)

## Sources

- [`tests/e2e/navigation-shells.spec.ts`](../../../tests/e2e/navigation-shells.spec.ts)
- [`krukraft-ai-contexts/04-architecture.md`](../../../krukraft-ai-contexts/04-architecture.md)

## Last Reviewed

- 2026-04-13
