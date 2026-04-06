# Resource Detail Route

## Summary

`/resources/[slug]` is the resource detail route that combines gallery, purchase rail, body content, reviews, and related sections behind a shared route shell.

## Current Truth

- The route uses a dedicated detail shell with `data-route-shell-ready="resource-detail"`.
- Multiple detail sections are streamed or deferred independently.
- Browser verification now treats the detail shell as the stable route-ready marker instead of waiting only on `main h1`.
- The client loading shell now owns its own fallback markup instead of importing `ResourceDetailSections.tsx`, so navigation overlays do not drag server-only platform/viewer-state dependencies into the browser bundle.

## Why It Matters

Detail is the conversion route for purchases and a common source of loading and hydration regressions.

## Key Files

- `src/app/resources/[slug]/page.tsx`
- `src/components/resources/detail/ResourceDetailShell.tsx`
- `src/components/resources/detail/ResourceHeader.tsx`
- `src/components/resources/detail/ResourceDetailLoadingShell.tsx`

## Flows

- navigate from discover/listing to detail
- scroll resets to top
- detail shell loads
- body/purchase/reviews/related sections stream in

## Invariants

- Detail route shell should be detectable independently of late-streaming content.
- Loading UI must preserve resource-detail geometry.
- Purchase and ownership state must not depend on title visibility alone.
- Client overlays and loading shells must stay presentation-only; service-backed section modules belong on the server route tree, not inside browser-mounted overlay code.

## Known Risks

- Heading-based tests can become flaky if detail sections stream later than the shell.
- Detail viewer-state and purchase-rail work can regress separately from the body content.
- Re-coupling the loading shell to `ResourceDetailSections.tsx` or broad service barrels can reintroduce `server-only` / `revalidateTag` dev-bundle failures even when `typecheck` and `lint` still pass.

## Related Pages

- [Resources Browse](resources-browse.md)
- [Purchase To Library](../flows/purchase-to-library.md)
- [Browser Verification](../testing/browser-verification.md)

## Sources

- [`src/app/resources/[slug]/page.tsx`](../../../src/app/resources/%5Bslug%5D/page.tsx)
- [`src/components/resources/detail/ResourceDetailShell.tsx`](../../../src/components/resources/detail/ResourceDetailShell.tsx)
- [`src/components/resources/detail/ResourceDetailLoadingShell.tsx`](../../../src/components/resources/detail/ResourceDetailLoadingShell.tsx)
- [`tests/e2e/resources.smoke.spec.ts`](../../../tests/e2e/resources.smoke.spec.ts)

## Last Reviewed

- 2026-04-07
