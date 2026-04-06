# Platform Brand Asset Delivery

## Summary

Krukraft now supports dedicated dark-theme brand assets for navigation surfaces and keeps an always-visible local fallback under the active custom logo so branding does not disappear during refreshes.

## Current Truth

- `PlatformSettings` stores `logoFullDarkUrl` and `logoIconDarkUrl` alongside the light/default logo fields.
- Build-safe public platform config exposes `/brand-assets/full-logo-dark` and `/brand-assets/icon-logo-dark` without making root layout or metadata DB-bound.
- `Logo.tsx` mounts local repo-owned fallback assets first, then overlays theme-specific custom images and hides the fallback only after the active image has loaded.
- because the runtime `/brand-assets/*` dark alias can still resolve to the same uploaded light logo, the dark-theme logo stack intentionally keeps using the light fallback for first paint on runtime-logo paths so refreshes do not flash a mismatched dark-default logo before the uploaded asset arrives.
- the logo stack requests the fallback and active light/dark logo images at high priority from SSR markup because brand navigation is treated as critical-path UI.
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
- SSR markup requests both the repo-owned fallback assets and the current light/dark runtime logo images at high priority
- `Logo` renders local fallback assets immediately and overlays the active runtime logo image for the current theme

## Invariants

- root layout and metadata remain build-safe and must not read live DB-backed platform settings directly
- `/brand-assets/*` must guard against self-referential alias values
- dark surfaces must not rely on light-only logo artwork when a dedicated dark asset exists
- the logo wrapper should reserve fixed geometry so route refreshes do not shift layout

## Known Risks

- runtime alias routes still use `no-store`, so the custom logo image itself remains network-bound until a stronger versioned asset strategy is introduced
- preloading both light and dark logo routes increases request count slightly in exchange for faster theme-ready branding

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
