# KruCraft Marketplace — Documentation Index

Thai SaaS marketplace for downloadable educational resources (`krucrafts.com`).

This directory is an AI context pack for agents working in this repo. It should
track the current codebase state, not just earlier conversation exports.

---

## Files

| File | Description |
|------|-------------|
| [01-overview.md](01-overview.md) | Project overview, naming history, conversation-origin background |
| [02-brand-identity.md](02-brand-identity.md) | Brand name, personality, domain decision, logo concept |
| [03-tech-stack.md](03-tech-stack.md) | Current stack, scripts, storage and env notes |
| [04-architecture.md](04-architecture.md) | Layered architecture, request flow, caching, proxy/build-safe config |
| [05-features.md](05-features.md) | Marketplace, admin, payment, auth recovery, and download features |
| [06-design-system.md](06-design-system.md) | Color system, typography, spacing, components, resource card spec |
| [07-layout-ux.md](07-layout-ux.md) | Layout system, page layouts, marketplace/detail/dashboard/admin UX |
| [08-performance-audit.md](08-performance-audit.md) | Current performance status, landed optimizations, remaining hotspots |
| [09-todos.md](09-todos.md) | Current TODOs and ongoing audit scope |
| [KruCraft-Documentation.md](KruCraft-Documentation.md) | Compact stitched summary and pointers back to the modular docs |

---

## Quick Facts

- **Stack:** Next.js 16 App Router, React 18, TypeScript, Prisma, PostgreSQL, Stripe, Xendit, Cloudflare R2, Upstash Redis, Vercel
- **Architecture:** API Route → Service → Repository → Prisma (strictly enforced)
- **Domain:** `krucrafts.com`
- **Build policy:** `npm run build` is schema-mutation-free; Prisma migrations run separately via `npm run db:deploy`
- **Current perf shape:** public marketplace/detail paths use multi-tier caching, RSC streaming, and post-deploy warm/perf verification
- **Current ops warning:** production/build path still warns that `XENDIT_SECRET_KEY` is a test key

---

## Current State Notes

- `src/proxy.ts` is the active request interception entry for Next 16. `middleware.ts` is a compatibility shim.
- Public image delivery now bypasses `/_next/image` for many remote preview assets to reduce image-optimizer bottlenecks.
- Resource detail pages were decomposed into shell + deferred body/footer/purchase/review/related paths to reduce first-render latency.
- Admin settings must read live DB-backed platform config; build-safe platform config is only for branding-only build paths.
- This directory was refreshed against the repo on `2026-03-31`. If architecture/perf/deploy behavior changes materially, update these docs in the same branch.
