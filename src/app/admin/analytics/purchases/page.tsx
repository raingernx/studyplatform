import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getPurchaseAnalytics,
  type FunnelStep,
} from "@/services/analytics";
import { formatPrice } from "@/lib/format";
import {
  DollarSign,
  CheckCircle,
  TrendingUp,
  Gift,
  Package,
  Download,
  CreditCard,
  ArrowDown,
} from "lucide-react";
import { Button, Input } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TableToolbar } from "@/components/admin/table";
import { AdminAnalyticsPurchasesResultsSkeleton } from "@/components/skeletons/AdminAnalyticsRouteSkeletons";
import { routes } from "@/lib/routes";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";

export const metadata = {
  title: "Purchase Analytics – Admin",
  description: "Purchase funnel, revenue, and resource performance.",
};

export const dynamic = "force-dynamic";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat().format(n);
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return `${n.toFixed(1)}%`;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Rate colour ───────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind colour pair for a conversion rate badge.
 * Thresholds are intentionally generous — these vary wildly by step.
 */
function rateTone(rate: number | null): string {
  if (rate === null) return "bg-muted text-muted-foreground";
  if (rate >= 70) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (rate >= 35) return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-red-50 text-red-600 ring-1 ring-red-200";
}

// ── Preset buttons ────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d", start: () => daysAgo(7), end: today },
  { label: "30d", start: () => daysAgo(30), end: today },
  { label: "90d", start: () => daysAgo(90), end: today },
  { label: "All", start: () => "", end: () => "" },
] as const;

