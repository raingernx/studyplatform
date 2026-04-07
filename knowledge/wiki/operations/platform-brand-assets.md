# Platform Brand Asset Delivery

## Summary

Krukraft now supports dedicated dark-theme brand assets for navigation surfaces and uses repo-owned local assets as a true failure fallback instead of cross-fading from local fallback artwork into uploaded runtime logos on every refresh.

## Current Truth

- `PlatformSettings` stores `logoFullDarkUrl` and `logoIconDarkUrl` alongside the light/default logo fields.
- Build-safe public platform config exposes `/brand-assets/full-logo-dark` and `/brand-assets/icon-logo-dark` without making root layout or metadata DB-bound.
- `Logo.tsx` renders the active theme-specific uploaded logo directly and only swaps to the repo-owned fallback asset if that uploaded image fails to load.
- `NavbarBrand` intentionally opts out of uploaded runtime logos and uses the repo-owned local light/dark logo pair so the most visible first-paint brand surface stays stable on refresh.
- dark runtime logo resolution no longer falls back to uploaded light logos; if no dedicated dark asset is stored, the stack now stays on the repo-owned dark fallback so dark refreshes do not settle onto a light wordmark after load.
- the logo stack requests the active light/dark runtime logo images at high priority from SSR markup because brand navigation is treated as critical-path UI, while local repo assets remain a failure-only escape hatch.
- Admin settings can now upload and preview both light and dark versions of full and icon logos.

## Why It Matters

Navigation branding is visible on nearly every route. If the logo waits on a runtime redirect or disappears on theme changes and refreshes, the UI looks broken before the rest of the page has even loaded.

## Key Files

- `src/components/brand/Logo.tsx`
- `src/services/platform/platform.service.ts`
- `src/app/layout.tsx`
- `src/app/brand-assets/[asset]/route.ts`
- `src/app/admin/settings/AdminSettingsClient.tsx`
- `src/components/admin/settings/BrandAssetField.tsx`
- `prisma/schema.prisma`

## Flows

- admin uploads light/dark full or icon logos from `/admin/settings`
- platform settings persist dedicated dark-logo URLs
- build-safe public config exposes runtime alias routes for light/dark full + icon logos
- SSR markup requests the current light/dark runtime logo images at high priority
- `Logo` keeps the light/dark runtime asset mounted as the steady-state layer and only switches to the repo-owned fallback if that asset errors
- `NavbarBrand` uses the same `Logo` component with `preferRepoAsset` enabled, which makes navbar branding deterministic even when uploaded brand assets are remote

## Invariants

- root layout and metadata remain build-safe and must not read live DB-backed platform settings directly
- `/brand-assets/*` must guard against self-referential alias values
- dark surfaces must not settle onto light-only logo artwork after load when no dedicated dark asset exists
- the logo wrapper should reserve fixed geometry so route refreshes do not shift layout

## Known Risks

- runtime alias routes still use `no-store`, so the custom logo image itself remains network-bound until a stronger versioned asset strategy is introduced
- requesting both light and dark runtime logo routes still increases request count slightly in exchange for faster theme-ready branding
- if the uploaded light/dark logo files themselves use different whitespace or artboards, theme switches can still look visually inconsistent even though refresh-time fallback jumps are removed
- navbar branding will no longer reflect uploaded custom logos immediately; the tradeoff is intentional so the top-level chrome remains visually stable
- dark-theme branding still depends on an explicit dark upload if the repo-owned fallback is not good enough for the brand

## Related Pages

- [Knowledge Layer Operations](knowledge-layer.md)
- [Post-Deploy Warm Workflow](post-deploy-warm-workflow.md)

## Sources

- [Platform Brand Assets Dark Theme Baseline](../../raw/operations/platform-brand-assets-dark-theme-baseline.md)
- [Canonical source: `src/components/brand/Logo.tsx`](../../../src/components/brand/Logo.tsx)
- [Canonical source: `src/services/platform/platform.service.ts`](../../../src/services/platform/platform.service.ts)
- [Canonical source: `src/app/admin/settings/AdminSettingsClient.tsx`](../../../src/app/admin/settings/AdminSettingsClient.tsx)
- [Canonical source: `src/app/brand-assets/[asset]/route.ts`](../../../src/app/brand-assets/%5Basset%5D/route.ts)
- [Canonical source: `src/app/layout.tsx`](../../../src/app/layout.tsx)

## Last Reviewed

- 2026-04-07
