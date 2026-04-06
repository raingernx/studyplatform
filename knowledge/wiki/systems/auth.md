# Auth System

## Summary

Krukraft uses NextAuth with JWT sessions and a mix of credentials and Google OAuth flows.

## Current Truth

- Protected routes are handled through request interception for `/dashboard*` and `/admin*`.
- Lightweight viewer-state and auth chrome prefer JWT token reads instead of Prisma-backed session reads where possible.
- Local and CI browser verification uses deterministic seeded credentials for admin and creator users.

## Why It Matters

Auth behavior affects route protection, viewer-state performance, browser smoke reliability, and any feature that depends on ownership or role.

## Key Files

- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/proxy.ts`
- `tests/e2e/helpers/auth.ts`

## Flows

- unauthenticated user hits `/dashboard*` or `/admin*`
- proxy redirects to `/auth/login?next=...`
- credentials or Google login completes
- JWT-backed viewer checks hydrate auth-aware UI

## Invariants

- Admin routes require `role === "ADMIN"`.
- Browser-smoke auth helpers must be deterministic in CI.
- Public routes should avoid unnecessary Prisma session reads.

## Known Risks

- UI login flows are more fragile than direct session establishment in CI.
- Session-derived UI can reintroduce request-bound rendering on public routes if handled carelessly.

## Related Pages

- [Browser Verification](../testing/browser-verification.md)
- [Dashboard Library](../routes/dashboard-library.md)
- [CI Browser Smoke](../operations/ci-browser-smoke.md)

## Sources

- [`AGENTS.md`](../../../AGENTS.md)
- [`krukraft-ai-contexts/04-architecture.md`](../../../krukraft-ai-contexts/04-architecture.md)
- [`tests/e2e/helpers/auth.ts`](../../../tests/e2e/helpers/auth.ts)

## Last Reviewed

- 2026-04-06
