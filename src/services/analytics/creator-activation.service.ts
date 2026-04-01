/**
 * Creator activation funnel service.
 *
 * Combines the four repository queries into a single structured report.
 * Computes step-to-step conversion rates and an overall view-to-publish rate.
 *
 * Date range logic:
 *   - No start/end provided  → default to last 30 days
 *   - Invalid date string    → treated as absent, falls back to default
 *   - start > end            → bounds are swapped before querying
 *   - end date               → advanced to end-of-day (23:59:59.999) so the
 *                              whole calendar day is included
 */

import { unstable_cache } from "next/cache";
import {
  countFirstRunViews,
  countCreateFirstResourceClicks,
  countFirstDraftCreated,
  countFirstPublished,
  type DateFilter,
} from "@/repositories/analytics/creator-activation.repository";
import { CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_DAYS = 30;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatorActivationFunnel {
  /** Distinct creators who saw the first-run dashboard. */
  firstRunViews: number;
  /** Distinct creators who clicked the "Create first resource" CTA. */
  createClicks: number;
  /** Distinct creators who saved their first draft. */
  draftCreated: number;
  /** Distinct creators who published their first resource. */
  firstPublished: number;

  /**
   * Step-to-step conversion rates (0–100, 2 dp).
   * null when the denominator is 0 (no data yet).
   */
  clickRate: number | null;     // createClicks / firstRunViews × 100
  draftRate: number | null;     // draftCreated / createClicks × 100
  publishRate: number | null;   // firstPublished / draftCreated × 100
  /** Overall: firstPublished / firstRunViews × 100 */
  overallRate: number | null;

  generatedAt: string;
  filterStart: string;
  filterEnd: string;
  isDefaultRange: boolean;
}

export interface CreatorActivationReportOptions {
  start?: string | null;
  end?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function endOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10_000) / 100; // 2 dp
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function getCreatorActivationFunnel(
  options: CreatorActivationReportOptions = {},
): Promise<CreatorActivationFunnel> {
  let startDate = toDate(options.start);
  let endDate = toDate(options.end);

  const isDefaultRange = !startDate && !endDate;

  if (isDefaultRange) {
    endDate = new Date();
    startDate = new Date(endDate.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
  }

  // Swap if inverted
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  const effectiveStart = startDate ?? new Date(0);
  const effectiveEnd = endDate ?? new Date();
  const filterStart = toDateString(effectiveStart);
  const filterEnd = toDateString(effectiveEnd);
  const cacheMode = isDefaultRange ? "default" : "explicit";

  recordCacheCall("getCreatorActivationFunnel", {
    cacheMode,
    filterEnd,
    filterStart,
  });

  return unstable_cache(
    async function _getCreatorActivationFunnel() {
      recordCacheMiss("getCreatorActivationFunnel", {
        cacheMode,
        filterEnd,
        filterStart,
      });

      const filter: DateFilter = {
        ...(startDate ? { start: startDate } : {}),
        ...(endDate ? { end: endOfDay(endDate) } : {}),
      };
      const cacheKey = [
        "admin-creator-activation",
        filterStart,
        filterEnd,
        cacheMode,
      ].join(":");

      return rememberJson(
        cacheKey,
        CACHE_TTLS.stats,
        () =>
          runSingleFlight(cacheKey, async () => {
            const [firstRunViews, createClicks, draftCreated, firstPublished] =
              await Promise.all([
                countFirstRunViews(filter),
                countCreateFirstResourceClicks(filter),
                countFirstDraftCreated(filter),
                countFirstPublished(filter),
              ]);

            return {
              firstRunViews,
              createClicks,
              draftCreated,
              firstPublished,

              clickRate: pct(createClicks, firstRunViews),
              draftRate: pct(draftCreated, createClicks),
              publishRate: pct(firstPublished, draftCreated),
              overallRate: pct(firstPublished, firstRunViews),

              generatedAt: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
              filterStart,
              filterEnd,
              isDefaultRange,
            };
          }),
        {
          metricName: "getCreatorActivationFunnel",
          details: {
            cacheMode,
            filterEnd,
            filterStart,
          },
        },
      );
    },
    [
      "admin-creator-activation",
      filterStart,
      filterEnd,
      cacheMode,
    ],
    { revalidate: CACHE_TTLS.stats },
  )();
}
