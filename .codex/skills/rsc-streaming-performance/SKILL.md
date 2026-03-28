---
name: rsc-streaming-performance
description: Use when diagnosing or fixing RSC rendering latency, Suspense waterfall issues, streaming structure, and cache-layer performance bottlenecks.
---

# Skill: rsc-streaming-performance

You are a senior performance engineer optimizing React Server Component streaming performance on a production Next.js App Router SaaS platform (StudyPlatform). You understand the difference between per-instance and cross-instance caching, Suspense boundary placement, and how to eliminate serial data waterfalls.

Use this skill for performance symptoms and optimization work. It is not the primary skill for general Next.js conventions, route-handler rules, or framework feature guidance; use `next-best-practices` for those general framework issues.

## Trigger

Use this skill when:
- A page feels slow to render or show content
- A k6 smoke test shows bimodal p95 latency (fast median, slow tail — typically cross-instance cold starts)
- A server component awaits multiple independent promises sequentially
- Adding a new cached data fetch to a service function
- Auditing a page component for waterfall fetches

## Workflow

### Phase 1 — Identify the bottleneck

Read the page component and its server component tree. Look for:

**Serial awaits (waterfall)**
```typescript
// BAD — sequential, each waits for the previous
const resource = await getResource(slug);
const ownership = await checkOwnership(userId, resource.id);
const trust = await getTrustSummary(resource.id);
```

**Monolithic async component (blocks first paint)**
```typescript
// BAD — nothing renders until all three promises resolve
async function PurchaseCard({ slug, userId }) {
  const ownership = await checkOwnership(userId, slug);
  const trust = await getTrustSummary(slug);
  const platform = await getPlatform();
  return <div>...</div>;
}
```

**Missing Redis layer (per-instance only)**
```typescript
// WARNING — unstable_cache is per-instance
// New Vercel lambda instances each incur one cold DB hit
const data = await unstable_cache(loadData, [key], { revalidate: 120 })();
```

**Bimodal p95 symptoms:** median ~100-200ms, p95 ~3-7s, max ~7-10s. This is almost always cold lambda instances hitting the DB because only `unstable_cache` (per-instance) exists without a Redis (`rememberJson`) layer.

### Phase 2 — Fix waterfalls

Replace sequential awaits with `Promise.all()` for independent fetches:

```typescript
// GOOD — parallel
const [ownership, trust] = await Promise.all([
  checkOwnership(userId, resourceId),
  getTrustSummary(resourceId),
]);
```

**Rule:** Fetches are independent if neither depends on the output of the other. `resourceId` from a prior `getResource` call is a dependency — that fetch must happen first. But `checkOwnership` and `getTrustSummary` both only need `resourceId` — they can be parallel.

### Phase 3 — Decompose monolithic async components

Split a slow async component into:
1. A **sync shell** that renders immediately (price, title, author, static metadata)
2. One or more **async subtree components** wrapped in `<Suspense>` for slow data

```typescript
// sync shell — renders on first chunk
export function PurchaseCard({ resource, ownershipPromise, trustSummaryPromise }) {
  return (
    <div>
      <p>{resource.title}</p>
      <PriceLabel price={resource.price} />
      <Suspense fallback={<PurchaseCardMiddleSkeleton />}>
        <PurchaseCardMiddle
          ownershipPromise={ownershipPromise}
          trustSummaryPromise={trustSummaryPromise}
        />
      </Suspense>
    </div>
  );
}

// async subtree — streams in when data resolves
async function PurchaseCardMiddle({ ownershipPromise, trustSummaryPromise }) {
  const [{ isOwned }, trust] = await Promise.all([ownershipPromise, trustSummaryPromise]);
  return <div>...</div>;
}
```

**Key pattern:** Pass `Promise<T>` (not `T`) as a prop from the page to the shell component. The shell passes it down to the async subtree. The page starts both promises in parallel without awaiting them.

### Phase 4 — Add Redis cross-instance cache for bimodal routes

If a service function only uses `unstable_cache` and shows bimodal p95 latency, add a `rememberJson` layer:

```typescript
// Pattern: wrap the DB query in rememberJson
const cacheKey = ["marketplace:newest", categoryId ?? "all", page].join(":");

const { items, count } = await rememberJson(
  cacheKey,
  CACHE_TTLS.publicPage,
  () => runSingleFlight(cacheKey, () =>
    Promise.all([
      findMarketplaceResourceCards({ where, orderBy, skip, take }),
      countMarketplaceResources(where),
    ]).then(([items, count]) => ({ items, count }))
  ),
  { metricName: "marketplace.newestResources", details: { page, categoryId } },
);
```

**Rules for cache keys:**
- Include all dimensions that affect the result: `category`, `sort`, `page`, `pageSize`, `tag`, `price filter`, `featured`
- Use consistent separators (`:`)
- Missing a dimension = stale data served to wrong audience = bug
- Do not include user-specific data in a shared cache key

**Rules for what to cache:**
- Cache the raw DB result (`items`, `count`) — not the result of `attachResourceTrustSignals`
- `attachResourceTrustSignals` runs fast (2 parallel queries) and is called after cache retrieval
- Caching post-signal data ties the cache to trust signal freshness requirements

### Phase 5 — Design structural skeletons

Suspense fallbacks must match the content they replace in height and layout:

```typescript
// GOOD — matches content structure
function PurchaseCardMiddleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-3/4 rounded bg-zinc-100 animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-zinc-100 animate-pulse" />
      <div className="h-10 w-full rounded bg-zinc-100 animate-pulse" />
    </div>
  );
}

// BAD — blank box causes layout shift and blank perceived state
function PurchaseCardSkeleton() {
  return <div className="h-[440px] rounded-[28px] bg-surface-100" />;
}
```

### Phase 6 — Verify

```bash
npx tsc --noEmit
npm run lint
```

Check:
- [ ] No serial awaits for independent data fetches
- [ ] Every slow async component is wrapped in `<Suspense fallback={<Skeleton />}>`
- [ ] Every `<Suspense>` has a structural skeleton fallback
- [ ] Props passed to async server components are serializable (Promises are fine; functions are not)
- [ ] New `rememberJson` cache key includes all result-affecting dimensions
- [ ] `attachResourceTrustSignals` runs after Redis retrieval, not inside the cached function
- [ ] Warm script hits the new cache key before k6 runs

## Cache selection guide

| Scenario | Solution |
|---|---|
| Shared across all lambda instances (marketplace listings) | `rememberJson` (Redis) |
| Per-user data | No shared cache — query DB per request |
| Static config (platform settings) | `unstable_cache` + `rememberJson` |
| Request deduplication (same request hits twice) | `runSingleFlight` (per-instance only) |
| Short-lived per-request cache | `React.cache()` |

## Key files

- `src/services/resource.service.ts` — `loadMarketplaceResources`, `rememberJson` patterns
- `src/lib/cache.ts` — `rememberJson`, `runSingleFlight`, `CACHE_TTLS`
- `src/components/resource/PurchaseCard.tsx` — Suspense decomposition example
- `src/app/resources/[slug]/page.tsx` — Promise-as-prop pattern
- `src/app/resources/page.tsx` — marketplace listing page
