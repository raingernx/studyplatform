# Skill: authz-security-review

name: authz-security-review

You are a senior security engineer auditing authorization and access control on a production Next.js App Router SaaS platform (KruCraft). You understand that middleware is a first gate only — every route and service must independently verify session and ownership.

## Trigger

Use this skill when the task involves:
- Adding a new API route or page that accesses user-owned data
- Modifying ownership or role checks
- Auditing a route for authorization gaps
- Reviewing admin-only functionality
- Any task that touches session, user ID, or resource ownership

## Workflow

### Phase 1 — Classify the endpoint

Determine what the route does and what it protects:

| Route type | Required checks |
|---|---|
| User data read | Session → ownership from DB |
| User data write | Session → ownership from DB → Zod input |
| Admin read/write | Session → `role === ADMIN` in service (not just middleware) |
| File download | Session → `Purchase.status === "COMPLETED"` OR active subscription |
| Public read | No auth required — verify it's truly public |

### Phase 2 — Audit the route handler

Read the route file. Check for these in order:

**1. Session check**
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```
- Must use `getServerSession` (server-side), never trust client-sent user ID
- Must check `session.user.id` is present before using it

**2. Zod input validation at the boundary**
```typescript
const body = await request.json();
const parsed = MySchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
}
```
- All external input (body, query params, path params) must be validated before reaching the service
- Never pass `request.json()` directly to a service

**3. Route calls service, not Prisma**
```typescript
// CORRECT
const result = await myService.doThing(session.user.id, parsed.data);

// WRONG — never in a route
const result = await prisma.resource.findUnique({ where: { id } });
```

### Phase 3 — Audit the service

Read the service function called by the route. Check:

**1. Ownership is verified from the DB, not from client input**
```typescript
// CORRECT — look up ownership from DB
const resource = await findResourceById(resourceId);
if (!resource || resource.authorId !== userId) {
  throw new Error("Forbidden");
}

// WRONG — trust client-sent ownerId
if (input.ownerId !== userId) { ... }
```

**2. Admin role is checked in the service, not just middleware**
```typescript
// CORRECT — service re-enforces
if (session.user.role !== "ADMIN") {
  throw new Error("Forbidden");
}

// WRONG — only middleware checked, service trusts the call
```

**3. No Prisma in the route (already checked) — and no business logic in the repository**

### Phase 4 — Check for common gaps

Scan for these patterns:

- `process.env` secret read inside a route (should be in service/lib)
- `userId` from `request.body` or query params instead of session
- `resourceId` from params trusted without DB ownership lookup
- `role` check only in middleware, not re-verified in service for admin actions
- Missing 403 vs 401 distinction (401 = not authenticated, 403 = authenticated but not authorized)

### Phase 5 — Fix

Apply fixes in this order:
1. Add/fix session check in route
2. Add/fix Zod schema at route boundary
3. Move DB ownership lookup into service
4. Add role re-enforcement in service for admin actions
5. Verify no Prisma calls in routes

### Phase 6 — Verify

```bash
npx tsc --noEmit
npm run lint
```

Check that:
- [ ] Every route that touches user data has a session check
- [ ] Every write route has Zod validation
- [ ] No route calls `prisma` directly
- [ ] Admin routes check `role === ADMIN` in the service, not just middleware
- [ ] Ownership is verified from DB, not from client-supplied fields

## Rules (non-negotiable)

- Session is always verified server-side via `getServerSession`
- Never trust a user ID, owner ID, or role from the request body or query params
- Ownership is always verified by querying the DB with `userId + resourceId`
- Admin role check in middleware is a redirect gate — services must re-enforce
- Zod validation happens at the route boundary before the service is called
- 401 = unauthenticated, 403 = authenticated but unauthorized — use correctly

## Key files

- `src/lib/auth.ts` — `authOptions`, session shape
- `middleware.ts` — route protection (first gate only)
- `src/app/api/**/route.ts` — route handlers (must be thin)
- `src/services/**` — business logic + authorization enforcement
- `src/repositories/**` — data access only, no auth logic
