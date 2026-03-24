# Deploy Performance Measurement Runbook

## 1. Purpose
This runbook measures the real post-deploy impact of the current public performance layer using:

- `[PERF] cache_execute:*`
- warm elapsed and coverage logs
- cold vs warm TTFB
- `[PREFETCH]` logs
- warm cost vs benefit

Scope is limited to the current layer:

- `unstable_cache`
- tag invalidation
- full/targeted warm
- smart prefetch
- lightweight debug logs

## 2. Required Environment

```bash
PERFORMANCE_DEBUG_LOGS=1
NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS=1   # only when testing prefetch
WARM_BASE_URL=https://<deploy-url>
PERFORMANCE_WARM_SECRET=<secret>
```

Rules:

- Measure as anonymous user first.
- Do not mix anonymous and signed-in results.
- Measure inside the 120s TTL window.
- `/` is a redirect to `/resources`, not the real homepage render.

## 3. Routes to Measure

| Route | Why it matters |
|---|---|
| `/` | Redirect health only |
| `/resources` | Effective public homepage, discover-mode path |
| `/resources?sort=newest` | Explicit warmed listing variant |
| `/resources?sort=recommended` | Explicit warmed listing variant, often heaviest listing path |
| `/resources/<HOT_SLUG>` | Head detail route expected to benefit from warming |
| `/resources/<COLD_SLUG>` | Long-tail control, usually not warmed |
| `/creators/<HOT_CREATOR>` | Head creator route expected to benefit from warming |
| `/creators/<COLD_CREATOR>` | Optional long-tail creator control |

Selection rules:

- `HOT_*`: choose from discover output or warm response targets.
- `COLD_*`: choose long-tail entries unlikely to be warmed.

## 4. Copy-Paste Commands

### Setup

```bash
export BASE="https://<deploy-url>"
export HOT_SLUG="<hot-resource-slug>"
export COLD_SLUG="<cold-resource-slug>"
export HOT_CREATOR="<hot-creator-slug>"
export COLD_CREATOR="<cold-creator-slug>"

export WARM_BASE_URL="$BASE"
export PERFORMANCE_WARM_SECRET="<secret>"
```

### Helpers

```bash
measure_redirect() {
  curl -sS -o /dev/null \
    -w "$1 code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s redirect=%{redirect_url}\n" \
    "$2"
}

measure() {
  curl -sS -o /dev/null \
    -w "$1 code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
    "$2"
}

measure3() {
  for i in 1 2 3; do
    curl -sS -o /dev/null \
      -w "$1 run=$i code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
      "$2"
  done
}

median_ttfb() {
  for i in 1 2 3; do
    curl -sS -o /dev/null -w "%{time_starttransfer}\n" "$1"
  done | sort -n | sed -n '2p'
}
```

### Cold Baseline

Run once, before any warm call and before opening `/resources` in a browser:

```bash
measure_redirect "root" "$BASE/"
measure "resources" "$BASE/resources"
measure "newest" "$BASE/resources?sort=newest"
measure "recommended" "$BASE/resources?sort=recommended"
measure "detail_hot" "$BASE/resources/$HOT_SLUG"
measure "detail_cold" "$BASE/resources/$COLD_SLUG"
measure "creator_hot" "$BASE/creators/$HOT_CREATOR"
measure "creator_cold" "$BASE/creators/$COLD_CREATOR"
```

### Full Warm

Preferred:

```bash
npm run performance:warm
```

Direct endpoint alternative:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $PERFORMANCE_WARM_SECRET" \
  "$BASE/api/internal/performance/warm"
