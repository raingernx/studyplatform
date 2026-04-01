/**
 * Purchase Analytics Service
 *
 * Aggregates buyer-funnel and revenue metrics from three sources:
 *
 *   Purchase table   — sessions started/completed/failed, free claims
 *   CreatorRevenue   — confirmed revenue with platform/creator split
 *   ActivityLog      — six-step event funnel derived from instrumented actions:
 *                       CHECKOUT_STARTED → CHECKOUT_REDIRECTED →
 *                       PURCHASE_COMPLETED_WEBHOOK → CHECKOUT_SUCCESS_PAGE_VIEWED →
 *                       DOWNLOAD_STARTED → FIRST_PAID_DOWNLOAD
 *
 * Date range handling mirrors the creator-activation service:
 *   - No start/end       → default to last 30 days
 *   - Invalid date string → treated as absent, falls back to default
 *   - start > end        → bounds are swapped
 *   - end date           → advanced to end-of-day (23:59:59.999 UTC)
 */

import { unstable_cache } from "next/cache";
import {
  fetchPurchaseFunnelCounts,
  fetchRevenueSummary,
  fetchProviderBreakdown,
  fetchTopPurchasedResources,
  fetchDailyPurchaseSeries,
  fetchActivityFunnelCounts,
  type PurchaseDateFilter,
} from "@/repositories/analytics/purchase-analytics.repository";
import { CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_WINDOW_DAYS = 30;

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * One step in the six-step ActivityLog funnel.
 *
 * rateFromPrev is step N count / step N-1 count × 100.
 * null for the first step (no predecessor) and when the denominator is 0.
 */
export interface FunnelStep {
  /** Human-readable stage name shown in the UI. */
  label: string;
  /** The ActivityLog action string that feeds this step. */
  action: string;
  /** Raw event count for the step in the selected date range. */
  count: number;
  /**
   * Conversion from the previous step, 0–100 (2 dp).
   * null for the first step or when the previous count is 0.
   */
  rateFromPrev: number | null;
  /**
   * Short label describing what this rate measures, e.g. "redirect rate".
   * Empty string for the first step.
   */
  rateLabel: string;
}

export interface PurchaseAnalyticsReport {
  // ── Purchase-table funnel ─────────────────────────────────────────────────
  /** Checkout sessions initiated (Purchase rows with paid provider). */
  sessionsStarted: number;
  /** Sessions that resulted in a confirmed payment (status = COMPLETED). */
  sessionsCompleted: number;
  /** Sessions explicitly marked FAILED. */
  sessionsFailed: number;
  /** Implied abandoned sessions (started − completed − failed). */
  sessionsAbandoned: number;
  /** sessionsCompleted / sessionsStarted × 100 (null when 0 sessions). */
  paidConversionRate: number | null;

  // ── Free claims ───────────────────────────────────────────────────────────
  freeClaims: number;

  // ── Combined acquisition count ────────────────────────────────────────────
  /** sessionsCompleted + freeClaims */
  totalAcquisitions: number;

  // ── ActivityLog funnel ────────────────────────────────────────────────────
  /**
   * Six sequential steps derived from ActivityLog events, each carrying its
   * raw count and the step-to-step conversion rate from the prior step.
   *
   * Steps:
   *   [0] CHECKOUT_STARTED          — session URL generated server-side
   *   [1] CHECKOUT_REDIRECTED        — client about to navigate to provider
   *   [2] PURCHASE_COMPLETED_WEBHOOK — payment confirmed via webhook
   *   [3] CHECKOUT_SUCCESS_PAGE_VIEWED — buyer landed on success page
   *   [4] DOWNLOAD_STARTED           — file download initiated (all types)
   *   [5] FIRST_PAID_DOWNLOAD        — first successful download of a paid resource
   */
  funnelSteps: FunnelStep[];

  /** Raw count of DOWNLOAD_STARTED events (all resource types, paid + free). */
  downloadsStarted: number;
  /** Raw count of FIRST_PAID_DOWNLOAD events (first download per user per paid resource). */
  firstPaidDownload: number;

  /** CHECKOUT_REDIRECTED / CHECKOUT_STARTED × 100 */
  redirectRate: number | null;
  /** PURCHASE_COMPLETED_WEBHOOK / CHECKOUT_REDIRECTED × 100 */
  completionRate: number | null;
  /** CHECKOUT_SUCCESS_PAGE_VIEWED / PURCHASE_COMPLETED_WEBHOOK × 100 */
  returnRate: number | null;
  /** DOWNLOAD_STARTED / CHECKOUT_SUCCESS_PAGE_VIEWED × 100 */
  activationRate: number | null;
  /** FIRST_PAID_DOWNLOAD / PURCHASE_COMPLETED_WEBHOOK × 100 — clean paid-activation signal. */
  paidActivationRate: number | null;

  // ── Revenue (in smallest currency unit — satang for THB) ──────────────────
  totalRevenue: number;
  platformFee: number;
  creatorShare: number;

  // ── Provider breakdown ────────────────────────────────────────────────────
  providerBreakdown: Array<{
    provider: string;
    purchaseCount: number;
    revenue: number;
  }>;

  // ── Top resources ─────────────────────────────────────────────────────────
  topResources: Array<{
    resourceId: string;
    title: string;
    slug: string;
    purchaseCount: number;
    revenue: number;
  }>;

  // ── Daily series ──────────────────────────────────────────────────────────
  dailySeries: Array<{
    date: string;
    paidCount: number;
    freeCount: number;
    revenue: number;
  }>;

  // ── Meta ──────────────────────────────────────────────────────────────────
  generatedAt: string;
  filterStart: string;
  filterEnd: string;
  isDefaultRange: boolean;
}

export interface PurchaseAnalyticsOptions {
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

/** Safe percentage: numerator / denominator × 100, rounded to 2 dp. */
function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function getPurchaseAnalytics(
  options: PurchaseAnalyticsOptions = {},
): Promise<PurchaseAnalyticsReport> {
  let startDate = toDate(options.start);
  let endDate = toDate(options.end);

  const isDefaultRange = !startDate && !endDate;

  if (isDefaultRange) {
    endDate = new Date();
    startDate = new Date(endDate.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
  }

  // Swap inverted bounds
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  const filter: PurchaseDateFilter = {
    ...(startDate ? { start: startDate } : {}),
    ...(endDate ? { end: endOfDay(endDate) } : {}),
  };

  const effectiveStart = startDate ?? new Date(0);
  const effectiveEnd = endDate ?? new Date();
  const filterStart = toDateString(effectiveStart);
  const filterEnd = toDateString(effectiveEnd);
  const cacheMode = isDefaultRange ? "default" : "explicit";

  recordCacheCall("getPurchaseAnalytics", {
    filterStart,
    filterEnd,
    cacheMode,
  });

  return unstable_cache(
    async function _getPurchaseAnalyticsReport() {
      recordCacheMiss("getPurchaseAnalytics", {
        filterStart,
        filterEnd,
        cacheMode,
      });
      const cacheKey = [
        "admin-purchase-analytics",
        filterStart,
        filterEnd,
        cacheMode,
      ].join(":");

      return rememberJson(
        cacheKey,
        CACHE_TTLS.publicPage,
        () =>
          runSingleFlight(cacheKey, async () => {
            const [
              funnel,
              activityFunnel,
              revenue,
              providerBreakdown,
              topResources,
              dailySeries,
            ] = await Promise.all([
              fetchPurchaseFunnelCounts(filter),
              fetchActivityFunnelCounts(filter),
              fetchRevenueSummary(filter),
              fetchProviderBreakdown(filter),
              fetchTopPurchasedResources(filter, 10),
              fetchDailyPurchaseSeries(filter),
            ]);

            const sessionsAbandoned = Math.max(
              0,
              funnel.sessionsStarted - funnel.sessionsCompleted - funnel.sessionsFailed,
            );
            const redirectRate = pct(
              activityFunnel.checkoutRedirected,
              activityFunnel.checkoutStarted,
            );
            const completionRate = pct(
              activityFunnel.purchaseCompletedWebhook,
              activityFunnel.checkoutRedirected,
            );
            const returnRate = pct(
              activityFunnel.checkoutSuccessPageViewed,
              activityFunnel.purchaseCompletedWebhook,
            );
            const activationRate = pct(
              activityFunnel.downloadStarted,
              activityFunnel.checkoutSuccessPageViewed,
            );
            const paidActivationRate = pct(
              activityFunnel.firstPaidDownload,
              activityFunnel.purchaseCompletedWebhook,
            );

            const funnelSteps: FunnelStep[] = [
              {
                label: "Checkout started",
                action: "CHECKOUT_STARTED",
                count: activityFunnel.checkoutStarted,
                rateFromPrev: null,
                rateLabel: "",
              },
              {
                label: "Redirected to provider",
                action: "CHECKOUT_REDIRECTED",
                count: activityFunnel.checkoutRedirected,
                rateFromPrev: redirectRate,
                rateLabel: "redirect rate",
              },
              {
                label: "Payment confirmed",
                action: "PURCHASE_COMPLETED_WEBHOOK",
                count: activityFunnel.purchaseCompletedWebhook,
                rateFromPrev: completionRate,
                rateLabel: "completion rate",
              },
              {
                label: "Success page viewed",
                action: "CHECKOUT_SUCCESS_PAGE_VIEWED",
                count: activityFunnel.checkoutSuccessPageViewed,
                rateFromPrev: returnRate,
                rateLabel: "return rate",
              },
              {
                label: "Download started",
                action: "DOWNLOAD_STARTED",
                count: activityFunnel.downloadStarted,
                rateFromPrev: activationRate,
                rateLabel: "activation rate",
              },
              {
                label: "Paid activation",
                action: "FIRST_PAID_DOWNLOAD",
                count: activityFunnel.firstPaidDownload,
                rateFromPrev: paidActivationRate,
                rateLabel: "paid activation rate",
              },
            ];

            return {
              sessionsStarted: funnel.sessionsStarted,
              sessionsCompleted: funnel.sessionsCompleted,
              sessionsFailed: funnel.sessionsFailed,
              sessionsAbandoned,
              paidConversionRate: pct(funnel.sessionsCompleted, funnel.sessionsStarted),
              freeClaims: funnel.freeClaims,
              totalAcquisitions: funnel.sessionsCompleted + funnel.freeClaims,

              funnelSteps,
              downloadsStarted: activityFunnel.downloadStarted,
              firstPaidDownload: activityFunnel.firstPaidDownload,
              redirectRate,
              completionRate,
              returnRate,
              activationRate,
              paidActivationRate,

              totalRevenue: revenue.totalRevenue,
              platformFee: revenue.platformFee,
              creatorShare: revenue.creatorShare,

              providerBreakdown,
              topResources,

              dailySeries: dailySeries.map((row) => ({
                date: new Date(row.date).toISOString().slice(0, 10),
                paidCount: row.paidCount,
                freeCount: row.freeCount,
                revenue: row.revenue,
              })),

              generatedAt:
                new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
              filterStart,
              filterEnd,
              isDefaultRange,
            };
          }),
        {
          metricName: "getPurchaseAnalytics",
          details: {
            cacheMode,
            filterEnd,
            filterStart,
          },
        },
      );
    },
    [
      "admin-purchase-analytics",
      filterStart,
      filterEnd,
      cacheMode,
    ],
    { revalidate: CACHE_TTLS.publicPage },
  )();
}
