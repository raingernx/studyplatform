import { Suspense } from "react";
import Link from "next/link";
import {
  getPlatformMetricsSummary,
  getPlatformMetricsReporting,
  type PlatformMetricsReporting,
  type PlatformMetricsSummary,
} from "@/services/analytics";
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
import { AdminAnalyticsReportingSkeleton } from "@/components/skeletons/AdminAnalyticsRouteSkeletons";

export const metadata = {
  title: "Analytics – Admin",
  description: "Marketplace analytics and trends.",
};

export const dynamic = "force-dynamic";

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

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="rounded-xl p-4">
      <div className="flex items-start justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-small text-muted-foreground">{label}</p>
      {sub ? <p className="mt-1 text-caption text-muted-foreground">{sub}</p> : null}
    </Card>
  );
}

async function ReportingSection({
  summary,
  reportingPromise,
}: {
  summary: PlatformMetricsSummary;
  reportingPromise: Promise<PlatformMetricsReporting>;
}) {
  const reporting = await reportingPromise;

  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="font-display text-h3 font-semibold text-foreground">
          Reporting
        </h2>
        <p className="mt-1 text-small text-muted-foreground">
          Trend snapshots and top-performing resources.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Downloads (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              One bar per day — based on DownloadEvent rows.
            </p>
          </div>
          <SparkBar data={reporting.dailyDownloads} />
          <div className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
            <span>{reporting.dailyDownloads[0]?.date ?? ""}</span>
            <span>Total: {formatNumber(summary.downloadsLast30Days)} downloads</span>
            <span>{reporting.dailyDownloads[reporting.dailyDownloads.length - 1]?.date ?? ""}</span>
          </div>
        </Card>

        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Revenue (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              Sum of completed purchase amounts per day.
            </p>
          </div>
          <SparkBar data={reporting.dailyRevenue} />
          <div className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
            <span>{reporting.dailyRevenue[0]?.date ?? ""}</span>
            <span>Total: {formatPrice(summary.reveneuLast30Days / 100)}</span>
            <span>{reporting.dailyRevenue[reporting.dailyRevenue.length - 1]?.date ?? ""}</span>
          </div>
        </Card>

        <Card className="rounded-xl p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              New users (last 30 days)
            </h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              User registrations per day.
            </p>
          </div>
          <SparkBar data={reporting.dailyNewUsers} />
          <div className="mt-2 flex items-center justify-between text-caption text-muted-foreground">
            <span>{reporting.dailyNewUsers[0]?.date ?? ""}</span>
            <span>Total: {formatNumber(summary.newUsersLast30Days)} signups</span>
            <span>{reporting.dailyNewUsers[reporting.dailyNewUsers.length - 1]?.date ?? ""}</span>
          </div>
        </Card>

        <Card className="rounded-xl p-4">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Top resources
            </h2>
          </div>

          {reporting.topResources.length === 0 ? (
            <p className="text-small text-muted-foreground">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {reporting.topResources.map((resource, index) => (
                <li key={resource.id} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-caption font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <Link
                    href={routes.resource(resource.slug)}
                    className="min-w-0 flex-1 truncate text-small font-medium text-foreground hover:text-primary-700 hover:underline"
                  >
                    {resource.title}
                  </Link>
                  <span className="flex-shrink-0 text-caption text-muted-foreground">
                    {formatNumber(resource.downloadCount)} dl
                  </span>
                  <span className="flex-shrink-0 text-caption text-muted-foreground">
                    {formatPrice(resource.revenue / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  return withRequestPerformanceTrace(
    "route:/admin/analytics",
    {
      routeKind: "overview",
    },
    async () => {
      const summaryPromise = traceServerStep(
        "admin_analytics.getPlatformMetricsSummary",
        () => getPlatformMetricsSummary(),
      );
      const reportingPromise = traceServerStep(
        "admin_analytics.getPlatformMetricsReporting",
        () => getPlatformMetricsReporting(),
      );

      const summary = await summaryPromise;

      return (
        <div data-route-shell-ready="admin-analytics" className="space-y-5">
          <AdminPageHeader
            title="Analytics"
            description="High-level metrics and trends for your marketplace."
          />

          <section className="space-y-2.5">
            <div>
              <h2 className="font-display text-h3 font-semibold text-foreground">
                All-time metrics
              </h2>
              <p className="mt-1 text-small text-muted-foreground">
                Core marketplace totals across revenue, usage, and catalog growth.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard
                label="Total revenue"
                value={formatPrice(summary.totalRevenue / 100)}
                icon={DollarSign}
                colorClass="bg-muted text-success-700"
              />
              <StatCard
                label="Total downloads"
                value={formatNumber(summary.totalDownloads)}
                icon={Download}
                colorClass="bg-muted text-info-700"
              />
              <StatCard
                label="Total purchases"
                value={formatNumber(summary.totalPurchases)}
                icon={TrendingUp}
                colorClass="bg-muted text-primary-700"
              />
              <StatCard
                label="Total users"
                value={formatNumber(summary.totalUsers)}
                icon={Users}
                colorClass="bg-muted text-warning-700"
              />
              <StatCard
                label="Total resources"
                value={formatNumber(summary.totalResources)}
                icon={Package}
                colorClass="bg-muted text-muted-foreground"
              />
            </div>
          </section>

          <section className="space-y-2.5">
            <div>
              <h2 className="font-display text-h3 font-semibold text-foreground">
                Last 30 days
              </h2>
              <p className="mt-1 text-small text-muted-foreground">
                Recent movement in demand, signups, and catalog activity.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Downloads"
                value={formatNumber(summary.downloadsLast30Days)}
                sub="vs all-time"
                icon={Download}
                colorClass="bg-muted text-info-700"
              />
              <StatCard
                label="Revenue"
                value={formatPrice(summary.reveneuLast30Days / 100)}
                icon={DollarSign}
                colorClass="bg-muted text-success-700"
              />
              <StatCard
                label="New users"
                value={formatNumber(summary.newUsersLast30Days)}
                icon={Users}
                colorClass="bg-muted text-warning-700"
              />
              <StatCard
                label="New resources"
                value={formatNumber(summary.newResourcesLast30Days)}
                icon={Package}
                colorClass="bg-muted text-primary-700"
              />
            </div>
          </section>

          <Suspense fallback={<AdminAnalyticsReportingSkeleton />}>
            <ReportingSection summary={summary} reportingPromise={reportingPromise} />
          </Suspense>

          <section className="space-y-2.5">
            <div>
              <h2 className="font-display text-h3 font-semibold text-foreground">
                Experiments
              </h2>
              <p className="mt-1 text-small text-muted-foreground">
                Debug views and funnel reports for recommendation, ranking, and purchase behavior.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <Link
                href={routes.adminRecommendationReport}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Card className="rounded-xl p-4 transition-colors group-hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary-700">
                      <FlaskConical className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Recommendation Experiment
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    Phase 1 vs Phase 2 · CTR, clicks, purchases
                  </p>
                </Card>
              </Link>

              <Link
                href={routes.adminCreatorActivation}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Card className="rounded-xl p-4 transition-colors group-hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-success-700">
                      <Rocket className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Creator Activation Funnel
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    First-run view → click → draft → published
                  </p>
                </Card>
              </Link>

              <Link
                href={routes.adminPurchasesAnalytics}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Card className="rounded-xl p-4 transition-colors group-hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary-700">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Purchase Funnel
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    Sessions started → completed · free claims · revenue
                  </p>
                </Card>
              </Link>

              <Link
                href={routes.adminRankingDebug}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Card className="rounded-xl p-4 transition-colors group-hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-info-700">
                      <SlidersHorizontal className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Ranking Debug
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    Score breakdown · purchases · activation · recency
                  </p>
                </Card>
              </Link>

              <Link
                href={routes.adminRankingExperiment}
                className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Card className="rounded-xl p-4 transition-colors group-hover:bg-muted">
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-info-700">
                      <BarChart2 className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Ranking Experiment
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">
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