function PresetButtons({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => {
        const pStart = p.start();
        const pEnd = p.end();
        const href =
          pStart || pEnd
            ? routes.adminPurchasesAnalyticsQuery(`start=${pStart}&end=${pEnd}`)
            : routes.adminPurchasesAnalytics;
        const isActive =
          p.label === "All"
            ? !start && !end
            : start === pStart && end === pEnd;
        return (
          <a
            key={p.label}
            href={href}
            className={`whitespace-nowrap rounded-full px-3 py-1 font-ui text-caption font-medium transition-colors ${
              isActive
                ? "bg-primary-700 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {p.label}
          </a>
        );
      })}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-small font-medium text-muted-foreground">{label}</p>
      {sub && <p className="mt-1 text-caption text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Spark bar ─────────────────────────────────────────────────────────────────

function SparkBar({
  data,
  colorClass = "bg-violet-400",
}: {
  data: { date: string; value: number }[];
  colorClass?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-12 items-center justify-center text-caption text-muted-foreground">
        No data
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-12 items-end gap-px">
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.value}`}
            className={`flex-1 rounded-t ${colorClass} opacity-70 transition-opacity hover:opacity-100`}
            style={{ height: `${Math.max(pct, 2)}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Funnel row ────────────────────────────────────────────────────────────────

function FunnelRow({
  step,
  isLast,
  topCount,
}: {
  step: FunnelStep;
  isLast: boolean;
  /** Count of step[0] — used to compute bar width relative to entry. */
  topCount: number;
}) {
  const barPct = topCount > 0 ? Math.min(Math.round((step.count / topCount) * 100), 100) : 0;

  return (
    <>
      <tr className="group transition-colors hover:bg-muted/50">
        {/* Stage label */}
        <td className="px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{step.label}</p>
          <p className="mt-0.5 font-mono text-caption text-muted-foreground">
            {step.action}
          </p>
        </td>

        {/* Count + inline bar */}
        <td className="px-5 py-4">
          <p className="text-xl font-bold tabular-nums text-foreground">{fmt(step.count)}</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-400 transition-all"
              style={{ width: `${barPct}%` }}
            />
          </div>
        </td>

        {/* Rate badge */}
        <td className="px-5 py-4 text-right">
          {step.rateFromPrev !== null ? (
            <div className="inline-flex flex-col items-end gap-0.5">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-bold tabular-nums ${rateTone(step.rateFromPrev)}`}
              >
                {fmtPct(step.rateFromPrev)}
              </span>
              <span className="font-ui text-caption font-medium text-muted-foreground">
                {step.rateLabel}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </td>
      </tr>

      {/* Arrow connector between steps */}
      {!isLast && (
        <tr aria-hidden>
          <td colSpan={3} className="px-5 py-0">
            <div className="flex items-center gap-2 py-1">
              <ArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PurchaseAnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const start = params.start || null;
  const end = params.end || null;
  const fallbackRangeLabel =
    start || end
      ? `${start || "…"} → ${end || "…"}`
      : `Last 30 days · ${daysAgo(30)} → ${today()}`;

  return (
    <div className="space-y-10">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <AdminPageHeader
        title="Purchase Analytics"
        description="Full purchase funnel, revenue, and resource performance."
      />
      <TableToolbar className="items-start justify-between gap-4">
        <PresetButtons start={start} end={end} />
        <div className="shrink-0">
          <form method="get" className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="start"
                className="font-ui text-caption text-muted-foreground"
              >
                From
              </label>
              <Input
                id="start"
                name="start"
                type="date"
                defaultValue={start ?? ""}
                className="w-full sm:w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="end"
                className="font-ui text-caption text-muted-foreground"
              >
                To
              </label>
              <Input
                id="end"
                name="end"
                type="date"
                defaultValue={end ?? ""}
                className="w-full sm:w-36"
              />
            </div>
            <Button type="submit" size="sm" className="whitespace-nowrap">Apply</Button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 font-ui text-caption text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success-400" />
            {fallbackRangeLabel}
            {!start && !end && <span>(default)</span>}
          </p>
        </div>
      </TableToolbar>

      <Suspense fallback={<AdminAnalyticsPurchasesResultsSkeleton />}>
        <PurchaseAnalyticsReportSection start={start} end={end} />
      </Suspense>
    </div>
  );
}

async function PurchaseAnalyticsReportSection({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}) {
  return withRequestPerformanceTrace(
    "route:/admin/analytics/purchases",
    {
      filterMode: start || end ? "explicit" : "default",
      start: start ?? "",
      end: end ?? "",
    },
    async () => {
      const report = await traceServerStep(
        "admin_analytics_purchases.getPurchaseAnalytics",
        () => getPurchaseAnalytics({ start, end }),
        {
          filterMode: start || end ? "explicit" : "default",
          start: start ?? "",
          end: end ?? "",
        },
      );

      const totalProviderPurchases = report.providerBreakdown.reduce(
        (sum, r) => sum + r.purchaseCount,
        0,
      );

      const dailyPaidData = report.dailySeries.map((d) => ({
        date: d.date,
        value: d.paidCount,
      }));
      const dailyFreeData = report.dailySeries.map((d) => ({
        date: d.date,
        value: d.freeCount,
      }));

      const funnelTopCount = report.funnelSteps[0]?.count ?? 0;

      return (
        <>
      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <section aria-label="Summary">
        <p className="mb-3 font-ui text-caption text-muted-foreground">
          Summary
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          <StatCard
            label="Revenue"
            value={formatPrice(report.totalRevenue / 100)}
            sub="confirmed paid purchases"
            icon={DollarSign}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Completed purchases"
            value={fmt(report.sessionsCompleted)}
            sub="paid · webhook confirmed"
            icon={CheckCircle}
            accent="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Conversion rate"
            value={fmtPct(report.paidConversionRate)}
            sub="completed / started"
            icon={TrendingUp}
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Free claims"
            value={fmt(report.freeClaims)}
            sub="free resource adds"
            icon={Gift}
            accent="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Total acquisitions"
            value={fmt(report.totalAcquisitions)}
            sub="paid + free"
            icon={Package}
            accent="bg-secondary text-secondary-foreground"
          />
          <StatCard
            label="Downloads started"
            value={fmt(report.downloadsStarted)}
            sub="all resource types"
            icon={Download}
            accent="bg-sky-50 text-sky-600"
          />
          <StatCard
            label="Paid activations"
            value={fmt(report.firstPaidDownload)}
            sub={`${fmtPct(report.paidActivationRate)} of completed`}
            icon={TrendingUp}
            accent="bg-teal-50 text-teal-600"
          />
        </div>
      </section>

      {/* ── Funnel table ─────────────────────────────────────────────────────── */}
      <section aria-label="Purchase funnel">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="font-ui text-caption text-muted-foreground">
            Checkout funnel
          </p>
          <p className="text-caption text-muted-foreground">
            Source: ActivityLog events · step-to-step conversion
          </p>
        </div>

        {funnelTopCount === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-small text-muted-foreground">
            No checkout events recorded in this date range.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left font-ui text-caption text-muted-foreground">
                    Stage
                  </th>
                  <th className="px-5 py-3 text-left font-ui text-caption text-muted-foreground">
                    Events
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    vs previous
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.funnelSteps.map((step, i) => (
                  <FunnelRow
                    key={step.action}
                    step={step}
                    isLast={i === report.funnelSteps.length - 1}
                    topCount={funnelTopCount}
                  />
                ))}
              </tbody>
            </table>

            {/* Rates summary strip */}
            <div className="border-t border-border bg-muted/50 px-5 py-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {[
                  { label: "Redirect rate", value: report.redirectRate },
                  { label: "Completion rate", value: report.completionRate },
                  { label: "Return rate", value: report.returnRate },
                  { label: "Activation rate", value: report.activationRate },
                  { label: "Paid activation rate", value: report.paidActivationRate },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-caption text-muted-foreground">{label}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${rateTone(value)}`}
                    >
                      {fmtPct(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Provider breakdown ───────────────────────────────────────────────── */}
      <section aria-label="Provider breakdown">
        <p className="mb-3 font-ui text-caption text-muted-foreground">
          Provider breakdown
        </p>
        {report.providerBreakdown.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-small text-muted-foreground">
            No completed purchases in this date range.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left font-ui text-caption text-muted-foreground">
                    Provider
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    Purchases
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    Share
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.providerBreakdown.map((row) => {
                  const sharePct =
                    totalProviderPurchases > 0
                      ? Math.round((row.purchaseCount / totalProviderPurchases) * 1000) / 10
                      : null;

                  return (
                    <tr
                      key={row.provider}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 font-medium text-foreground">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          {row.provider}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                        {fmt(row.purchaseCount)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-secondary-foreground">
                          {sharePct !== null ? `${sharePct}%` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                        {formatPrice(row.revenue / 100)}
                      </td>
                    </tr>
                  );
                })}

                {/* Revenue split rows */}
                {(report.platformFee > 0 || report.creatorShare > 0) && (
                  <>
                    <tr className="bg-muted/50">
                      <td
                        colSpan={4}
                        className="px-5 py-2 font-ui text-caption text-muted-foreground"
                      >
                        Revenue split (all providers)
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-2 text-muted-foreground">Platform fee</td>
                      <td colSpan={2} />
                      <td className="px-5 py-2 text-right tabular-nums text-foreground">
                        {formatPrice(report.platformFee / 100)}
                      </td>
                    </tr>
                    <tr className="transition-colors hover:bg-muted/50">
                      <td className="px-5 py-2 text-muted-foreground">Creator share</td>
                      <td colSpan={2} />
                      <td className="px-5 py-2 text-right tabular-nums text-foreground">
                        {formatPrice(report.creatorShare / 100)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Daily charts ─────────────────────────────────────────────────────── */}
      {report.dailySeries.length > 0 && (
        <section aria-label="Daily trends">
          <p className="mb-3 font-ui text-caption text-muted-foreground">
            Daily trends
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Paid completions */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground">
                Paid completions per day
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                Confirmed paid purchases by day of session.
              </p>
              <div className="mt-4">
                <SparkBar data={dailyPaidData} colorClass="bg-violet-400" />
              </div>
              <div className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
                <span>{dailyPaidData[0]?.date ?? ""}</span>
                <span>Total: {fmt(report.sessionsCompleted)}</span>
                <span>{dailyPaidData[dailyPaidData.length - 1]?.date ?? ""}</span>
              </div>
            </div>

            {/* Free claims */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-foreground">
                Free claims per day
              </p>
              <p className="mt-0.5 text-caption text-muted-foreground">
                Free resource adds by day.
              </p>
              <div className="mt-4">
                <SparkBar data={dailyFreeData} colorClass="bg-amber-400" />
              </div>
              <div className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
                <span>{dailyFreeData[0]?.date ?? ""}</span>
                <span>Total: {fmt(report.freeClaims)}</span>
                <span>{dailyFreeData[dailyFreeData.length - 1]?.date ?? ""}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Top resources ────────────────────────────────────────────────────── */}
      <section aria-label="Top resources">
        <p className="mb-3 font-ui text-caption text-muted-foreground">
          Top paid resources
        </p>
        {report.topResources.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-small text-muted-foreground">
            No paid purchases in this date range.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-5 py-3 text-left font-ui text-caption text-muted-foreground">
                    #
                  </th>
                  <th className="px-5 py-3 text-left font-ui text-caption text-muted-foreground">
                    Resource
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    Purchases
                  </th>
                  <th className="px-5 py-3 text-right font-ui text-caption text-muted-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.topResources.map((r, i) => (
                  <tr
                    key={r.resourceId}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="w-10 px-5 py-3 font-ui text-caption font-semibold tabular-nums text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={routes.resource(r.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground hover:text-primary-700 hover:underline"
                      >
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                      {fmt(r.purchaseCount)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">
                      {formatPrice(r.revenue / 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-4 text-caption text-muted-foreground">
        Generated at {report.generatedAt}
      </div>
        </>
      );
    },
  );
}
