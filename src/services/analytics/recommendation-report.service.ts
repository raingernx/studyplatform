/**
 * Recommendation experiment report service.
 *
 * Combines the four repository queries into a single structured result.
 * Exposes a simple phase1 / phase2 shape that answers directly:
 * "Is Phase 2 better than Phase 1?"
 *
 * Date range logic (all handled here, never in the UI):
 *   - No start/end provided → default to last 7 days
 *   - Invalid date string   → treated as absent, falls back to default
 *   - start > end           → bounds are swapped before querying
 *   - end date              → advanced to end-of-day (23:59:59.999) so the
 *                             whole calendar day is included
 */

import { unstable_cache } from "next/cache";
import {
  getRecommendationImpressions,
  getRecommendationClicks,
  getRecommendationUniqueUsers,
  getRecommendationPurchases,
  type DateFilter,
} from "@/repositories/analytics/recommendation-report.repository";
import { CACHE_TTLS } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";
import { RECOMMENDATION_EXPERIMENT_ID } from "@/lib/recommendations/experiment";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_DAYS = 7;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VariantMetrics {
  impressions: number;
  clicks:      number;
  /** clicks / impressions × 100, 2 dp.  0 when impressions = 0. */
  ctr:         number;
  users:       number;
  purchases:   number;
}

export interface RecommendationReport {
  experimentId:   string;
  generatedAt:    string;
  /** YYYY-MM-DD of the active start bound (always present — never null). */
  filterStart:    string;
  /** YYYY-MM-DD of the active end bound (always present — never null). */
  filterEnd:      string;
  /** True when no explicit start/end was provided and defaults were applied. */
  isDefaultRange: boolean;
  phase1:         VariantMetrics;
  phase2:         VariantMetrics;
}

export interface RecommendationReportOptions {
  experimentId?: string;
  /** ISO / YYYY-MM-DD date string for the start of the window (inclusive). */
  start?:        string | null;
  /** ISO / YYYY-MM-DD date string for the end of the window (inclusive). */
  end?:          string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ctr(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return Math.round((clicks / impressions) * 10_000) / 100;
}

function variantMetrics(
  variant:     string,
  impressions: Record<string, number>,
  clicks:      Record<string, number>,
  users:       Record<string, number>,
  purchases:   Record<string, number>,
): VariantMetrics {
  const imp = impressions[variant] ?? 0;
  const clk = clicks[variant]      ?? 0;
  return {
    impressions: imp,
    clicks:      clk,
    ctr:         ctr(clk, imp),
    users:       users[variant]    ?? 0,
    purchases:   purchases[variant] ?? 0,
  };
}

/** Returns a Date for a string, or undefined when invalid/absent. */
function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/** YYYY-MM-DD string from a Date, used for display and <input> values. */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Advance a Date to 23:59:59.999 of the same calendar day (UTC). */
function endOfDay(d: Date): Date {
  return new Date(d.getTime() + 86_399_999);
}

/**
 * Resolves the active [startDate, endDate] pair from raw user input.
 *
 * Rules applied in order:
 *   1. Parse both; treat invalid strings as absent.
 *   2. If both absent → default to last 7 days.
 *   3. If only one is absent → set the missing bound to today (end) or
 *      7 days ago (start) so queries are always bounded.
 *   4. If start > end → swap them.
 *   5. Advance end to end-of-day.
 *
 * Returns [resolvedStart, resolvedEnd, isDefaultRange].
 */
function resolveRange(
  rawStart: string | null | undefined,
  rawEnd:   string | null | undefined,
): [Date, Date, boolean] {
  const now      = Date.now();
  const todayEod = endOfDay(new Date(now));

  let start = parseDate(rawStart);
  let end   = parseDate(rawEnd);

  const isDefaultRange = !start && !end;

  if (isDefaultRange) {
    start = new Date(now - DEFAULT_WINDOW_DAYS * 86_400_000);
    end   = todayEod;
    return [start, end, true];
  }

  // Fill in whichever bound is missing.
  if (!start) start = new Date(now - DEFAULT_WINDOW_DAYS * 86_400_000);
  if (!end)   end   = todayEod;

  // Swap if inverted.
  if (start > end) [start, end] = [end, start];

  // Advance end to end-of-day.
  end = endOfDay(end);

  return [start, end, false];
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getRecommendationReport(
  options: RecommendationReportOptions = {},
): Promise<RecommendationReport> {
  const experimentId = options.experimentId ?? RECOMMENDATION_EXPERIMENT_ID;

  const [startDate, endDate, isDefaultRange] = resolveRange(
    options.start,
    options.end,
  );
  const filterStart = toDateStr(startDate);
  const filterEnd = toDateStr(endDate);
  const cacheMode = isDefaultRange ? "default" : "explicit";

  recordCacheCall("getRecommendationReport", {
    experimentId,
    filterStart,
    filterEnd,
    cacheMode,
  });

  return unstable_cache(
    async function _getRecommendationReport() {
      recordCacheMiss("getRecommendationReport", {
        experimentId,
        filterStart,
        filterEnd,
        cacheMode,
      });
      const filter: DateFilter = { start: startDate, end: endDate };

      const [impressions, clicks, users, purchases] = await Promise.all([
        getRecommendationImpressions(experimentId, filter),
        getRecommendationClicks(experimentId, filter),
        getRecommendationUniqueUsers(experimentId, filter),
        getRecommendationPurchases(experimentId, filter),
      ]);

      return {
        experimentId,
        generatedAt: new Date().toISOString(),
        filterStart,
        filterEnd,
        isDefaultRange,
        phase1: variantMetrics("phase1", impressions, clicks, users, purchases),
        phase2: variantMetrics("phase2", impressions, clicks, users, purchases),
      };
    },
    [
      "admin-recommendation-report",
      experimentId,
      filterStart,
      filterEnd,
      cacheMode,
    ],
    { revalidate: CACHE_TTLS.publicPage },
  )();
}
