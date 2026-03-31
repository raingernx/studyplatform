# KruCraft — Architecture

## Layered Architecture (Strict Rule)

```
API Route → Service → Repository → Prisma
```

- Never call Prisma directly from route handlers or components
- Services own business logic and orchestration
- Repositories own data access
- This pattern is actively maintained in the repo

## Key Architecture Constraints

- Do not break auth, purchase, upload, or download flows
- Do not move business logic back into routes
- Prefer server components where possible
- Do not modify authentication logic casually
- Keep build-safe and runtime-dynamic paths separate

## Route Structure

```
src/app/
  resources/                  ← Public marketplace
  resources/[slug]/           ← Resource detail page
  categories/[slug]/          ← Category landing page
  creators/[slug]/            ← Public creator page
  support/                    ← Public support page
  auth/*                      ← Login / register / reset-password
  (dashboard)/*               ← User dashboard
  admin/*                     ← Admin panel
  api/*                       ← Thin route handlers
```

## Request Interception

```
src/proxy.ts   ← active Next 16 request interception entry
middleware.ts  ← compatibility shim / re-export surface
```

Current proxy concerns:
- dashboard/admin protection
- locale-prefix cleanup / redirect behavior
- ranking experiment cookie work

## Caching Architecture

```
Upstash Redis (cross-instance cache)
  → unstable_cache (per-instance cache)
  → runSingleFlight (same-instance dedup)
```

Used heavily in:
- marketplace listing variants
- discover sections
- resource detail shell/body/footer/purchase meta
- reviews / related content
- platform settings

## Public Marketplace Architecture

```
/resources
  dynamic route
    → discover hero streamed separately
    → listing/discover content streamed separately
    → listing caches keyed by sort/category/page
    → post-deploy warm + smoke perf workflow
    → selective usable fallbacks where they match final section intent
```

## Resource Detail Architecture

```
/resources/[slug]
  shared resource loader → metadata + shell
    → purchase meta deferred
    → body content deferred
    → footer content deferred
    → public reviews deferred
    → owner review form deferred separately
    → related section deferred separately
```

Key details:
- optional session work is pushed off the main anonymous critical path where possible
- remote preview images bypass `/_next/image` in many places to reduce LCP and image-optimizer bottlenecks
- purchase rail is decomposed so CTA can appear before all trust/meta subparts

## Dashboard / Admin

```
dashboard/* → force-dynamic, per-user
admin/*     → force-dynamic, role-gated
```

Admin settings note:
- build-safe platform config is only for branding-only build surfaces
- `/admin/settings` must read live DB-backed platform settings

## Authentication

```
NextAuth JWT strategy
  → credentials login
  → Google OAuth
  → role-aware protected routes
  → password reset + soft email verification
```

## Build-Safe Platform Config

```
root layout / metadata / selected public pages
  → build-safe platform defaults

admin settings / live platform editing
  → DB-backed platform config
```

This separation exists to avoid Prisma build-time warnings and DB dependency in static build paths.

## Current Architectural Notes

- Build no longer runs `prisma migrate deploy`
- Post-deploy warm/perf workflow includes smoke coverage for resources home, listings, creator detail, resource detail, and category listing
- Category landing pages intentionally use `newest` for their first-page curated feed
- `src/env.ts` is the central server env validation surface

---

*Refreshed against the repo state on 2026-03-31.*
