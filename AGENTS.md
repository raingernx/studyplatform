# AGENTS.md

This file provides context for AI coding agents (Cursor, Codex, Claude, Aider, etc.) working with this repository.

The goal is to help AI understand the architecture, conventions, and development rules of this project.

---

# Project Overview

StudyPlatform is a SaaS web application that provides a marketplace for digital learning resources.

Users can:

- Browse a public library of resources
- Purchase downloadable study materials
- Access purchased resources through a dashboard
- Subscribe to memberships
- Download files securely

The system also includes an admin panel for managing resources and users.

---

# Tech Stack

Framework  
Next.js 14 (App Router)

Frontend

- React
- TypeScript
- Tailwind CSS

Backend

- Next.js API Routes

Authentication

- NextAuth
- Google OAuth
- Credentials provider
- JWT sessions

Database

- PostgreSQL

ORM

- Prisma

Payments

- Stripe

Deployment

- Vercel (planned)

Storage (future)

- Cloudflare R2 or S3

---

# Backend Architecture

The backend follows a layered architecture.

```
routes → services → repositories → Prisma → database
```

### Routes

Location

```
src/app/api
```

Responsibilities

- request parsing
- authentication checks
- response formatting

Routes must remain **thin controllers**.

---

### Services

Location

```
src/services
```

Responsibilities

- business logic
- orchestration
- validation

Examples

- payment.service
- download.service
- subscription.service

---

### Repositories

Location

```
src/repositories
```

Responsibilities

- database access
- Prisma queries
- persistence logic

Repositories must be the **only layer calling Prisma**.

---

### Analytics

Location

```
src/analytics
```

Responsibilities

- analytics event tracking
- resource statistics
- trending score calculations
- creator analytics

---

### Workers

Location

```
src/workers
```

Responsibilities

- analytics aggregation
- trending calculations
- background processing

---

# Project Structure

Main source directory:

```

src/

```

Next.js App Router structure:

```

src/app

(auth)
login/page.tsx
register/page.tsx

(dashboard)
dashboard/page.tsx
resources/page.tsx
purchases/page.tsx
subscription/page.tsx
settings/page.tsx

admin
page.tsx

library
page.tsx

resources
[id]/page.tsx

api
auth/
checkout/
download/
resources/
subscriptions/

```

---

# Core Systems

## Authentication

Authentication uses NextAuth.

Providers:

- Google OAuth
- Credentials login

Session strategy:

JWT

Session fields include:

```

user.id
user.role
user.subscriptionStatus

```

Roles:

```

USER
ADMIN

```

---

# Middleware

Middleware protects restricted routes.

Protected routes:

```

/dashboard/*
/admin/*

```

Admin access requires:

```

token.role === "ADMIN"

```

---

# Resource Marketplace

Public routes:

```

/library
/resources/[id]

```

Users can browse resources and view details before purchasing.

Purchase flow:

```

User opens resource page
↓
User starts Stripe checkout
↓
Stripe checkout session created
↓
Stripe webhook fires
↓
Purchase stored in database
↓
Resource unlocked in dashboard

```

---

# Dashboard System

User dashboard routes:

```

/dashboard
/dashboard/resources
/dashboard/purchases
/dashboard/subscription
/dashboard/settings

```

Features:

- View purchased resources
- Download purchased files
- Manage subscription
- Update account settings

---

# Admin System

Admin routes:

```

/admin
/admin/resources
/admin/users
/admin/analytics

```

Admin features:

- Upload resources
- Manage resources
- View users
- Track downloads
- Monitor sales
- Manage subscriptions

Only users with role:

```

ADMIN

```

can access these routes.

---

# API Architecture

API routes exist under:

```

src/app/api

```

Primary groups:

```

auth
resources
checkout
subscriptions
download

```

Each API route should:

- validate authentication when required
- validate permissions
- use Prisma for database access

---

# Development Rules

AI agents must follow these guidelines when editing the repository.

Do not break existing routes.

Prefer server components where possible.

Use Prisma for database access.

Avoid modifying authentication logic unless required.

Maintain role-based access control.

Keep API routes modular.

Avoid creating unnecessary duplicate logic.

For new UI work, prefer importing primitives, layout helpers, and composed building blocks from:

```
src/design-system/*
```

Only import directly from:

```
src/components/ui
```

when extending or maintaining the primitive layer itself. Treat files in
`src/components/ui` as transitional primitive implementations, not as the
default import surface for app code, and avoid adding new feature-level
primitives there.

Deprecated wrappers and temporary compatibility shims must not be used for new
work. If a shim remains in the repo, keep it as a thin pass-through only and do
not add new styling, behavior, or feature logic to it.

For app and feature code, import DS-covered primitives and composed UI from:

```
@/design-system
```

Do not add new primitives under `src/components/ui`, do not recreate deleted
wrapper patterns like `PrimaryButton`, `SecondaryButton`, `SearchInput`, or
duplicate `FormSection` / `PageContainer` aliases, and if a needed primitive is
missing, add it to `src/design-system` first. Treat remaining legacy backbone
files as implementation details only.

## UI Loading And Streaming Rules

When editing any UI that has loading, streaming, or deferred states:

