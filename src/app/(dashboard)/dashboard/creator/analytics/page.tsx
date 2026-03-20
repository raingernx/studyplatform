import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BarChart2, DollarSign, Download, FileText, MessageSquare, ShoppingBag, Star } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getCreatorAccessState,
  getCreatorAnalytics,
  getCreatorReviewAnalytics,
} from "@/services/creator.service";

export const metadata = {
  title: "Creator Analytics",
};

export const dynamic = "force-dynamic";

type CreatorAnalyticsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function rangeLink(range: string, currentRange: string) {
  const active = range === currentRange;

  return `inline-flex rounded-full px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "bg-neutral-900 text-white"
      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
  }`;
}

export default async function CreatorAnalyticsPage({
  searchParams,
}: CreatorAnalyticsPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/analytics");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rangeParam = firstValue(resolvedSearchParams.range);
  const range =
    rangeParam === "7d" || rangeParam === "30d" || rangeParam === "90d" || rangeParam === "all"
      ? rangeParam
      : "30d";

  const [analytics, reviewAnalytics] = await Promise.all([
    getCreatorAnalytics(session.user.id, range),
    getCreatorReviewAnalytics(session.user.id),
  ]);

  const seriesRows = Array.from(
    new Set([
      ...analytics.revenueSeries.map((row) => row.date),
      ...analytics.salesSeries.map((row) => row.date),
      ...analytics.downloadSeries.map((row) => row.date),
    ]),
  )
    .sort()
    .map((date) => ({
      date,
      revenue: analytics.revenueSeries.find((row) => row.date === date)?.value ?? 0,
      sales: analytics.salesSeries.find((row) => row.date === date)?.value ?? 0,
      downloads: analytics.downloadSeries.find((row) => row.date === date)?.value ?? 0,
    }));

  const summaryCards = [
    {
      label: "Gross revenue",
      value: formatPrice(analytics.summary.grossRevenue / 100),
      icon: DollarSign,
      colorClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Creator share",
      value: formatPrice(analytics.summary.creatorShare / 100),
      icon: BarChart2,
      colorClass: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total sales",
      value: analytics.summary.totalSales.toLocaleString(),
      icon: ShoppingBag,
      colorClass: "bg-violet-50 text-violet-600",
    },
    {
      label: "Total downloads",
      value: analytics.summary.totalDownloads.toLocaleString(),
      icon: Download,
      colorClass: "bg-emerald-50 text-emerald-600",
    },
  ];
  const reviewSummaryCards = [
    {
      label: "Average rating",
      value: reviewAnalytics.overview.averageRating?.toFixed(1) ?? "—",
      icon: Star,
      colorClass: "bg-amber-50 text-amber-600",
      description: "Visible marketplace rating across your owned resources.",
    },
    {
      label: "Visible reviews",
      value: reviewAnalytics.overview.totalVisibleReviews.toLocaleString(),
      icon: MessageSquare,
      colorClass: "bg-blue-50 text-blue-600",
      description: "Public reviews that remain visible after moderation.",
    },
    {
      label: "Resources with reviews",
      value: reviewAnalytics.overview.resourcesWithVisibleReviews.toLocaleString(),
      icon: FileText,
      colorClass: "bg-violet-50 text-violet-600",
      description: "Owned resources with at least one visible marketplace review.",
    },
  ];

  return (
    <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
              Creator
            </p>
            <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
              Analytics
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Revenue, downloads, and top-performing resources for your creator business.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["7d", "30d", "90d", "all"] as const).map((value) => (
              <Link
                key={value}
                href={`${routes.creatorAnalytics}?range=${value}`}
                className={rangeLink(value, analytics.range)}
              >
                {value === "all" ? "All time" : value.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-700">{card.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reviewSummaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-700">{card.label}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">{card.description}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Performance over time</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Daily rollup for revenue, sales, and downloads in the selected range.
              </p>
            </div>

            {seriesRows.length === 0 ? (
              <p className="px-6 py-12 text-sm text-neutral-500">No analytics data in this range.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                      <th className="px-4 py-3 text-right">Sales</th>
                      <th className="px-6 py-3 text-right">Downloads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {seriesRows.map((row) => (
                      <tr key={row.date}>
                        <td className="px-6 py-4 font-medium text-neutral-900">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-700">
                          {formatPrice(row.revenue / 100)}
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-700">{row.sales}</td>
                        <td className="px-6 py-4 text-right text-neutral-700">{row.downloads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-6">
            {[
              {
                title: "Top by revenue",
                resources: analytics.topByRevenue,
                metricLabel: "Revenue",
                renderMetric: (value: typeof analytics.topByRevenue[number]) =>
                  formatPrice(value.revenue / 100),
              },
              {
                title: "Top by downloads",
                resources: analytics.topByDownloads,
                metricLabel: "Downloads",
                renderMetric: (value: typeof analytics.topByDownloads[number]) =>
                  value.downloadCount.toLocaleString(),
              },
              {
                title: "Top by purchases",
                resources: analytics.topByPurchases,
                metricLabel: "Sales",
                renderMetric: (value: typeof analytics.topByPurchases[number]) =>
                  value.salesCount.toLocaleString(),
              },
            ].map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">{section.title}</h2>
                  <span className="text-xs uppercase tracking-wide text-neutral-400">
                    {section.metricLabel}
                  </span>
                </div>

                {section.resources.length === 0 ? (
                  <p className="mt-4 text-sm text-neutral-500">No resources yet.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {section.resources.map((resource) => (
                      <li key={`${section.title}-${resource.id}`}>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3">
                          <div className="min-w-0">
                            <Link
                              href={routes.resource(resource.slug)}
                              className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                            >
                              {resource.title}
                            </Link>
                            <p className="mt-1 text-xs text-neutral-400">{resource.slug}</p>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900">
                            {section.renderMetric(resource)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card xl:col-span-2">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Resource ratings</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Visible marketplace review performance across the resources you own.
              </p>
            </div>

            {reviewAnalytics.resources.length === 0 ? (
              <p className="px-6 py-12 text-sm text-neutral-500">
                No owned resources are available for review analytics yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      <th className="px-6 py-3">Resource</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                      <th className="px-4 py-3 text-right">Visible reviews</th>
                      <th className="px-4 py-3 text-right">Last review</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {reviewAnalytics.resources.map((resource) => (
                      <tr key={resource.resourceId}>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <Link
                              href={routes.resource(resource.slug)}
                              className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                            >
                              {resource.title}
                            </Link>
                            <p className="mt-1 text-xs text-neutral-400">
                              {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-700">
                          {resource.averageRating?.toFixed(1) ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-700">
                          {resource.visibleReviewCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-neutral-700">
                          {resource.lastReviewDate ? formatDate(resource.lastReviewDate) : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              resource.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-700"
                                : resource.status === "ARCHIVED"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {resource.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Recent visible reviews</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Latest public marketplace feedback for resources you own.
              </p>
            </div>

            {reviewAnalytics.recentReviews.length === 0 ? (
              <p className="px-6 py-12 text-sm text-neutral-500">
                No visible reviews yet.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {reviewAnalytics.recentReviews.map((review) => (
                  <li key={review.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={routes.resource(review.resourceSlug)}
                          className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                        >
                          {review.resourceTitle}
                        </Link>
                        <p className="mt-1 text-xs text-neutral-500">
                          {review.reviewerName} · {formatDate(review.createdAt)}
                        </p>
                        {review.body ? (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                            {review.body}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-400">No written comment.</p>
                        )}
                      </div>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {review.rating}/5
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Rating distribution</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Visible review counts by star rating across your resources.
              </p>
            </div>

            {reviewAnalytics.distribution.every((row) => row.count === 0) ? (
              <p className="px-6 py-12 text-sm text-neutral-500">
                Ratings will appear here once visible reviews are available.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    reviewAnalytics.distribution.find((row) => row.rating === rating)?.count ?? 0;

                  return (
                    <li
                      key={rating}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {rating} star{rating === 1 ? "" : "s"}
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">
                        {count.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Recent sales activity</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Latest completed creator revenue events across your resources.
              </p>
            </div>

            {analytics.recentSales.length === 0 ? (
              <p className="px-6 py-12 text-sm text-neutral-500">No recent sales yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {analytics.recentSales.map((sale) => (
                  <li key={sale.id} className="flex items-start justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <Link
                        href={routes.resource(sale.resourceSlug)}
                        className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                      >
                        {sale.resourceTitle}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {sale.buyerName} · {sale.status} · {formatDate(sale.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatPrice(sale.amount / 100)}
                      </p>
                      <p className="mt-1 text-xs text-blue-600">
                        Share {formatPrice(sale.creatorShare / 100)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-100 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-sm font-semibold text-neutral-900">Recent download activity</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Latest downloads across the resources you publish.
              </p>
            </div>

            {analytics.recentDownloads.length === 0 ? (
              <p className="px-6 py-12 text-sm text-neutral-500">No recent downloads yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-50">
                {analytics.recentDownloads.map((download) => (
                  <li key={download.id} className="flex items-start justify-between gap-4 px-6 py-4">
                    <div className="min-w-0">
                      <Link
                        href={routes.resource(download.resourceSlug)}
                        className="truncate text-sm font-medium text-neutral-900 hover:text-blue-600"
                      >
                        {download.resourceTitle}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">
                        {download.userId ? `User ${download.userId.slice(0, 8)}` : "Anonymous user"} ·{" "}
                        {formatDate(download.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Download
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Next action</h2>
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            Use these numbers to decide which resources to promote, publish, or refresh first.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={routes.creatorResources}
              className="inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Manage resources
            </Link>
            <Link
              href={routes.creatorSales}
              className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Review sales
            </Link>
          </div>
        </div>
    </div>
  );
}