```

### Post-Warm Repeated Measurements

Run each 3 times and use the median TTFB:

```bash
measure3 "resources" "$BASE/resources"
measure3 "newest" "$BASE/resources?sort=newest"
measure3 "recommended" "$BASE/resources?sort=recommended"
measure3 "detail_hot" "$BASE/resources/$HOT_SLUG"
measure3 "detail_cold" "$BASE/resources/$COLD_SLUG"
measure3 "creator_hot" "$BASE/creators/$HOT_CREATOR"
measure3 "creator_cold" "$BASE/creators/$COLD_CREATOR"
```

Median helpers:

```bash
echo "resources median=$(median_ttfb "$BASE/resources")s"
echo "newest median=$(median_ttfb "$BASE/resources?sort=newest")s"
echo "recommended median=$(median_ttfb "$BASE/resources?sort=recommended")s"
echo "detail_hot median=$(median_ttfb "$BASE/resources/$HOT_SLUG")s"
echo "detail_cold median=$(median_ttfb "$BASE/resources/$COLD_SLUG")s"
echo "creator_hot median=$(median_ttfb "$BASE/creators/$HOT_CREATOR")s"
echo "creator_cold median=$(median_ttfb "$BASE/creators/$COLD_CREATOR")s"
```

### Log Filters

Cache miss proxy logs:

```bash
rg '$begin:math:display$PERF$end:math:display$ cache_execute:(getDiscoverData|getMarketplaceResources|getPublicResourcePageData|getCreatorPublicProfile)' deploy.log
```

Warm logs:

```bash
rg '$begin:math:display$PERF$end:math:display$ (public_cache_warm|internal_performance_warm_endpoint)' deploy.log
```

Full-warm summary and elapsed:

```bash
rg '$begin:math:display$PERF$end:math:display$ public_cache_warm:full|$begin:math:display$PERF$end:math:display$ public_cache_warm_full:(start|done|fail)|$begin:math:display$PERF$end:math:display$ internal_performance_warm_endpoint:(start|done|fail)' deploy.log
```

## 5. Manual Procedure

1. Deploy.
2. Enable `PERFORMANCE_DEBUG_LOGS=1`.
3. Enable `NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS=1` only if measuring prefetch.
4. Do not open `/resources` yet.
5. Run the cold baseline.
6. Confirm cold miss-proxy logs.
7. Run the full warm.
8. Confirm warm completed and coverage looks reasonable.
9. Re-run warmed routes 3 times.
10. Compute median TTFB.
11. Confirm no repeated identical `cache_execute:*` logs on warmed head routes inside TTL.
12. Open `/resources` anonymously and test prefetch.
13. Record results.
14. If signed-in measurement is needed, repeat separately.

## 6. Log Interpretation

| Log | What it means |
|---|---|
| `cache_execute:getDiscoverData` | Discover cache body executed; treat as miss/expiry proxy for `/resources` discover mode |
| `cache_execute:getMarketplaceResources` | Listing cache body executed; use with query shape to inspect warmed variants |
| `cache_execute:getPublicResourcePageData` | Resource detail cache body executed; best miss proxy for detail pages |
| `cache_execute:getCreatorPublicProfile` | Creator profile cache body executed; best miss proxy for creator pages |
| `public_cache_warm_full:start` | Full warm started |
| `public_cache_warm_full:done` | Full warm completed; use `elapsedMs` as warm cost |
| `public_cache_warm:full` | Full warm coverage summary; use counts for discover, hero, marketplace variants, resource details, trust summaries, creator profiles |
| `internal_performance_warm_endpoint:*` | Endpoint wrapper timing around the warm call |
| `[PREFETCH] prefetch` | A client prefetch actually fired |
| `[PREFETCH] skip_scope_limit` | Scope cap prevented another prefetch |
| `[PREFETCH] skip_global_dedupe` | Href already prefetched in that scope |
| `[PREFETCH] skip_local_dedupe` | Same link instance tried to prefetch again |

Limits:

- There is no dedicated `cache_execute:*` for hero.
- There is no direct prefetch-to-click attribution.

## 7. Thresholds

### Redirect Health (`/`)

- Good: `< 100ms`
- Watch: `100ms to 200ms`
- Bad: `> 200ms`

### `/resources` Warm ROI

- Good: `>= 20%` faster or `>= 100ms` saved
- Watch: `10% to 20%` faster or `50ms to 100ms` saved
- Bad: below that

### Detail Page Warm ROI (`HOT_SLUG`)

- Good: `>= 25%` faster or `>= 150ms` saved
- Watch: `10% to 25%` faster or `75ms to 150ms` saved
- Bad: below that

### Creator Profile Warm ROI (`HOT_CREATOR`)

- Good: `>= 20%` faster or `>= 100ms` saved
- Watch: `10% to 20%` faster or `50ms to 100ms` saved
- Bad: below that

### Full Warm Cost

- Good: `< 1s`
- Watch: `1s to 2s`
- Bad: `> 2s`

### Cache Stability on Warmed Head Routes

- Good: no repeated identical misses on warmed head routes inside TTL
- Watch: one-off miss near TTL boundary or for a non-warmed variant
- Bad: repeated identical misses well inside TTL after warm

### Prefetch Waste Ratio

Formula:
`resource-card-grid prefetch count / actual detail navigations`

- Good: `<= 2:1`
- Watch: `> 2:1 to <= 4:1`
- Bad: `> 4:1`

### Scope-Limit Overfiring

- Good: none or rare
- Watch: occasional
- Bad: frequent before first click or in normal browsing

## 8. Measurement Sheet Template

```markdown
# Deploy Performance Check

