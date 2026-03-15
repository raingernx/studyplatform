# PaperDock – Analytics Architecture

This document describes the analytics system used by the PaperDock marketplace.

The analytics system powers:

- trending resources
- creator dashboards
- marketplace insights
- recommendation systems

---

# Analytics Pipeline

User interaction
↓
analytics event recorded
↓
event stored in analytics_events
↓
aggregation jobs run
↓
resource_stats updated
↓
discover service queries stats

---

# Analytics Tables

analytics_events

Stores raw events.

Fields:

id
eventType
userId
resourceId
creatorId
metadata
createdAt

Example event types:

resource_view
resource_download
resource_purchase

---

resource_stats

Stores aggregated resource statistics.

Fields:

resourceId
views
downloads
purchases
revenue
trendingScore
updatedAt

Used for:

- trending algorithm
- popular resources
- resource ranking

---

creator_stats

Stores creator performance data.

Fields:

creatorId
totalDownloads
totalSales
totalRevenue
updatedAt

Used in:

creator dashboards
creator leaderboards

---

# Trending Algorithm

Trending score is calculated using weighted signals.

Example formula:

trendingScore =
  views * 1
+ downloads * 4
+ purchases * 10

Recent activity may be weighted higher.

Example:

last 24h multiplier
last 7d multiplier

Trending jobs update resource_stats periodically.

---

# Event Recording

Analytics events are written through:

analytics.service.ts

Example event creation:

recordEvent({
  type: "resource_download",
  userId,
  resourceId
})

Events should be recorded for:

- resource views
- downloads
- purchases

---

# Aggregation Jobs

Aggregation jobs update resource statistics.

Location:

src/workers

Example workers:

analytics.worker.ts
trending.worker.ts

Responsibilities:

- aggregate events
- update resource_stats
- update creator_stats

---

# Dashboard Queries

Creator dashboard queries include:

total downloads
total revenue
top resources
recent sales

These queries read from aggregated tables instead of raw events.

---

# Caching Layer

Analytics-heavy queries should be cached.

Cache candidates:

trending resources
homepage discover data
top creators

Cache strategies:

Redis
in-memory cache
Next.js cache()

---

# Discover System

The discover service uses analytics data.

discover.service.ts

Responsibilities:

- trending resources
- newest resources
- recommended resources

Queries:

resource_stats
resource repository

---

# Analytics Design Principles

Rules:

- raw events must be append-only
- aggregated stats must be recalculable
- analytics queries must avoid full table scans
- heavy queries must use indexes