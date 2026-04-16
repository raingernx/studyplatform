# Krukraft Marketplace — Documentation Index

Thai SaaS marketplace for downloadable educational resources (`krukraft.com`).

This directory is an AI context pack for agents working in this repo. It should
track the current codebase state, not just earlier conversation exports.

---

## Files

| File | Description |
|------|-------------|
| [01-overview.md](01-overview.md) | Project overview, naming history, conversation-origin background |
| [02-brand-identity.md](02-brand-identity.md) | Brand name, personality, domain decision, logo concept |
| [03-tech-stack.md](03-tech-stack.md) | Current stack, scripts, verification surfaces, storage and env notes |
| [04-architecture.md](04-architecture.md) | Layered architecture, request flow, caching, proxy/build-safe config |
| [05-features.md](05-features.md) | Marketplace, admin, payment, auth recovery, and download features |
| [06-design-system.md](06-design-system.md) | Design-system source of truth, DS surfaces, and Storybook verification |
| [07-layout-ux.md](07-layout-ux.md) | Current marketplace/detail/dashboard/admin layouts and search UX |
| [08-performance-audit.md](08-performance-audit.md) | Current performance status, landed optimizations, remaining hotspots |
| [09-todos.md](09-todos.md) | Current TODOs and ongoing audit scope |
| [10-thread-rollup.md](10-thread-rollup.md) | Consolidated Codex thread recovery history, workspace aliases, and rolled-up discussion index |
| [Krukraft-Documentation.md](Krukraft-Documentation.md) | Compact stitched summary and pointers back to the modular docs |

---

## Quick Facts

- **Stack:** Next.js 16 App Router, React 18, TypeScript, Prisma, PostgreSQL, Stripe, Xendit, Cloudflare R2, Upstash Redis, Vercel
- **Architecture:** API Route → Service → Repository → Prisma (strictly enforced)
- **Domain:** `krukraft.com`
- **Build policy:** `npm run build` is schema-mutation-free; Prisma migrations run separately via `npm run db:deploy`
- **Current perf shape:** public marketplace/detail paths use multi-tier caching, RSC streaming, and browser/perf verification layers (Playwright, Storybook smoke, optional Chromatic visual review, LHCI, bundle analysis)
- **Current ops warning:** production/build path still warns that `XENDIT_SECRET_KEY` is a test key
- **Thread recovery:** `10-thread-rollup.md` is the repo-owned consolidation point for historical Codex thread context and path alias recovery

---

## Current State Notes

- `src/proxy.ts` is the active request interception entry for Next 16. `middleware.ts` is a compatibility shim.
- Public preview images use Next Image when the source is optimizer-compatible (`https`, allowlisted remote hosts); the app bypasses `/_next/image` only for non-optimizable cases such as GIFs, non-HTTPS sources, or non-allowlisted hosts.
- Above-the-fold marketplace surfaces now opt specific hero/spotlight/card images into eager loading instead of applying blanket eager behavior.
- Theme first-paint bootstrap now defaults to the resolved `system` theme and applies stored `light` / `dark` preferences before hydration, so fresh loads follow OS appearance again unless the user explicitly picked another theme.
- The app now serves a generated root `robots.txt` via `src/app/robots.ts`, using build-safe public platform config so crawlers no longer hit a local/public 404 just to discover crawl rules.
- Resource detail pages were decomposed into shell + deferred body/footer/purchase/review/related paths to reduce first-render latency.
- Admin settings must read live DB-backed platform config; build-safe platform config is only for branding-only build paths.
- Public logo / favicon / OG assets now flow through runtime `/brand-assets/*` routes so admin brand uploads can update public surfaces without reintroducing build-time Prisma dependency.
- Local browser verification uses Playwright via `npm run test:e2e`; the local project still uses the `chromium` name, but on this macOS setup it now defaults to `channel: "chromium"` so verification uses Playwright's bundled Chromium browser instead of the headless shell or installed Chrome stable. Set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` only when you intentionally want installed-Chrome coverage.
- Storybook is scoped to `src/design-system/primitives/*` and `src/design-system/components/*`; `npm run storybook:smoke` is the stable local verification path.
- `src/design-system/README.md` is the quick inventory for current DS ownership, while `/design-system.md` is the repo-owned Figma reconstruction and handoff reference.
- `boneyard-js` is installed as an optional skeleton-capture tool. It writes generated bones to `src/bones`, but it supplements rather than replaces the repo's existing loading/fallback parity rules.
- `npm run chromatic` is available as an opt-in hosted Storybook review path once a Chromatic project token exists, and `npm run repomix` / `npm run repomix:split` are available for local AI-context export with repo-owned `.repomixignore` safeguards.
- Historical Codex thread recovery now lives in `10-thread-rollup.md`; older thread metadata may still reference `studyplatform` or `krucraft`, but the canonical workspace path remains `/Users/shanerinen/Projects/krukraft`.
- This directory was refreshed against the repo on `2026-04-05`. If architecture/perf/deploy behavior changes materially, update these docs in the same branch.
