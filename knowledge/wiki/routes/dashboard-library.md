# Dashboard Library Route

## Summary

`/dashboard/library` is the signed-in ownership surface for purchased or claimed resources.

## Current Truth

- Browser verification covers both `resources -> dashboard/library` and `dashboard/library -> resources`.
- Navigation state, route shells, and transition overlays were hardened to avoid blank gaps during these transitions.
- The library route is also part of the post-purchase path from checkout.

## Why It Matters

Library is where marketplace ownership becomes concrete for the user.

## Key Files

- `src/app/(dashboard)/dashboard/library/page.tsx`
- `src/app/(dashboard)/dashboard/library/loading.tsx`
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

## Known Risks

- Auth timing and transition state can reintroduce flaky browser tests.
- Dashboard and marketplace overlay ownership can drift if changed independently.

## Related Pages

- [Auth System](../systems/auth.md)
- [Purchase To Library](../flows/purchase-to-library.md)
- [Browser Verification](../testing/browser-verification.md)

## Sources

- [`tests/e2e/navigation-shells.spec.ts`](../../../tests/e2e/navigation-shells.spec.ts)
- [`krukraft-ai-contexts/04-architecture.md`](../../../krukraft-ai-contexts/04-architecture.md)

## Last Reviewed

- 2026-04-06
