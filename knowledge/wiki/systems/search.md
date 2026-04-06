# Search System

## Summary

Marketplace search is centered on `/resources`, with canonical search routing, typeahead suggestions, recovery flows, and weighted ranking.

## Current Truth

- Search queries route to `/resources` rather than ad-hoc page-local query strings.
- Live search suggestions and full result pages share ranking logic.
- No-result flows offer recovery suggestions and alternate browse paths.

## Why It Matters

Search is one of the most performance-sensitive and user-visible public features in the repo.

## Key Files

- `src/config/search.ts`
- `src/app/api/search/route.ts`
- `src/app/resources/(browse)/page.tsx`
- `src/services/search/*`

## Flows

- user types in shared marketplace search
- typeahead suggestions fetch lightweight suggestion data
- Enter or explicit result navigation routes to canonical `/resources`
- no-result pages render recovery suggestions on the same route

## Invariants

- Search routing stays canonical to `/resources`.
- Search config should live in shared config instead of inline hardcoding.
- Search changes should be verified with browser smoke and runtime checks.

## Known Risks

- Ranking SQL or cache changes can regress both typeahead and result pages.
- Search performance issues can hide behind successful but slow responses.

## Related Pages

- [Resources Browse](../routes/resources-browse.md)
- [Browser Verification](../testing/browser-verification.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)

## Sources

- [`krukraft-ai-contexts/04-architecture.md`](../../../krukraft-ai-contexts/04-architecture.md)
- [`krukraft-ai-contexts/05-features.md`](../../../krukraft-ai-contexts/05-features.md)

## Last Reviewed

- 2026-04-06
