# Resources Browse Route

## Summary

`/resources` is the canonical public marketplace route for discover, browse, and search results.

## Current Truth

- The browse index lives under `src/app/resources/(browse)/*`.
- Discover and listing modes share the route but switch based on search, filters, pagination, or sort state.
- Route-level loading and skeleton shells are now intentionally maintained to match discover and listing geometry.

## Why It Matters

This route carries the highest amount of public browsing traffic and is central to both UX and performance work.

## Key Files

- `src/app/resources/(browse)/page.tsx`
- `src/app/resources/(browse)/loading.tsx`
- `src/components/skeletons/ResourcesRouteSkeleton.tsx`
- `src/components/marketplace/ResourcesLayoutShell.tsx`

## Flows

- discover landing
- filtered listing
- search results
- navigation into resource detail
- navigation into dashboard library for authenticated owners

## Invariants

- `/resources` remains the canonical search/browse route.
- Loading UI must match discover or listing mode rather than generic placeholders.
- Public route performance changes must avoid request-bound auth at the page level.

## Known Risks

- Search, viewer-state, and recommendation changes can all regress this route.
- Skeleton and overlay behavior can drift from final UI if updated separately.

## Related Pages

- [Search](../systems/search.md)
- [Resource Detail](resource-detail.md)
- [Skeleton Policy](../design-system/skeleton-policy.md)
- [Browser Verification](../testing/browser-verification.md)

## Sources

- [`krukraft-ai-contexts/04-architecture.md`](../../../krukraft-ai-contexts/04-architecture.md)
- [`krukraft-ai-contexts/05-features.md`](../../../krukraft-ai-contexts/05-features.md)
- [`src/app/resources/(browse)/page.tsx`](../../../src/app/resources/%28browse%29/page.tsx)

## Last Reviewed

- 2026-04-06