- changing the final UI means changing the related skeleton/fallback/loading UI in the same patch
- skeletons must match the final layout closely in structure, spacing, hierarchy, and approximate height
- generic skeletons must not replace feature-specific loading states when the final UI has a distinctive layout
- every affected `loading.tsx`, `Suspense fallback`, empty state, and error fallback must be reviewed when the final UI changes
- `fallback={null}` is allowed only for intentionally invisible or non-structural subtrees where reserving space is unnecessary and layout shift risk is negligible
- a UI change is incomplete if the streamed/loading state still reflects the old layout

## Viewer-State And Personalization Rules

For public or high-traffic routes:

- do not read session, cookies, or headers at the page level just to support personalized UI if that would make the whole route request-bound
- keep the public shell on the server path and move viewer-specific state behind a client hydration boundary when practical
- treat viewer-state as a data contract for auth/ownership/personalization, not as a dump of presentation-specific values
- only add fields to viewer-state when the UI truly needs new viewer-specific data
- shared cache keys must never include per-user state
- per-user state must never be stored in shared cache layers
- after performance-sensitive route changes, verify that public routes did not accidentally regain `cookies()`, `headers()`, or server-session reads at the page level

---

# Performance Guidelines

When writing database queries:

Avoid N+1 queries.

Use Prisma relations efficiently.

Paginate resource queries when returning lists.

Optimize expensive queries.

When editing public routes with streaming or personalization:

- verify `typecheck` and `lint`
- verify the changed route, API, or user flow actually works at runtime when practical, not just at compile time
- for route and API work, prefer a local smoke check against the real path or endpoint before declaring the task done
- if runtime verification is blocked, state that explicitly instead of assuming success
- if a streamed UI changed, its matching `loading.tsx`, Suspense fallback, skeleton, empty state, and error state must be reviewed and updated in the same patch when needed
- treat loading/fallback UI as part of the feature, not optional polish
- `fallback={null}` is only acceptable for non-structural UI that does not need reserved layout space
- verify the relevant loading/skeleton UI still matches the final rendered UI
- grep for accidental page-level `cookies()`, `headers()`, `getServerSession`, or equivalent request-bound auth reads on public routes
- after search, filter, sort, auth, or cache changes, look for regressions and repeated errors in logs, response payloads, or rendered output instead of relying on happy-path reasoning only
- after changes to search, auth, cache, or other runtime-sensitive flows, scan recent logs after the smoke test to check for repeated errors, hidden runtime failures, and hydration issues
- when scanning logs, distinguish between historical errors and errors reproduced after the latest change; do not claim success if the latest smoke test still produces matching log failures

---

# File Storage

Downloads are currently handled through protected routes.

Future storage will move to:

Cloudflare R2 or Amazon S3.

Files must never be exposed publicly without authentication.

---

# AI Agent Behavior

When implementing features:

1. Read project structure before editing files.
2. Respect Next.js App Router conventions.
3. Use existing patterns for API routes.
4. Ensure database consistency via Prisma.
5. Maintain security for downloads and admin routes.
6. Do not mark work complete until the changed flow has been checked for obvious errors and regressions at a level proportional to the change.
7. Prefer proof over assumption: if a route, API, cache, or search flow was changed, verify that the specific thing works.
8. If runtime verification disproves an earlier assumption or summary, correct the record explicitly instead of quietly proceeding.
9. When multiple follow-up improvements are possible, prefer the highest-impact safe pass before deeper or riskier refactors.

AI agents should avoid large architectural changes unless explicitly requested.

---

# AI Context Maintenance

The repo includes a shared AI context pack under:

```
krucraft-ai-contexts/
```

Agents should treat that directory as a maintained reference for current
project truth, not a frozen export.

Updating `krucraft-ai-contexts/` after system-level changes is not optional housekeeping.
It is part of completing the task whenever shared understanding of the system changed.
If the implementation changes architecture, rendering, caching, routing, auth behavior,
major UX flows, or operational expectations, the relevant context files must be updated
in the same work session before the task is considered complete.

## When context updates are required

Update the relevant files in `krucraft-ai-contexts/` in the **same commit** when
the change affects system-level understanding, including:

- architecture or request/data flow
- routing, proxy, middleware, or auth behavior
- caching, warm-cache, performance workflow, or rendering strategy
- deployment, build, migration, or environment requirements
- major feature flows (payments, downloads, account recovery, admin workflows)
- brand/platform behavior that affects shared understanding across agents

## When context updates are usually not required

Context updates are usually unnecessary for:

- small visual tweaks
- copy edits
- isolated bug fixes that do not change system behavior
- test-only changes
- local refactors that preserve the same external behavior

## Commit-time reminder

Before commits that touch system-level behavior, run:

```bash
npm run context:check:staged
```

This repo also includes a pre-commit hook template under:

```bash
.githooks/pre-commit
```

To enable it locally:

```bash
git config core.hooksPath .githooks
```

This repo now enforces the staged check in pre-commit. Commits that touch
system-level behavior but do not update `krucraft-ai-contexts/` will fail until
the relevant context files are included in the same commit.

To run the blocking version manually:

```bash
npm run context:check:staged:strict
```

## Verification expectation

For non-trivial changes, agents should usually finish by reporting:

- what was changed
- what checks were run
- which route, API, or user flow was verified
- whether the flow was verified at runtime
- any remaining uncertainty or blocked verification

Do not report success based only on static analysis when a runtime check was practical and relevant.
