#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    printf 'Error: required env var %s is not set.\n' "$name" >&2
    exit 1
  fi
}

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

measure_with_cookie() {
  curl -sS -o /dev/null \
    -b "$3" \
    -w "$1 code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
    "$2"
}

measure3() {
  local label="$1"
  local url="$2"

  for i in 1 2 3; do
    curl -sS -o /dev/null \
      -w "$label run=$i code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
      "$url"
  done
}

measure3_with_cookie() {
  local label="$1"
  local url="$2"
  local cookie="$3"

  for i in 1 2 3; do
    curl -sS -o /dev/null \
      -b "$cookie" \
      -w "$label run=$i code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
      "$url"
  done
}

extract_ttfb() {
  printf '%s\n' "$1" | sed -n 's/.*ttfb=\([0-9.]*\)s.*/\1/p'
}

measure3_capture() {
  local label="$1"
  local url="$2"

  for i in 1 2 3; do
    curl -sS -o /dev/null \
      -w "$label run=$i code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
      "$url"
  done
}

measure3_capture_with_cookie() {
  local label="$1"
  local url="$2"
  local cookie="$3"

  for i in 1 2 3; do
    curl -sS -o /dev/null \
      -b "$cookie" \
      -w "$label run=$i code=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s\n" \
      "$url"
  done
}

median_ttfb() {
  printf '%s\n' "$@" | sort -n | sed -n '2p'
}

to_ms() {
  awk -v seconds="$1" 'BEGIN { printf "%.0f", seconds * 1000 }'
}

roi_percent() {
  awk -v cold="$1" -v warm="$2" '
    BEGIN {
      if (cold <= 0) {
        print "n/a"
      } else {
        printf "%.1f%%", ((cold - warm) / cold) * 100
      }
    }
  '
}

print_section() {
  printf '\n== %s ==\n' "$1"
}

extract_json_number() {
  local key="$1"
  local json="$2"

  printf '%s\n' "$json" | sed -n "s/.*\"$key\":\([0-9][0-9]*\).*/\1/p"
}

extract_json_array() {
  local key="$1"
  local json="$2"

  printf '%s\n' "$json" \
    | sed -n "s/.*\"$key\":\[\([^]]*\)\].*/\1/p" \
    | sed 's/","/, /g; s/"//g'
}

resolve_output_file() {
  if [ -n "${OUTPUT_FILE:-}" ]; then
    printf '%s\n' "$OUTPUT_FILE"
    return
  fi

  if [ "${WRITE_MARKDOWN:-0}" = "1" ]; then
    printf 'docs/performance-measurements/%s.md\n' "$(date -u +%Y%m%d-%H%M%S)"
  fi
}

