import Link from "next/link";
import { getPlatformMetrics } from "@/services/analytics.service";
import { Card } from "@/design-system";
import { formatPrice, formatNumber } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart2,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

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
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-text-secondary">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-text-muted">{sub}</p>}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  await requireAdminSession(routes.adminAnalytics);

  const metrics = await getPlatformMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
          Analytics
        </h1>
        <p className="mt-1 text-meta text-text-secondary">
          High-level metrics and trends for your marketplace.
        </p>
      </div>

      {/* ── All-time stats ───────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          All time
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard
            label="Total revenue"
            value={formatPrice(metrics.totalRevenue / 100)}
            icon={DollarSign}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Total downloads"
            value={formatNumber(metrics.totalDownloads)}
            icon={Download}
            colorClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Total purchases"
            value={formatNumber(metrics.totalPurchases)}
            icon={TrendingUp}
            colorClass="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Total users"
            value={formatNumber(metrics.totalUsers)}
            icon={Users}
            colorClass="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="Total resources"
            value={formatNumber(metrics.totalResources)}
            icon={Package}
            colorClass="bg-neutral-50 text-neutral-500"
          />
        </div>
      </div>

      {/* ── Last 30 days ─────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Last 30 days
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Downloads"
            value={formatNumber(metrics.downloadsLast30Days)}
            sub="vs all-time"
            icon={Download}
            colorClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Revenue"
            value={formatPrice(metrics.reveneuLast30Days / 100)}
            icon={DollarSign}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="New users"
            value={formatNumber(metrics.newUsersLast30Days)}
            icon={Users}
            colorClass="bg-amber-50 text-amber-600"
          />
          <StatCard
            label="New resources"
            value={formatNumber(metrics.newResourcesLast30Days)}
            icon={Package}
            colorClass="bg-violet-50 text-violet-600"
          />
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily downloads */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Downloads (last 30 days)
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              One bar per day — based on DownloadEvent rows.
            </p>
          </div>
          <SparkBar data={metrics.dailyDownloads} />
          <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
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
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              Revenue (last 30 days)
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
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
          <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
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
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">
              New users (last 30 days)
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              User registrations per day.
            </p>
          </div>
          <SparkBar data={metrics.dailyNewUsers} />
          <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
            <span>{metrics.dailyNewUsers[0]?.date ?? ""}</span>
            <span>Total: {formatNumber(metrics.newUsersLast30Days)} signups</span>
            <span>
              {metrics.dailyNewUsers[metrics.dailyNewUsers.length - 1]?.date ?? ""}
            </span>
          </div>
        </Card>

        {/* Top resources */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">
              Top resources
            </h2>
          </div>

          {metrics.topResources.length === 0 ? (
            <p className="text-xs text-text-muted">No data yet.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.topResources.map((r, i) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-text-muted">
                    {i + 1}
                  </span>
                  <Link
                    href={routes.resource(r.slug)}
                    className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary hover:text-blue-600 hover:underline"
                  >
                    {r.title}
                  </Link>
                  <span className="flex-shrink-0 text-[11px] text-text-muted">
                    {formatNumber(r.downloadCount)} dl
                  </span>
                  <span className="flex-shrink-0 text-[11px] text-text-muted">
                    {formatPrice(r.revenue / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Experiments ───────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          Experiments
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href={routes.adminRecommendationReport}
            className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
          >
            <Card className="p-5 transition-shadow group-hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <FlaskConical className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 text-sm font-semibold text-text-primary">
                Recommendation Experiment
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Phase 1 vs Phase 2 · CTR, clicks, purchases
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
