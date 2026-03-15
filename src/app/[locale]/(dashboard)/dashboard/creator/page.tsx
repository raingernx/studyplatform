import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ElementType } from "react";
import {
  ArrowRight,
  BarChart2,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Package,
  Plus,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { formatDate, formatPrice, formatRelativeDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getCreatorAccessState, getCreatorOverview } from "@/services/creator.service";

export const metadata = {
  title: "Creator Dashboard – PaperDock",
};

export const dynamic = "force-dynamic";

function OverviewStatCard({
  label,
  value,
  hint,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ElementType;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
      <p className="mt-1 text-sm font-medium text-neutral-700">{label}</p>
      <p className="mt-1 text-xs text-neutral-400">{hint}</p>
    </div>
  );
}

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: ElementType;
}

export default async function CreatorDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const overview = await getCreatorOverview(session.user.id);

  const stats = [
    {
      label: "Total resources",
      value: overview.totals.totalResources,
      hint: `${overview.totals.publishedResources} published`,
      icon: FileText,
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total downloads",
      value: overview.totals.totalDownloads.toLocaleString(),
      hint: `${overview.totals.downloadsLast30Days.toLocaleString()} in the last 30 days`,
      icon: Download,
      colorClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total sales",
      value: overview.totals.totalSales.toLocaleString(),
      hint: "Completed purchases",
      icon: ShoppingBag,
      colorClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Gross revenue",
      value: formatPrice(overview.totals.grossRevenue / 100),
      hint: `${formatPrice(overview.totals.creatorShare / 100)} creator share`,
      icon: DollarSign,
      colorClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Published resources",
      value: overview.totals.publishedResources,
      hint: `${overview.totals.freeResources} free · ${overview.totals.paidResources} paid`,
      icon: Package,
      colorClass: "bg-sky-50 text-sky-600",
    },
    {
      label: "Platform fees",
      value: formatPrice(overview.totals.platformFees / 100),
      hint: "All-time marketplace fees",
      icon: BarChart2,
      colorClass: "bg-rose-50 text-rose-600",
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: routes.creatorResources,
      label: "Manage resources",
      description: "Update pricing, publishing, and previews.",
      icon: FileText,
    },
    {
      href: routes.creatorAnalytics,
      label: "Open analytics",
      description: "Review downloads, sales, and top performers.",
      icon: BarChart2,
    },
    {
      href: routes.creatorProfile,
      label: "Edit creator profile",
      description: "Update your slug, bio, banner, and links.",
      icon: Settings,
    },
  ];

  if (access.canCreate) {
    quickActions.unshift({
      href: routes.creatorNewResource,
      label: "Upload resource",
      description: "Create a new listing for the marketplace.",
      icon: Plus,
    });
  }

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
              Creator
            </p>
            <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
              Creator Dashboard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Monitor performance, recent activity, and the resources driving your revenue.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
            <p className="font-semibold">Creator share</p>
            <p className="mt-1 text-2xl font-bold text-blue-800">
              {formatPrice(overview.totals.creatorShare / 100)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <OverviewStatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Top-performing resources</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Ranked by revenue, with downloads as the tiebreaker.
                </p>
              </div>
              <Link
                href={routes.creatorResources}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View resources
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {overview.topResources.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Package className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-3 text-sm font-medium text-neutral-600">
                  No performance data yet
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  Publish resources and start driving downloads to populate this ranking.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      <th className="px-6 py-3">Resource</th>
                      <th className="px-4 py-3 text-right">Downloads</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-6 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {overview.topResources.map((resource, index) => (
                      <tr key={resource.id} className="hover:bg-neutral-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-500">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <Link
                                href={routes.resource(resource.slug)}
                                className="truncate font-medium text-neutral-900 hover:text-blue-600"
                              >
                                {resource.title}
                              </Link>
                              <p className="text-xs text-neutral-400">{resource.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-neutral-700">
                          {resource.downloadCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-neutral-700">
                          {resource.salesCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                          {formatPrice(resource.revenue / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
              <h2 className="text-sm font-semibold text-neutral-900">Quick actions</h2>
              <div className="mt-4 space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-start gap-3 rounded-xl border border-neutral-100 px-4 py-3 transition hover:border-neutral-200 hover:bg-neutral-50"
                    >
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-neutral-900">
                          {action.label}
                        </span>
                        <span className="mt-1 block text-xs text-neutral-500">
                          {action.description}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 text-neutral-300" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Recent sales</h2>
                <Link
                  href={routes.creatorSales}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              {overview.recentSales.length === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">No sales yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {overview.recentSales.slice(0, 4).map((sale) => (
                    <li key={sale.id} className="rounded-xl border border-neutral-100 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={routes.resource(sale.resourceSlug)}
                            className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                          >
                            {sale.resourceTitle}
                          </Link>
                          <p className="mt-1 text-xs text-neutral-500">
                            {sale.buyerName} · {formatRelativeDate(sale.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatPrice(sale.amount / 100)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Recent downloads</h2>
            </div>
            {overview.recentDownloads.length === 0 ? (
              <p className="px-6 py-10 text-sm text-neutral-500">No recent downloads yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {overview.recentDownloads.map((download) => (
                  <li
                    key={download.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={routes.resource(download.resourceSlug)}
                        className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                      >
                        {download.resourceTitle}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {download.userId ? `Buyer ${download.userId.slice(0, 8)}` : "Unknown user"} ·{" "}
                        {formatRelativeDate(download.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-neutral-400">
                      {formatDate(download.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
            <h2 className="text-sm font-semibold text-neutral-900">Earnings summary</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-neutral-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Gross</p>
                <p className="mt-2 text-lg font-semibold text-neutral-900">
                  {formatPrice(overview.totals.grossRevenue / 100)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-blue-500">Creator share</p>
                <p className="mt-2 text-lg font-semibold text-blue-800">
                  {formatPrice(overview.totals.creatorShare / 100)}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50 px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-rose-500">Fees</p>
                <p className="mt-2 text-lg font-semibold text-rose-700">
                  {formatPrice(overview.totals.platformFees / 100)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-4">
              <p className="text-sm font-medium text-neutral-700">
                Keep an eye on your revenue mix.
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {overview.totals.freeResources} free resources and {overview.totals.paidResources} paid
                resources are currently driving your traffic.
              </p>
              <Link
                href={routes.creatorAnalytics}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Open analytics
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