write_markdown_report() {
  local path="$1"
  local dir
  dir="$(dirname "$path")"

  mkdir -p "$dir" || {
    printf 'Error: unable to create output directory %s\n' "$dir" >&2
    exit 1
  }

  cat > "$path" <<EOF
# Deploy Performance Check

- Deploy: ${DEPLOY:-}
- Date: ${MEASUREMENT_DATE}
- Environment: ${ENVIRONMENT:-}
- Anonymous or Signed-in: ${MEASUREMENT_CONTEXT:-Anonymous}
- BASE: ${BASE}
- HOT_SLUG: ${HOT_SLUG}
- COLD_SLUG: ${COLD_SLUG}
- HOT_CREATOR: ${HOT_CREATOR}
- COLD_CREATOR: ${COLD_CREATOR}
- PERFORMANCE_DEBUG_LOGS: ${PERFORMANCE_DEBUG_LOGS:-}
- NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS: ${NEXT_PUBLIC_PERFORMANCE_DEBUG_LOGS:-}
- Ranking experiment cookie: ${RANKING_EXPERIMENT_COOKIE_NAME} (${RANKING_CONTROL_VARIANT}=control/newest, ${RANKING_RECOMMENDED_VARIANT}=recommended)

### Warm

- full warm status: completed; inspect logs for endpoint status and elapsedMs
- full warm elapsedMs: manual log check required from \`[PERF] public_cache_warm_full:done\`
- discover warmed: ${WARM_DISCOVER_COUNT:-}
- hero warmed: ${WARM_HERO_COUNT:-}
- marketplace variants warmed: ${WARM_MARKETPLACE_VARIANTS_COUNT:-} ${WARM_MARKETPLACE_VARIANT_NAMES:+(${WARM_MARKETPLACE_VARIANT_NAMES})}
- resource details warmed: ${WARM_RESOURCE_DETAILS_COUNT:-}
- trust summaries warmed: ${WARM_TRUST_SUMMARIES_COUNT:-}
- creator profiles warmed: ${WARM_CREATOR_PROFILES_COUNT:-}
- warmed resource slugs: ${WARM_RESOURCE_SLUGS:-manual log check required}
- warmed creator identifiers: ${WARM_CREATOR_IDENTIFIERS:-manual log check required}

### Results

| Route | Cold | Warm 1 | Warm 2 | Warm 3 | Warm Median | ROI | Repeated miss after warm? | Notes |
|---|---:|---:|---:|---:|---:|---:|---|---|
| \`/\` | ${COLD_ROOT_TTFB}s |  |  |  |  |  | n/a | redirect only |
| \`/resources\` | ${COLD_RESOURCES_TTFB}s | ${warm_resources_ttfb_1}s | ${warm_resources_ttfb_2}s | ${warm_resources_ttfb_3}s | ${WARM_RESOURCES_MEDIAN}s | ${ROI_RESOURCES} | manual log check required | discover mode |
| \`/resources?sort=newest\` | ${COLD_NEWEST_TTFB}s | ${warm_newest_ttfb_1}s | ${warm_newest_ttfb_2}s | ${warm_newest_ttfb_3}s | ${WARM_NEWEST_MEDIAN}s | ${ROI_NEWEST} | manual log check required | still discover mode without category |
| \`/resources?sort=recommended\` | ${COLD_RECOMMENDED_TTFB}s | ${warm_recommended_ttfb_1}s | ${warm_recommended_ttfb_2}s | ${warm_recommended_ttfb_3}s | ${WARM_RECOMMENDED_MEDIAN}s | ${ROI_RECOMMENDED} | manual log check required | still discover mode without category |
| \`/resources?category=all&sort=newest\` + \`${RANKING_EXPERIMENT_COOKIE_NAME}=${RANKING_CONTROL_VARIANT}\` | ${COLD_LISTING_CONTROL_A_TTFB}s | ${warm_listing_control_a_ttfb_1}s | ${warm_listing_control_a_ttfb_2}s | ${warm_listing_control_a_ttfb_3}s | ${WARM_LISTING_CONTROL_A_MEDIAN}s | ${ROI_LISTING_CONTROL_A} | manual log check required | listing mode; effective newest via control cookie |
| \`/resources?category=all&sort=recommended\` + \`${RANKING_EXPERIMENT_COOKIE_NAME}=${RANKING_RECOMMENDED_VARIANT}\` | ${COLD_LISTING_RECOMMENDED_B_TTFB}s | ${warm_listing_recommended_b_ttfb_1}s | ${warm_listing_recommended_b_ttfb_2}s | ${warm_listing_recommended_b_ttfb_3}s | ${WARM_LISTING_RECOMMENDED_B_MEDIAN}s | ${ROI_LISTING_RECOMMENDED_B} | manual log check required | listing mode; effective recommended via treatment cookie |
| \`/resources?category=all\` | ${COLD_LISTING_DEFAULT_TTFB}s | ${warm_listing_default_ttfb_1}s | ${warm_listing_default_ttfb_2}s | ${warm_listing_default_ttfb_3}s | ${WARM_LISTING_DEFAULT_MEDIAN}s | ${ROI_LISTING_DEFAULT} | manual log check required | listing mode; query-shape check, may share effective newest path |
| \`/resources?category=all&sort=newest\` | ${COLD_LISTING_NEWEST_TTFB}s | ${warm_listing_newest_ttfb_1}s | ${warm_listing_newest_ttfb_2}s | ${warm_listing_newest_ttfb_3}s | ${WARM_LISTING_NEWEST_MEDIAN}s | ${ROI_LISTING_NEWEST} | manual log check required | listing mode; query-shape check, may share effective newest path |
| \`/resources?category=all&sort=recommended\` | ${COLD_LISTING_RECOMMENDED_TTFB}s | ${warm_listing_recommended_ttfb_1}s | ${warm_listing_recommended_ttfb_2}s | ${warm_listing_recommended_ttfb_3}s | ${WARM_LISTING_RECOMMENDED_MEDIAN}s | ${ROI_LISTING_RECOMMENDED} | manual log check required | listing mode; query-shape check, cookie-less requests fall back to newest |
| \`/resources/<HOT_SLUG>\` | ${COLD_DETAIL_HOT_TTFB}s | ${warm_detail_hot_ttfb_1}s | ${warm_detail_hot_ttfb_2}s | ${warm_detail_hot_ttfb_3}s | ${WARM_DETAIL_HOT_MEDIAN}s | ${ROI_DETAIL_HOT} | manual log check required |  |
| \`/resources/<COLD_SLUG>\` | ${COLD_DETAIL_COLD_TTFB}s | ${warm_detail_cold_ttfb_1}s | ${warm_detail_cold_ttfb_2}s | ${warm_detail_cold_ttfb_3}s | ${WARM_DETAIL_COLD_MEDIAN}s | ${ROI_DETAIL_COLD} | manual log check required | long-tail control |
| \`/creators/<HOT_CREATOR>\` | ${COLD_CREATOR_HOT_TTFB}s | ${warm_creator_hot_ttfb_1}s | ${warm_creator_hot_ttfb_2}s | ${warm_creator_hot_ttfb_3}s | ${WARM_CREATOR_HOT_MEDIAN}s | ${ROI_CREATOR_HOT} | manual log check required |  |
| \`/creators/<COLD_CREATOR>\` | ${COLD_CREATOR_COLD_TTFB}s | ${warm_creator_cold_ttfb_1}s | ${warm_creator_cold_ttfb_2}s | ${warm_creator_cold_ttfb_3}s | ${WARM_CREATOR_COLD_MEDIAN}s | ${ROI_CREATOR_COLD} | manual log check required | optional |

### Quick ROI Summary

- resources: cold=${COLD_RESOURCES_TTFB}s warm=${WARM_RESOURCES_MEDIAN}s saved=${ROI_RESOURCES_MS}ms roi=${ROI_RESOURCES}
- newest: cold=${COLD_NEWEST_TTFB}s warm=${WARM_NEWEST_MEDIAN}s saved=${ROI_NEWEST_MS}ms roi=${ROI_NEWEST}
- recommended: cold=${COLD_RECOMMENDED_TTFB}s warm=${WARM_RECOMMENDED_MEDIAN}s saved=${ROI_RECOMMENDED_MS}ms roi=${ROI_RECOMMENDED}
- listing_default: cold=${COLD_LISTING_DEFAULT_TTFB}s warm=${WARM_LISTING_DEFAULT_MEDIAN}s saved=${ROI_LISTING_DEFAULT_MS}ms roi=${ROI_LISTING_DEFAULT}
- listing_newest: cold=${COLD_LISTING_NEWEST_TTFB}s warm=${WARM_LISTING_NEWEST_MEDIAN}s saved=${ROI_LISTING_NEWEST_MS}ms roi=${ROI_LISTING_NEWEST}
- listing_recommended: cold=${COLD_LISTING_RECOMMENDED_TTFB}s warm=${WARM_LISTING_RECOMMENDED_MEDIAN}s saved=${ROI_LISTING_RECOMMENDED_MS}ms roi=${ROI_LISTING_RECOMMENDED}
- listing_control_variant_${RANKING_CONTROL_VARIANT}: cold=${COLD_LISTING_CONTROL_A_TTFB}s warm=${WARM_LISTING_CONTROL_A_MEDIAN}s saved=${ROI_LISTING_CONTROL_A_MS}ms roi=${ROI_LISTING_CONTROL_A}
- listing_recommended_variant_${RANKING_RECOMMENDED_VARIANT}: cold=${COLD_LISTING_RECOMMENDED_B_TTFB}s warm=${WARM_LISTING_RECOMMENDED_B_MEDIAN}s saved=${ROI_LISTING_RECOMMENDED_B_MS}ms roi=${ROI_LISTING_RECOMMENDED_B}
- detail_hot: cold=${COLD_DETAIL_HOT_TTFB}s warm=${WARM_DETAIL_HOT_MEDIAN}s saved=${ROI_DETAIL_HOT_MS}ms roi=${ROI_DETAIL_HOT}
- detail_cold: cold=${COLD_DETAIL_COLD_TTFB}s warm=${WARM_DETAIL_COLD_MEDIAN}s saved=${ROI_DETAIL_COLD_MS}ms roi=${ROI_DETAIL_COLD}
- creator_hot: cold=${COLD_CREATOR_HOT_TTFB}s warm=${WARM_CREATOR_HOT_MEDIAN}s saved=${ROI_CREATOR_HOT_MS}ms roi=${ROI_CREATOR_HOT}
- creator_cold: cold=${COLD_CREATOR_COLD_TTFB}s warm=${WARM_CREATOR_COLD_MEDIAN}s saved=${ROI_CREATOR_COLD_MS}ms roi=${ROI_CREATOR_COLD}

### Log Checks

- cold \`getDiscoverData\` observed: manual log check required
- cold \`getMarketplaceResources\` observed: manual log check required
- cold \`getPublicResourcePageData\` observed: manual log check required
- cold \`getCreatorPublicProfile\` observed: manual log check required
- repeated identical cache_execute after warm: manual log check required
- warm log anomalies: manual log check required

### Prefetch

- scope tested: resource-card-grid
- test duration: manual browser check required
- prefetch count: manual browser check required
- skip_scope_limit count: manual browser check required
- skip_global_dedupe count: manual browser check required
- skip_local_dedupe count: manual browser check required
- actual navigations: manual browser check required
- prefetch:navigation ratio: manual browser check required
- prefetch verdict: manual browser check required

### Warm Response

\`\`\`json
${WARM_RESPONSE}
\`\`\`

### Summary

- redirect verdict: manual interpretation against runbook thresholds
- discover verdict: manual interpretation against runbook thresholds
- newest verdict: manual interpretation against runbook thresholds
- recommended verdict: manual interpretation against runbook thresholds
- listing default verdict: manual interpretation against runbook thresholds
- listing newest verdict: manual interpretation against runbook thresholds
- listing recommended verdict: manual interpretation against runbook thresholds
- listing control (${RANKING_CONTROL_VARIANT}) verdict: manual interpretation against runbook thresholds
- listing recommended (${RANKING_RECOMMENDED_VARIANT}) verdict: manual interpretation against runbook thresholds
- detail hot verdict: manual interpretation against runbook thresholds
- creator hot verdict: manual interpretation against runbook thresholds
- warm cost verdict: manual log check required
- cache stability verdict: manual log check required
- prefetch verdict: manual browser check required
- overall pass/fail:
- notes:
EOF
}

require_env "BASE"
require_env "HOT_SLUG"
require_env "COLD_SLUG"
require_env "HOT_CREATOR"
require_env "COLD_CREATOR"

WARM_BASE_URL="${WARM_BASE_URL:-$BASE}"
require_env "PERFORMANCE_WARM_SECRET"
RANKING_EXPERIMENT_COOKIE_NAME="${RANKING_EXPERIMENT_COOKIE_NAME:-ranking_variant}"
RANKING_CONTROL_VARIANT="${RANKING_CONTROL_VARIANT:-A}"
RANKING_RECOMMENDED_VARIANT="${RANKING_RECOMMENDED_VARIANT:-B}"
RANKING_CONTROL_COOKIE="${RANKING_EXPERIMENT_COOKIE_NAME}=${RANKING_CONTROL_VARIANT}"
RANKING_RECOMMENDED_COOKIE="${RANKING_EXPERIMENT_COOKIE_NAME}=${RANKING_RECOMMENDED_VARIANT}"

ROOT_URL="$BASE/"
RESOURCES_URL="$BASE/resources"
NEWEST_URL="$BASE/resources?sort=newest"
RECOMMENDED_URL="$BASE/resources?sort=recommended"
LISTING_DEFAULT_URL="$BASE/resources?category=all"
LISTING_NEWEST_URL="$BASE/resources?category=all&sort=newest"
LISTING_RECOMMENDED_URL="$BASE/resources?category=all&sort=recommended"
DETAIL_HOT_URL="$BASE/resources/$HOT_SLUG"
DETAIL_COLD_URL="$BASE/resources/$COLD_SLUG"
CREATOR_HOT_URL="$BASE/creators/$HOT_CREATOR"
CREATOR_COLD_URL="$BASE/creators/$COLD_CREATOR"
WARM_URL="$WARM_BASE_URL/api/internal/performance/warm"
MEASUREMENT_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
MARKDOWN_OUTPUT_FILE="$(resolve_output_file)"

print_section "Cold baseline"
printf 'Ranking experiment listing checks use explicit cookies: %s and %s\n' \
  "$RANKING_CONTROL_COOKIE" \
  "$RANKING_RECOMMENDED_COOKIE"
cold_root_line="$(measure_redirect "root" "$ROOT_URL")"
cold_resources_line="$(measure "resources" "$RESOURCES_URL")"
cold_newest_line="$(measure "newest" "$NEWEST_URL")"
cold_recommended_line="$(measure "recommended" "$RECOMMENDED_URL")"
cold_listing_control_a_line="$(measure_with_cookie "listing_control_a" "$LISTING_NEWEST_URL" "$RANKING_CONTROL_COOKIE")"
cold_listing_recommended_b_line="$(measure_with_cookie "listing_recommended_b" "$LISTING_RECOMMENDED_URL" "$RANKING_RECOMMENDED_COOKIE")"
cold_listing_default_line="$(measure "listing_default" "$LISTING_DEFAULT_URL")"
cold_listing_newest_line="$(measure "listing_newest" "$LISTING_NEWEST_URL")"
cold_listing_recommended_line="$(measure "listing_recommended" "$LISTING_RECOMMENDED_URL")"
cold_detail_hot_line="$(measure "detail_hot" "$DETAIL_HOT_URL")"
cold_detail_cold_line="$(measure "detail_cold" "$DETAIL_COLD_URL")"
cold_creator_hot_line="$(measure "creator_hot" "$CREATOR_HOT_URL")"
cold_creator_cold_line="$(measure "creator_cold" "$CREATOR_COLD_URL")"

printf '%s\n' "$cold_root_line"
printf '%s\n' "$cold_resources_line"
printf '%s\n' "$cold_newest_line"
printf '%s\n' "$cold_recommended_line"
printf '%s\n' "$cold_listing_control_a_line"
printf '%s\n' "$cold_listing_recommended_b_line"
printf '%s\n' "$cold_listing_default_line"
printf '%s\n' "$cold_listing_newest_line"
printf '%s\n' "$cold_listing_recommended_line"
printf '%s\n' "$cold_detail_hot_line"
printf '%s\n' "$cold_detail_cold_line"
printf '%s\n' "$cold_creator_hot_line"
printf '%s\n' "$cold_creator_cold_line"

COLD_ROOT_TTFB="$(extract_ttfb "$cold_root_line")"
COLD_RESOURCES_TTFB="$(extract_ttfb "$cold_resources_line")"
COLD_NEWEST_TTFB="$(extract_ttfb "$cold_newest_line")"
COLD_RECOMMENDED_TTFB="$(extract_ttfb "$cold_recommended_line")"
COLD_LISTING_DEFAULT_TTFB="$(extract_ttfb "$cold_listing_default_line")"
COLD_LISTING_NEWEST_TTFB="$(extract_ttfb "$cold_listing_newest_line")"
COLD_LISTING_RECOMMENDED_TTFB="$(extract_ttfb "$cold_listing_recommended_line")"
COLD_LISTING_CONTROL_A_TTFB="$(extract_ttfb "$cold_listing_control_a_line")"
COLD_LISTING_RECOMMENDED_B_TTFB="$(extract_ttfb "$cold_listing_recommended_b_line")"
COLD_DETAIL_HOT_TTFB="$(extract_ttfb "$cold_detail_hot_line")"
COLD_DETAIL_COLD_TTFB="$(extract_ttfb "$cold_detail_cold_line")"
COLD_CREATOR_HOT_TTFB="$(extract_ttfb "$cold_creator_hot_line")"
COLD_CREATOR_COLD_TTFB="$(extract_ttfb "$cold_creator_cold_line")"

print_section "Warm trigger"
printf 'POST %s\n' "$WARM_URL"
WARM_RESPONSE="$(curl -sS -X POST \
  -H "Authorization: Bearer $PERFORMANCE_WARM_SECRET" \
  "$WARM_URL")"
printf '%s\n' "$WARM_RESPONSE"
WARM_RESPONSE_COMPACT="$(printf '%s' "$WARM_RESPONSE" | tr -d '\n')"
WARM_DISCOVER_COUNT="$(extract_json_number "discover" "$WARM_RESPONSE_COMPACT")"
WARM_HERO_COUNT="$(extract_json_number "hero" "$WARM_RESPONSE_COMPACT")"
WARM_MARKETPLACE_VARIANTS_COUNT="$(extract_json_number "marketplaceVariants" "$WARM_RESPONSE_COMPACT")"
WARM_RESOURCE_DETAILS_COUNT="$(extract_json_number "resourceDetails" "$WARM_RESPONSE_COMPACT")"
WARM_TRUST_SUMMARIES_COUNT="$(extract_json_number "trustSummaries" "$WARM_RESPONSE_COMPACT")"
WARM_CREATOR_PROFILES_COUNT="$(extract_json_number "creatorProfiles" "$WARM_RESPONSE_COMPACT")"
WARM_RESOURCE_SLUGS="$(extract_json_array "resourceSlugs" "$WARM_RESPONSE_COMPACT")"
WARM_CREATOR_IDENTIFIERS="$(extract_json_array "creatorIdentifiers" "$WARM_RESPONSE_COMPACT")"
WARM_MARKETPLACE_VARIANT_NAMES="$(extract_json_array "marketplaceVariants" "$WARM_RESPONSE_COMPACT")"

print_section "Post-warm repeated measurements"
warm_resources_runs="$(measure3_capture "resources" "$RESOURCES_URL")"
warm_newest_runs="$(measure3_capture "newest" "$NEWEST_URL")"
warm_recommended_runs="$(measure3_capture "recommended" "$RECOMMENDED_URL")"
warm_listing_control_a_runs="$(measure3_capture_with_cookie "listing_control_a" "$LISTING_NEWEST_URL" "$RANKING_CONTROL_COOKIE")"
warm_listing_recommended_b_runs="$(measure3_capture_with_cookie "listing_recommended_b" "$LISTING_RECOMMENDED_URL" "$RANKING_RECOMMENDED_COOKIE")"
warm_listing_default_runs="$(measure3_capture "listing_default" "$LISTING_DEFAULT_URL")"
warm_listing_newest_runs="$(measure3_capture "listing_newest" "$LISTING_NEWEST_URL")"
warm_listing_recommended_runs="$(measure3_capture "listing_recommended" "$LISTING_RECOMMENDED_URL")"
warm_detail_hot_runs="$(measure3_capture "detail_hot" "$DETAIL_HOT_URL")"
warm_detail_cold_runs="$(measure3_capture "detail_cold" "$DETAIL_COLD_URL")"
warm_creator_hot_runs="$(measure3_capture "creator_hot" "$CREATOR_HOT_URL")"
warm_creator_cold_runs="$(measure3_capture "creator_cold" "$CREATOR_COLD_URL")"

printf '%s\n' "$warm_resources_runs"
printf '%s\n' "$warm_newest_runs"
printf '%s\n' "$warm_recommended_runs"
printf '%s\n' "$warm_listing_control_a_runs"
printf '%s\n' "$warm_listing_recommended_b_runs"
printf '%s\n' "$warm_listing_default_runs"
printf '%s\n' "$warm_listing_newest_runs"
printf '%s\n' "$warm_listing_recommended_runs"
printf '%s\n' "$warm_detail_hot_runs"
printf '%s\n' "$warm_detail_cold_runs"
printf '%s\n' "$warm_creator_hot_runs"
printf '%s\n' "$warm_creator_cold_runs"

warm_resources_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_resources_runs" | sed -n '1p')")"
warm_resources_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_resources_runs" | sed -n '2p')")"
warm_resources_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_resources_runs" | sed -n '3p')")"
warm_newest_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_newest_runs" | sed -n '1p')")"
warm_newest_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_newest_runs" | sed -n '2p')")"
warm_newest_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_newest_runs" | sed -n '3p')")"
warm_recommended_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_recommended_runs" | sed -n '1p')")"
warm_recommended_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_recommended_runs" | sed -n '2p')")"
warm_recommended_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_recommended_runs" | sed -n '3p')")"
warm_listing_default_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_listing_default_runs" | sed -n '1p')")"
warm_listing_default_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_listing_default_runs" | sed -n '2p')")"
warm_listing_default_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_listing_default_runs" | sed -n '3p')")"
warm_listing_newest_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_listing_newest_runs" | sed -n '1p')")"
warm_listing_newest_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_listing_newest_runs" | sed -n '2p')")"
warm_listing_newest_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_listing_newest_runs" | sed -n '3p')")"
warm_listing_recommended_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_runs" | sed -n '1p')")"
warm_listing_recommended_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_runs" | sed -n '2p')")"
warm_listing_recommended_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_runs" | sed -n '3p')")"
warm_listing_control_a_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_listing_control_a_runs" | sed -n '1p')")"
warm_listing_control_a_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_listing_control_a_runs" | sed -n '2p')")"
warm_listing_control_a_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_listing_control_a_runs" | sed -n '3p')")"
warm_listing_recommended_b_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_b_runs" | sed -n '1p')")"
warm_listing_recommended_b_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_b_runs" | sed -n '2p')")"
warm_listing_recommended_b_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_listing_recommended_b_runs" | sed -n '3p')")"
warm_detail_hot_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_detail_hot_runs" | sed -n '1p')")"
warm_detail_hot_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_detail_hot_runs" | sed -n '2p')")"
warm_detail_hot_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_detail_hot_runs" | sed -n '3p')")"
warm_detail_cold_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_detail_cold_runs" | sed -n '1p')")"
warm_detail_cold_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_detail_cold_runs" | sed -n '2p')")"
warm_detail_cold_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_detail_cold_runs" | sed -n '3p')")"
warm_creator_hot_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_creator_hot_runs" | sed -n '1p')")"
warm_creator_hot_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_creator_hot_runs" | sed -n '2p')")"
warm_creator_hot_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_creator_hot_runs" | sed -n '3p')")"
warm_creator_cold_ttfb_1="$(extract_ttfb "$(printf '%s\n' "$warm_creator_cold_runs" | sed -n '1p')")"
warm_creator_cold_ttfb_2="$(extract_ttfb "$(printf '%s\n' "$warm_creator_cold_runs" | sed -n '2p')")"
warm_creator_cold_ttfb_3="$(extract_ttfb "$(printf '%s\n' "$warm_creator_cold_runs" | sed -n '3p')")"

WARM_RESOURCES_MEDIAN="$(median_ttfb "$warm_resources_ttfb_1" "$warm_resources_ttfb_2" "$warm_resources_ttfb_3")"
WARM_NEWEST_MEDIAN="$(median_ttfb "$warm_newest_ttfb_1" "$warm_newest_ttfb_2" "$warm_newest_ttfb_3")"
WARM_RECOMMENDED_MEDIAN="$(median_ttfb "$warm_recommended_ttfb_1" "$warm_recommended_ttfb_2" "$warm_recommended_ttfb_3")"
WARM_LISTING_DEFAULT_MEDIAN="$(median_ttfb "$warm_listing_default_ttfb_1" "$warm_listing_default_ttfb_2" "$warm_listing_default_ttfb_3")"
WARM_LISTING_NEWEST_MEDIAN="$(median_ttfb "$warm_listing_newest_ttfb_1" "$warm_listing_newest_ttfb_2" "$warm_listing_newest_ttfb_3")"
WARM_LISTING_RECOMMENDED_MEDIAN="$(median_ttfb "$warm_listing_recommended_ttfb_1" "$warm_listing_recommended_ttfb_2" "$warm_listing_recommended_ttfb_3")"
WARM_LISTING_CONTROL_A_MEDIAN="$(median_ttfb "$warm_listing_control_a_ttfb_1" "$warm_listing_control_a_ttfb_2" "$warm_listing_control_a_ttfb_3")"
WARM_LISTING_RECOMMENDED_B_MEDIAN="$(median_ttfb "$warm_listing_recommended_b_ttfb_1" "$warm_listing_recommended_b_ttfb_2" "$warm_listing_recommended_b_ttfb_3")"
WARM_DETAIL_HOT_MEDIAN="$(median_ttfb "$warm_detail_hot_ttfb_1" "$warm_detail_hot_ttfb_2" "$warm_detail_hot_ttfb_3")"
WARM_DETAIL_COLD_MEDIAN="$(median_ttfb "$warm_detail_cold_ttfb_1" "$warm_detail_cold_ttfb_2" "$warm_detail_cold_ttfb_3")"
WARM_CREATOR_HOT_MEDIAN="$(median_ttfb "$warm_creator_hot_ttfb_1" "$warm_creator_hot_ttfb_2" "$warm_creator_hot_ttfb_3")"
WARM_CREATOR_COLD_MEDIAN="$(median_ttfb "$warm_creator_cold_ttfb_1" "$warm_creator_cold_ttfb_2" "$warm_creator_cold_ttfb_3")"
ROI_RESOURCES_MS="$(to_ms "$(awk -v cold="$COLD_RESOURCES_TTFB" -v warm="$WARM_RESOURCES_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_NEWEST_MS="$(to_ms "$(awk -v cold="$COLD_NEWEST_TTFB" -v warm="$WARM_NEWEST_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_RECOMMENDED_MS="$(to_ms "$(awk -v cold="$COLD_RECOMMENDED_TTFB" -v warm="$WARM_RECOMMENDED_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_LISTING_DEFAULT_MS="$(to_ms "$(awk -v cold="$COLD_LISTING_DEFAULT_TTFB" -v warm="$WARM_LISTING_DEFAULT_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_LISTING_NEWEST_MS="$(to_ms "$(awk -v cold="$COLD_LISTING_NEWEST_TTFB" -v warm="$WARM_LISTING_NEWEST_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_LISTING_RECOMMENDED_MS="$(to_ms "$(awk -v cold="$COLD_LISTING_RECOMMENDED_TTFB" -v warm="$WARM_LISTING_RECOMMENDED_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_LISTING_CONTROL_A_MS="$(to_ms "$(awk -v cold="$COLD_LISTING_CONTROL_A_TTFB" -v warm="$WARM_LISTING_CONTROL_A_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_LISTING_RECOMMENDED_B_MS="$(to_ms "$(awk -v cold="$COLD_LISTING_RECOMMENDED_B_TTFB" -v warm="$WARM_LISTING_RECOMMENDED_B_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_DETAIL_HOT_MS="$(to_ms "$(awk -v cold="$COLD_DETAIL_HOT_TTFB" -v warm="$WARM_DETAIL_HOT_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_DETAIL_COLD_MS="$(to_ms "$(awk -v cold="$COLD_DETAIL_COLD_TTFB" -v warm="$WARM_DETAIL_COLD_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_CREATOR_HOT_MS="$(to_ms "$(awk -v cold="$COLD_CREATOR_HOT_TTFB" -v warm="$WARM_CREATOR_HOT_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_CREATOR_COLD_MS="$(to_ms "$(awk -v cold="$COLD_CREATOR_COLD_TTFB" -v warm="$WARM_CREATOR_COLD_MEDIAN" 'BEGIN { print cold - warm }')")"
ROI_RESOURCES="$(roi_percent "$COLD_RESOURCES_TTFB" "$WARM_RESOURCES_MEDIAN")"
ROI_NEWEST="$(roi_percent "$COLD_NEWEST_TTFB" "$WARM_NEWEST_MEDIAN")"
ROI_RECOMMENDED="$(roi_percent "$COLD_RECOMMENDED_TTFB" "$WARM_RECOMMENDED_MEDIAN")"
ROI_LISTING_DEFAULT="$(roi_percent "$COLD_LISTING_DEFAULT_TTFB" "$WARM_LISTING_DEFAULT_MEDIAN")"
ROI_LISTING_NEWEST="$(roi_percent "$COLD_LISTING_NEWEST_TTFB" "$WARM_LISTING_NEWEST_MEDIAN")"
ROI_LISTING_RECOMMENDED="$(roi_percent "$COLD_LISTING_RECOMMENDED_TTFB" "$WARM_LISTING_RECOMMENDED_MEDIAN")"
ROI_LISTING_CONTROL_A="$(roi_percent "$COLD_LISTING_CONTROL_A_TTFB" "$WARM_LISTING_CONTROL_A_MEDIAN")"
ROI_LISTING_RECOMMENDED_B="$(roi_percent "$COLD_LISTING_RECOMMENDED_B_TTFB" "$WARM_LISTING_RECOMMENDED_B_MEDIAN")"
ROI_DETAIL_HOT="$(roi_percent "$COLD_DETAIL_HOT_TTFB" "$WARM_DETAIL_HOT_MEDIAN")"
ROI_DETAIL_COLD="$(roi_percent "$COLD_DETAIL_COLD_TTFB" "$WARM_DETAIL_COLD_MEDIAN")"
ROI_CREATOR_HOT="$(roi_percent "$COLD_CREATOR_HOT_TTFB" "$WARM_CREATOR_HOT_MEDIAN")"
ROI_CREATOR_COLD="$(roi_percent "$COLD_CREATOR_COLD_TTFB" "$WARM_CREATOR_COLD_MEDIAN")"

print_section "Warmed medians"
printf 'resources median=%ss\n' "$WARM_RESOURCES_MEDIAN"
printf 'newest median=%ss\n' "$WARM_NEWEST_MEDIAN"
printf 'recommended median=%ss\n' "$WARM_RECOMMENDED_MEDIAN"
printf 'listing_default median=%ss\n' "$WARM_LISTING_DEFAULT_MEDIAN"
printf 'listing_newest median=%ss\n' "$WARM_LISTING_NEWEST_MEDIAN"
printf 'listing_recommended median=%ss\n' "$WARM_LISTING_RECOMMENDED_MEDIAN"
printf 'listing_control_variant_%s median=%ss\n' "$RANKING_CONTROL_VARIANT" "$WARM_LISTING_CONTROL_A_MEDIAN"
printf 'listing_recommended_variant_%s median=%ss\n' "$RANKING_RECOMMENDED_VARIANT" "$WARM_LISTING_RECOMMENDED_B_MEDIAN"
printf 'detail_hot median=%ss\n' "$WARM_DETAIL_HOT_MEDIAN"
printf 'detail_cold median=%ss\n' "$WARM_DETAIL_COLD_MEDIAN"
printf 'creator_hot median=%ss\n' "$WARM_CREATOR_HOT_MEDIAN"
printf 'creator_cold median=%ss\n' "$WARM_CREATOR_COLD_MEDIAN"

print_section "Quick ROI summary"
printf 'resources cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_RESOURCES_TTFB" \
  "$WARM_RESOURCES_MEDIAN" \
  "$ROI_RESOURCES_MS" \
  "$ROI_RESOURCES"
printf 'newest cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_NEWEST_TTFB" \
  "$WARM_NEWEST_MEDIAN" \
  "$ROI_NEWEST_MS" \
  "$ROI_NEWEST"
printf 'recommended cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_RECOMMENDED_TTFB" \
  "$WARM_RECOMMENDED_MEDIAN" \
  "$ROI_RECOMMENDED_MS" \
  "$ROI_RECOMMENDED"
printf 'listing_default cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_LISTING_DEFAULT_TTFB" \
  "$WARM_LISTING_DEFAULT_MEDIAN" \
  "$ROI_LISTING_DEFAULT_MS" \
  "$ROI_LISTING_DEFAULT"
printf 'listing_newest cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_LISTING_NEWEST_TTFB" \
  "$WARM_LISTING_NEWEST_MEDIAN" \
  "$ROI_LISTING_NEWEST_MS" \
  "$ROI_LISTING_NEWEST"
printf 'listing_recommended cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_LISTING_RECOMMENDED_TTFB" \
  "$WARM_LISTING_RECOMMENDED_MEDIAN" \
  "$ROI_LISTING_RECOMMENDED_MS" \
  "$ROI_LISTING_RECOMMENDED"
printf 'listing_control_variant_%s cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$RANKING_CONTROL_VARIANT" \
  "$COLD_LISTING_CONTROL_A_TTFB" \
  "$WARM_LISTING_CONTROL_A_MEDIAN" \
  "$ROI_LISTING_CONTROL_A_MS" \
  "$ROI_LISTING_CONTROL_A"
printf 'listing_recommended_variant_%s cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$RANKING_RECOMMENDED_VARIANT" \
  "$COLD_LISTING_RECOMMENDED_B_TTFB" \
  "$WARM_LISTING_RECOMMENDED_B_MEDIAN" \
  "$ROI_LISTING_RECOMMENDED_B_MS" \
  "$ROI_LISTING_RECOMMENDED_B"
printf 'detail_hot cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_DETAIL_HOT_TTFB" \
  "$WARM_DETAIL_HOT_MEDIAN" \
  "$ROI_DETAIL_HOT_MS" \
  "$ROI_DETAIL_HOT"
printf 'detail_cold cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_DETAIL_COLD_TTFB" \
  "$WARM_DETAIL_COLD_MEDIAN" \
  "$ROI_DETAIL_COLD_MS" \
  "$ROI_DETAIL_COLD"
printf 'creator_hot cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_CREATOR_HOT_TTFB" \
  "$WARM_CREATOR_HOT_MEDIAN" \
  "$ROI_CREATOR_HOT_MS" \
  "$ROI_CREATOR_HOT"
printf 'creator_cold cold=%ss warm=%ss saved=%sms roi=%s\n' \
  "$COLD_CREATOR_COLD_TTFB" \
  "$WARM_CREATOR_COLD_MEDIAN" \
  "$ROI_CREATOR_COLD_MS" \
  "$ROI_CREATOR_COLD"

print_section "Runbook reminders"
printf '%s\n' 'Check [PERF] cache_execute:* logs for cold misses and repeated identical misses after warm.'
printf '%s\n' 'Check [PERF] public_cache_warm* and internal_performance_warm_endpoint* logs for warm elapsed and coverage.'
printf '%s\n' 'Check [PREFETCH] logs in the browser console on /resources, especially resource-card-grid.'
printf 'Check experiment-aware listing rows with explicit cookies: %s=%s (control/newest) and %s=%s (recommended).\n' \
  "$RANKING_EXPERIMENT_COOKIE_NAME" \
  "$RANKING_CONTROL_VARIANT" \
  "$RANKING_EXPERIMENT_COOKIE_NAME" \
  "$RANKING_RECOMMENDED_VARIANT"
printf '%s\n' 'Threshold targets: redirect <100ms good, listing-mode /resources?category=all* >=20% or >=100ms saved, full warm <1s good, detail_hot >=25% or >=150ms saved, prefetch waste <=2:1 good.'

if [ -n "$MARKDOWN_OUTPUT_FILE" ]; then
  write_markdown_report "$MARKDOWN_OUTPUT_FILE"
  printf '%s\n' "Markdown report written to $MARKDOWN_OUTPUT_FILE"
fi
