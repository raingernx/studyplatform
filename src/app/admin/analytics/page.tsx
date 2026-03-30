import Link from "next/link";
import { getPlatformMetrics } from "@/services/analytics.service";
import { Card } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatPrice, formatNumber } from "@/lib/format";
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart2,
  FlaskConical,
  Rocket,
  ShoppingCart,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Analytics – Admin",
  description: "Marketplace analytics and trends.",
};

export const dynamic = "force-dynamic";

// ── Spark bar ─────────────────────────────────────────────────────────────────

/**
 * A minimal inline bar chart rendered in pure CSS/HTML (no client JS).
 * Each bar height is proportional to the max value in the series.
 */
function SparkBar({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-14 items-end gap-px">
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.value}`}
            className="flex-1 rounded-t bg-blue-400 opacity-70 transition-opacity hover:opacity-100"
            style={{ height: `${Math.max(pct, 2)}%` }}
          />
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
  colorClass,
}: {
  label:      string;
  value:      string | number;
  sub?:       string;
  icon:       React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="rounded-xl p-4">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-text-primary">
        {value}
      </p>
      <p className="mt-0.5 text-small text-text-secondary">{label}</p>
      {sub && <p className="mt-1 text-caption text-text-muted">{sub}</p>}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  return withRequestPerformanceTrace(
    "route:/admin/analytics",
    {
      routeKind: "overview",
    },
    async () => {
      await traceServerStep(
        "admin_analytics.requireAdminSession",
        () => requireAdminSession(routes.adminAnalytics),
      );

      const metrics = await traceServerStep(
        "admin_analytics.getPlatformMetrics",
        () => getPlatformMetrics(),
      );

      return (
        <div className="space-y-5">
      <AdminPageHeader
        title="Analytics"
        description="High-level metrics and trends for your marketplace."
      />

      <section className="space-y-2.5">
        <div>
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            All-time metrics
          </h2>
          <p className="mt-1 text-small text-text-secondary">
            Core marketplace totals across revenue, usage, and catalog growth.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard
            label="Total revenue"
            value={formatPrice(metrics.totalRevenue / 100)}
            icon={DollarSign}
            colorClass="bg-surface-100 text-success-700"
          />
          <StatCard
            label="Total downloads"
            value={formatNumber(metrics.totalDownloads)}
            icon={Download}
            colorClass="bg-surface-100 text-info-700"
          />
          <StatCard
            label="Total purchases"
            value={formatNumber(metrics.totalPurchases)}
            icon={TrendingUp}
            colorClass="bg-surface-100 text-primary-700"
          />
          <StatCard
            label="Total users"
            value={formatNumber(metrics.totalUsers)}
            icon={Users}
            colorClass="bg-surface-100 text-warning-700"
          />
          <StatCard
            label="Total resources"
            value={formatNumber(metrics.totalResources)}
            icon={Package}
            colorClass="bg-surface-100 text-text-secondary"
          />
        </div>
      </section>

      <section className="space-y-2.5">
        <div>
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            Last 30 days
          </h2>
          <p className="mt-1 text-small text-text-secondary">
            Recent movement in demand, signups, and catalog activity.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Downloads"
            value={formatNumber(metrics.downloadsLast30Days)}
            sub="vs all-time"
            icon={Download}
            colorClass="bg-surface-100 text-info-700"
          />
          <StatCard
            label="Revenue"
            value={formatPrice(metrics.reveneuLast30Days / 100)}
            icon={DollarSign}
            colorClass="bg-surface-100 text-success-700"
          />
          <StatCard
            label="New users"
            value={formatNumber(metrics.newUsersLast30Days)}
            icon={Users}
            colorClass="bg-surface-100 text-warning-700"
          />
          <StatCard
            label="New resources"
            value={formatNumber(metrics.newResourcesLast30Days)}
            icon={Package}
            colorClass="bg-surface-100 text-primary-700"
          />
        </div>
      </section>

      <section className="space-y-2.5">
        <div>
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            Reporting
          </h2>
          <p className="mt-1 text-small text-text-secondary">
            Trend snapshots and top-performing resources.
          </p>
        </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {/* Daily downloads */}
        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Downloads (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-text-muted">
              One bar per day — based on DownloadEvent rows.
            </p>
          </div>
          <SparkBar data={metrics.dailyDownloads} />
          <div className="mt-2 flex items-center justify-between text-caption text-text-muted">
            <span>{metrics.dailyDownloads[0]?.date ?? ""}</span>
            <span>
              Total: {formatNumber(metrics.downloadsLast30Days)} downloads
            </span>
            <span>
              {metrics.dailyDownloads[metrics.dailyDownloads.length - 1]?.date ?? ""}
            </span>
          </div>
        </Card>

        {/* Daily revenue */}
        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Revenue (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-text-muted">
              Sum of completed purchase amounts per day.
            </p>
          </div>
          <SparkBar
            data={metrics.dailyRevenue.map((d) => ({
              date:  d.date,
              // Scale satang → baht for bar proportions (value is display-only via tooltip)
              value: d.value,
            }))}
          />
          <div className="mt-2 flex items-center justify-between text-caption text-text-muted">
            <span>{metrics.dailyRevenue[0]?.date ?? ""}</span>
            <span>
              Total: {formatPrice(metrics.reveneuLast30Days / 100)}
            </span>
            <span>
              {metrics.dailyRevenue[metrics.dailyRevenue.length - 1]?.date ?? ""}
            </span>
          </div>
        </Card>

        {/* New users */}
        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              New users (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-text-muted">
              User registrations per day.
            </p>
          </div>
          <SparkBar data={metrics.dailyNewUsers} />
          <div className="mt-2 flex items-center justify-between text-caption text-text-muted">
            <span>{metrics.dailyNewUsers[0]?.date ?? ""}</span>
            <span>Total: {formatNumber(metrics.newUsersLast30Days)} signups</span>
            <span>
              {metrics.dailyNewUsers[metrics.dailyNewUsers.length - 1]?.date ?? ""}
            </span>
          </div>
        </Card>

        {/* Top resources */}
        <Card className="rounded-xl p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">
              Top resources
            </h2>
          </div>

          {metrics.topResources.length === 0 ? (
            <p className="text-small text-text-muted">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.topResources.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-caption font-semibold text-text-muted">
                    {i + 1}
                  </span>
                  <Link
                    href={routes.resource(r.slug)}
                    className="min-w-0 flex-1 truncate text-small font-medium text-text-primary hover:text-primary-700 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="flex-shrink-0 text-caption text-text-muted">
                    {formatNumber(r.downloadCount)} dl
                  </span>
                  <span className="flex-shrink-0 text-caption text-text-muted">
                    {formatPrice(r.revenue / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      </section>

      <section className="space-y-2.5">
        <div>
          <h2 className="font-display text-h3 font-semibold text-text-primary">
            Experiments
          </h2>
          <p className="mt-1 text-small text-text-secondary">
            Debug views and funnel reports for recommendation, ranking, and purchase behavior.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <Link
            href={routes.adminRecommendationReport}
            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Card className="rounded-xl p-4 transition-colors group-hover:bg-surface-50">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-primary-700">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Recommendation Experiment
              </p>
              <p className="mt-0.5 text-caption text-text-secondary">
                Phase 1 vs Phase 2 · CTR, clicks, purchases
              </p>
            </Card>
          </Link>

          <Link
            href={routes.adminCreatorActivation}
            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Card className="rounded-xl p-4 transition-colors group-hover:bg-surface-50">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-success-700">
                  <Rocket className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Creator Activation Funnel
              </p>
              <p className="mt-0.5 text-caption text-text-secondary">
                First-run view → click → draft → published
              </p>
            </Card>
          </Link>

          <Link
            href={routes.adminPurchasesAnalytics}
            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Card className="rounded-xl p-4 transition-colors group-hover:bg-surface-50">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-primary-700">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Purchase Funnel
              </p>
              <p className="mt-0.5 text-caption text-text-secondary">
                Sessions started → completed · free claims · revenue
              </p>
            </Card>
          </Link>

          <Link
            href={routes.adminRankingDebug}
            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Card className="rounded-xl p-4 transition-colors group-hover:bg-surface-50">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-info-700">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Ranking Debug
              </p>
              <p className="mt-0.5 text-caption text-text-secondary">
                Score breakdown · purchases · activation · recency
              </p>
            </Card>
          </Link>

          <Link
            href={routes.adminRankingExperiment}
            className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Card className="rounded-xl p-4 transition-colors group-hover:bg-surface-50">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-info-700">
                  <BarChart2 className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Ranking Experiment
              </p>
              <p className="mt-0.5 text-caption text-text-secondary">
                A vs B · checkout starts · conversion · paid activation
              </p>
            </Card>
          </Link>
        </div>
      </section>
        </div>
      );
    },
  );
}