- Deploy:
- Date:
- Environment:
- Anonymous or Signed-in:
- BASE:
- HOT_SLUG:
- COLD_SLUG:
- HOT_CREATOR:
- COLD_CREATOR:
- PERFORMANCE_DEBUG_LOGS:
- NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS:

### Warm

- full warm status:
- full warm elapsedMs:
- discover warmed:
- hero warmed:
- marketplace variants warmed:
- resource details warmed:
- trust summaries warmed:
- creator profiles warmed:
- warmed resource slugs:
- warmed creator identifiers:

### Results

| Route | Cold | Warm 1 | Warm 2 | Warm 3 | Warm Median | ROI | Repeated miss after warm? | Notes |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `/` |  |  |  |  |  |  | n/a | redirect only |
| `/resources` |  |  |  |  |  |  |  |  |
| `/resources?sort=newest` |  |  |  |  |  |  |  |  |
| `/resources?sort=recommended` |  |  |  |  |  |  |  |  |
| `/resources/<HOT_SLUG>` |  |  |  |  |  |  |  |  |
| `/resources/<COLD_SLUG>` |  |  |  |  |  |  |  |  |
| `/creators/<HOT_CREATOR>` |  |  |  |  |  |  |  |  |
| `/creators/<COLD_CREATOR>` |  |  |  |  |  |  |  |  |

### Log Checks

- cold `getDiscoverData` observed:
- cold `getMarketplaceResources` observed:
- cold `getPublicResourcePageData` observed:
- cold `getCreatorPublicProfile` observed:
- repeated identical cache_execute after warm:
- warm log anomalies:

### Prefetch

- scope tested: resource-card-grid
- test duration:
- prefetch count:
- skip_scope_limit count:
- skip_global_dedupe count:
- skip_local_dedupe count:
- actual navigations:
- prefetch:navigation ratio:
- prefetch verdict:

### Summary

- redirect verdict:
- discover verdict:
- newest verdict:
- recommended verdict:
- detail hot verdict:
- creator hot verdict:
- warm cost verdict:
- cache stability verdict:
- prefetch verdict:
- overall pass/fail:
- notes:
```

## 9. Decision Framework

- High warm cost + low ROI: shrink or retarget the warm set.
- High resource-grid prefetch waste: tighten gating.
- Cache misses disappear but TTFB stays high: measure reviews, hero, and categories next.
- Only long-tail remains slow: keep the head-focused strategy.
- Warmed listing variants still miss often: inspect cache-key cardinality and request-shape normalization.
- Only `sort=recommended` remains slow: isolate the recommendation/ranking listing path.
- Creator pages do not improve but resource detail does: only prioritize creator warm coverage if justified by traffic.

## 10. Ranked Next-Step Optimization Output Format

# Ranked Performance Follow-Ups

## 1. Measurement Findings

- Deploy:
- Environment:
- Anonymous summary:
- Signed-in summary:
- Full warm elapsedMs:
- Biggest warm ROI win:
- Biggest persistent miss:
- Prefetch waste ratio:
- Repeated miss pattern:

## 2. Ranked Top 3 Next Optimizations

### Rank 1

- Bottleneck:
- Evidence:
- Likely root cause:
- Safest optimization:
- Expected impact:
- Risk level:
- Why now:
- Why not now:

### Rank 2

- Bottleneck:
- Evidence:
- Likely root cause:
- Safest optimization:
- Expected impact:
- Risk level:
- Why now:
- Why not now:

### Rank 3

- Bottleneck:
- Evidence:
- Likely root cause:
- Safest optimization:
- Expected impact:
- Risk level:
- Why now:
- Why not now:

## 3. Not Recommended Yet

- Optimization:
- Why it is not justified by current measurements:

## 4. Decision

- Ship now:
- Measure again after:
- Owner:
- Target deploy:
