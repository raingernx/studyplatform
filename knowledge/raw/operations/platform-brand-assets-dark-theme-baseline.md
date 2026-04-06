# Platform Brand Assets Dark Theme Baseline

## Summary

Capture the current dark-theme brand asset flow so follow-up UI, admin-branding, and asset-delivery work can cite one durable operations note.

## Source Reference

- [Canonical source: `src/components/brand/Logo.tsx`](../../../src/components/brand/Logo.tsx)
- [Canonical source: `src/services/platform/platform.service.ts`](../../../src/services/platform/platform.service.ts)
- [Canonical source: `src/app/admin/settings/AdminSettingsClient.tsx`](../../../src/app/admin/settings/AdminSettingsClient.tsx)
- [Canonical source: `src/app/brand-assets/[asset]/route.ts`](../../../src/app/brand-assets/[asset]/route.ts)
- [Canonical source: `src/app/layout.tsx`](../../../src/app/layout.tsx)
- [Canonical source: `prisma/schema.prisma`](../../../prisma/schema.prisma)

## Notes

- Dedicated `logoFullDarkUrl` and `logoIconDarkUrl` fields now exist from Prisma through admin settings and build-safe public config.
- Public dark-theme brand assets resolve through `/brand-assets/full-logo-dark` and `/brand-assets/icon-logo-dark`.
- The `Logo` component now keeps local repo-owned fallback assets mounted until the active custom logo has loaded, preventing blank logo slots on refresh.
- The logo stack requests both fallback and active light/dark logo assets at high priority from SSR markup so critical navigation branding requests start early without a second manual preload layer.

## Related Wiki Pages

- [Platform Brand Asset Delivery](../../wiki/operations/platform-brand-assets.md)
- [Knowledge Layer Operations](../../wiki/operations/knowledge-layer.md)

## Captured At

- 2026-04-07
