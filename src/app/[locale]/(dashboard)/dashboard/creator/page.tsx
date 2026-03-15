import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getCreatorMetrics } from "@/services/creator.service";
import { formatPrice } from "@/lib/format";
import {
  Download,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart2,
  ArrowRight,
  Package,
} from "lucide-react";

export const metadata = {
  title: "Creator Dashboard – PaperDock",
};

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-medium text-neutral-500">{label}</p>
      {sub && <p className="mt-1 text-[11px] text-neutral-400">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CreatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?next=/dashboard/creator");

  const metrics = await getCreatorMetrics(session.user.id);

  const hasResources = metrics.publishedCount + metrics.draftCount > 0;

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-neutral-900">
            Creator Dashboard
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Performance metrics for your uploaded resources.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Downloads"
            value={metrics.totalDownloads.toLocaleString()}
            sub={`${metrics.downloadsLast30Days.toLocaleString()} in last 30 days`}
            icon={Download}
            colorClass="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Total Sales"
            value={metrics.totalSales.toLocaleString()}
            sub="Completed purchases"
            icon={TrendingUp}
            colorClass="bg-violet-50 text-violet-600"
          />
          <StatCard
            label="Revenue"
            value={formatPrice(metrics.revenue / 100)}
            sub="All-time earnings"
            icon={DollarSign}
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Published"
            value={metrics.publishedCount}
            sub={`${metrics.draftCount} draft${metrics.draftCount !== 1 ? "s" : ""}`}
            icon={FileText}
            colorClass="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Top resources + quick links */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Top resources table */}
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Top resources
                </h2>
              </div>
              <Link
                href="/dashboard/resources"
                className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {metrics.topResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Package className="h-8 w-8 text-neutral-300" />
                <p className="mt-3 text-[13px] font-medium text-neutral-500">
                  No resources yet
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Your published resources will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-50 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                      <th className="px-6 py-3">Resource</th>
                      <th className="px-4 py-3 text-right">Downloads</th>
                      <th className="px-6 py-3 text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {metrics.topResources.map((r, i) => (
                      <tr key={r.id} className="group hover:bg-neutral-50/60">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-bold text-neutral-500">
                              {i + 1}
                            </span>
                            <Link
                              href={`/resources/${r.slug}`}
                              className="truncate font-medium text-neutral-900 hover:text-blue-600 hover:underline"
                            >
                              {r.title}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-700">
                          {r.downloadCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-neutral-700">
                          {r.salesCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Quick links
            </p>
            <div className="mt-3 space-y-1">
              {[
                {
                  href:  "/dashboard/resources",
                  label: "All my resources",
                  icon:  Package,
                  badge: metrics.publishedCount + metrics.draftCount,
                },
                {
                  href:  "/resources",
                  label: "View marketplace",
                  icon:  TrendingUp,
                  badge: null,
                },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      {link.label}
                    </div>
                    {link.badge !== null && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* 30-day trend callout */}
            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">
                Last 30 days
              </p>
              <p className="mt-1 text-xl font-bold text-blue-700">
                {metrics.downloadsLast30Days.toLocaleString()}
              </p>
              <p className="text-[12px] text-blue-500">downloads</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
