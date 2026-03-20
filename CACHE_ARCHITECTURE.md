# KruCraft – Cache Architecture

This document describes the caching strategy used in KruCraft.

The purpose of caching is to reduce database load, improve page speed,
and ensure the marketplace can scale to large traffic volumes.

---

# Cache Goals

The caching layer should:

- reduce repeated database queries
- speed up marketplace pages
- protect the database from traffic spikes
- support trending and discover features
- cache expensive analytics queries

Caching is especially important for:

- library pages
- discover pages
- trending resources
- analytics dashboards

---

# Cache Layers

KruCraft uses multiple caching layers.

Client Request
↓
Next.js Server Cache
↓
Application Cache (memory / Redis)
↓
Database (PostgreSQL)

Each layer prevents unnecessary database access.

---

# Level 1 – Next.js Cache

Next.js provides built-in caching for server components.

Example:

import { cache } from “react”

const getResources = cache(async () => {
return prisma.resource.findMany()
})

This prevents duplicate calls within a request lifecycle.

Use cases:

- resource list queries
- homepage discover queries
- dashboard statistics

---

# Level 2 – Application Cache

Application-level caching lives in:

src/lib/cache.ts

Typical helper:

rememberJson(key, ttl, fn)

Example:

return rememberJson(
“trending_resources”,
300,
async () => fetchTrendingResources()
)

This stores the result for a defined TTL.

TTL example:

| Data Type | TTL |
|-----------|-----|
| Trending resources | 5 minutes |
| Discover page | 5 minutes |
| Resource list | 2 minutes |
| Dashboard metrics | 1 minute |

---

# Level 3 – Redis (Future)

For larger traffic volumes, Redis should be introduced.

Redis will provide:

- distributed caching
- cross-instance cache sharing
- persistent caching across deployments

Typical architecture:

App Server
↓
Redis Cache
↓
PostgreSQL

Redis will cache:

- trending resources
- homepage discover data
- popular resources
- creator leaderboard

---

# Cache Keys

Cache keys must be predictable.

Examples:

discover_home
trending_resources
resource_list_page_1
resource_list_page_2
creator_dashboard_{creatorId}

Rules:

- keys must be deterministic
- keys must include pagination parameters
- keys must include filters

Example:

resources_page_2_category_math

---

# Cache Invalidation

Cache must be cleared when important events occur.

Examples:

Resource created
↓
invalidate trending cache

Purchase completed
↓
invalidate trending cache

New analytics aggregation
↓
invalidate resource stats cache

Admin updates resource
↓
invalidate resource detail cache

---

# Cache Invalidation Methods

Typical invalidation methods:

cache.delete(key)
cache.clearPrefix(“resources”)

Example:

invalidate(“trending_resources”)

---

# Discover Page Caching

Discover page loads multiple datasets.

Example data:

- trending resources
- newest resources
- featured resources

Instead of multiple queries per request, cache the entire payload.

Example:

rememberJson(
“discover_page”,
300,
async () => buildDiscoverPayload()
)

---

# Trending Cache Strategy

Trending queries can be expensive.

Instead of calculating on every request:

Trending calculation
↓
store result in resource_stats
↓
cache top results

Example:

rememberJson(
“trending_resources”,
300,
async () => getTrendingResources()
)

Trending cache TTL:

5 minutes.

---

# Dashboard Cache Strategy

Creator dashboards can query multiple tables.

Cache dashboard metrics:

creator_dashboard_{creatorId}

TTL:

60 seconds.

This prevents repeated analytics queries.

---

# Database Protection

Caching prevents expensive queries from hitting the database.

Important rules:

- never run analytics queries on every request
- cache trending results
- cache discover payload
- cache resource lists

---

# Future Cache Improvements

Planned enhancements include:

- Redis distributed caching
- background cache warming
- scheduled trending recomputation
- edge caching via CDN

Example future pipeline:

User request
↓
Edge cache
↓
Redis cache
↓
Application cache
↓
Database

---

# Cache Design Principles

Cache must follow these rules:

- cached data must be recomputable
- cache keys must be deterministic
- cache TTL must be defined
- cache invalidation must be predictable

Never rely on cache as the only source of truth.

Database remains the authoritative source.