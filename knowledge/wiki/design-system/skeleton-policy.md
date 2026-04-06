# Skeleton Policy

## Summary

Krukraft now treats loading UI as a first-class part of the feature surface, not optional polish.

## Current Truth

- Route-level loading coverage was filled across product-facing and admin-facing routes.
- Runtime-critical marketplace and dashboard skeletons were aligned with final layout geometry.
- Browser verification now covers the most important route and transition shells.

## Why It Matters

Skeleton drift causes misleading UX, transition flashes, and hard-to-debug regressions.

## Key Files

- `src/components/skeletons/*`
- `src/app/**/loading.tsx`
- `src/app/dev/bones/page.tsx`
- `scripts/check-app-skeletons.mjs`

## Flows

- route-level loading for public/product/admin routes
- runtime transition shells for resources and dashboard
- bones preview capture via `/dev/bones`

## Invariants

- Final UI changes should update loading and fallback UI in the same patch.
- Runtime skeletons should use neutral structural shells, not arbitrary generated placeholders.
- Bones preview/capture should stay separate from runtime ownership of the route shell.

## Known Risks

- Browser coverage can still miss low-traffic skeleton paths.
- Preview-only skeleton files can look like runtime surfaces if naming drifts.

## Related Pages

- [Resources Browse](../routes/resources-browse.md)
- [Resource Detail](../routes/resource-detail.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)

## Sources

- [Skeleton Runtime Policy](../../raw/design/skeleton-runtime-policy.md)
- [`AGENTS.md`](../../../AGENTS.md)
- [`design-system.md`](../../../design-system.md)
- [`krukraft-ai-contexts/06-design-system.md`](../../../krukraft-ai-contexts/06-design-system.md)
- [`krukraft-ai-contexts/07-layout-ux.md`](../../../krukraft-ai-contexts/07-layout-ux.md)

## Last Reviewed

- 2026-04-06
