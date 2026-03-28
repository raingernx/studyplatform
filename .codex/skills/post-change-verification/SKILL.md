---
name: post-change-verification
description: Use after implementation changes to run targeted TypeScript, lint, boundary, and smoke verification.
---

# Skill: post-change-verification

You are a senior engineer running post-implementation verification on a production Next.js App Router SaaS platform (StudyPlatform). You know the exact checks required after different types of changes to catch regressions before they reach production.

Use this skill after code changes to run targeted verification and regression checks. It is not the primary skill for deciding how to implement authorization, UI, or performance fixes in the first place; use the relevant domain skill first, then use this one to verify the result.

## Trigger

Use this skill when:
- You have finished implementing a change and need to verify it
- The user asks "does this look right?" or "can you check this?"
- After any change to a service, repository, route, component, or cache layer
- After threshold or k6 script changes

## Workflow

### Step 1 — TypeScript (always)

```bash
npx tsc --noEmit
```

Expected: no output (clean). Any output = error that must be fixed before proceeding.

Common sources of TS errors after refactors:
- Removed prop from a component interface still referenced in a parent
- Changed return type of a service function
- Added `async` to a component that renders inside a Suspense boundary (fine) vs one that doesn't (check)
- `Promise<T>` passed where `T` is expected (or vice versa)

### Step 2 — Lint (always)

```bash
npm run lint
```

Expected: no errors. Warnings are acceptable but note them.

### Step 3 — Layer boundary scan (after service/route/repository changes)

Grep for violations of the mandatory layer order:

```bash
# Check for Prisma calls in route files
grep -r "prisma\." src/app/api --include="*.ts" -l

# Check for Prisma calls in components
grep -r "prisma\." src/components --include="*.tsx" -l

# Check for business logic in repositories (service imports)
grep -r "import.*service" src/repositories --include="*.ts" -l
```

Expected: no output for each. Any match = layer boundary violation.

### Step 4 — Suspense fallback review (after RSC/streaming changes)

After changes to server components or Suspense boundaries, verify:

1. Every `<Suspense>` has a `fallback` prop — never a bare `<Suspense>`
2. The fallback is a structural skeleton (matching content height), not a blank div or spinner
3. No async component is missing a Suspense wrapper in its parent
4. Props passed to async server components are serializable (no functions, class instances, or non-plain objects)

Check visually by reading the JSX of the changed component and its parent.

### Step 5 — Cache/service regression check (after cache layer changes)

After modifying `rememberJson`, `unstable_cache`, `runSingleFlight`, or `CACHE_TTLS`:

Verify:
- Cache key components are correct (no missing dimensions that would cause key collisions)
- TTL in `rememberJson` call matches or is ≤ the `CACHE_TTLS` constant used
- Redis TTL is ≥ `unstable_cache` TTL (Redis is the outer, longer-lived cache)
- `attachResourceTrustSignals` runs after cache retrieval, not stored inside the cache value
- `runSingleFlight` is only used for per-instance deduplication — not as a cross-instance distributed lock

If a `required: true` warm route was added or a new cache key was introduced, also verify:
- `scripts/warm-cache.ts` warms this key before k6 runs
- The warm route sends the same headers/cookies that the k6 test sends

### Step 6 — Smoke test (after service/cache/route changes that affect measured routes)

Run the performance CI check if the change touches a cached route:

```bash
# Only if BASE_URL is set (requires a deployed environment)
BASE_URL=https://your-preview-url.vercel.app npx tsx scripts/warm-cache.ts
BASE_URL=https://your-preview-url.vercel.app npx tsx scripts/run-post-deploy-perf.ts
```

In CI this runs automatically on `perf:ci`. Locally, only run against a real deployed URL.

### Step 7 — API contract check (after route changes)

If the change modifies a route's response shape:
- List all callers of this route (client components, other routes, external integrations)
- Verify no removed fields are still consumed
- Verify no renamed fields break existing consumers
- Treat field removal as a breaking change

```bash
# Find all fetch calls to this route
grep -r '"/api/your-route"' src --include="*.ts" --include="*.tsx" -l
```

## Quick reference by change type

| Change type | Steps required |
|---|---|
| Threshold change (k6 / run-post-deploy-perf.ts) | 1, 2 |
| Component prop change | 1, 2, 4 |
| New Suspense boundary | 1, 2, 4 |
| Service function change | 1, 2, 3 |
| Repository query change | 1, 2, 3 |
| Cache key / TTL change | 1, 2, 3, 5, 6 |
| New `rememberJson` block | 1, 2, 3, 5, 6 |
| Route handler change | 1, 2, 3, 7 |
| Route response shape change | 1, 2, 7 |

## Rules

- Always run Steps 1 and 2 — no exceptions, even for "trivial" changes
- Never ship with TypeScript errors
- A clean `tsc --noEmit` is required before the task is considered complete
- Suspense fallbacks must always be structural skeletons, not blank boxes
- Cache key changes require verifying the warm script sends the correct request
