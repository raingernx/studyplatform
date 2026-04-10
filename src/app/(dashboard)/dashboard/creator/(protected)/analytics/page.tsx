import Link from "next/link";
import { BarChart2, DollarSign, Download, FileText, MessageSquare, ShoppingBag, Star } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/design-system";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import {
  getCreatorAnalytics,
  getCreatorReviewAnalytics,
} from "@/services/creator";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { getCreatorProtectedUserContext } from "../creatorProtectedUser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  DashboardPageShell,
  DashboardPageStack,
} from "@/components/dashboard/DashboardPageShell";

export const metadata = {
  title: "Creator Analytics",
};

export const dynamic = "force-dynamic";

const PANEL_CLASS = "rounded-2xl border border-border bg-card shadow-card";
const PANEL_HEADER_CLASS = "border-b border-border/70 px-6 py-4";
const PANEL_TITLE_CLASS = "text-sm font-semibold text-foreground";
const PANEL_DESCRIPTION_CLASS = "mt-1 text-xs text-muted-foreground";
const TABLE_HEAD_CLASS =
  "border-b border-border/70 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const TABLE_BODY_CLASS = "divide-y divide-border/60";

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
      ? "bg-foreground text-background"
      : "border border-border bg-card text-muted-foreground hover:bg-muted"
  }`;
}

export default async function CreatorAnalyticsPage({
  searchParams,
}: CreatorAnalyticsPageProps) {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorAnalytics);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const rangeParam = firstValue(resolvedSearchParams.range);
  const range =
    rangeParam === "7d" || rangeParam === "30d" || rangeParam === "90d" || rangeParam === "all"
      ? rangeParam
      : "30d";

  const [analytics, reviewAnalytics] = await Promise.all([
    getCreatorAnalytics(userId, range),
    getCreatorReviewAnalytics(userId),
  ]);

  return (
    <DashboardPageShell routeReady="dashboard-creator-analytics">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Analytics"
        description="Revenue, downloads, and top-performing resources for your creator business."
        actions={
          <div className="flex flex-wrap gap-2">
            {(["7d", "30d", "90d", "all"] as const).map((value) => (
              <Link
                key={value}
                href={`${routes.creatorAnalytics}?range=${value}`}
                className={rangeLink(value, range)}
              >
                {value === "all" ? "All time" : value.toUpperCase()}
              </Link>
            ))}
          </div>
        }
      />

      <CreatorAnalyticsResults
        analytics={analytics}
        reviewAnalytics={reviewAnalytics}
      />
    </DashboardPageShell>
  );
}

function CreatorAnalyticsResults({
  analytics,
  reviewAnalytics,
}: {
  analytics: Awaited<ReturnType<typeof getCreatorAnalytics>>;
  reviewAnalytics: Awaited<ReturnType<typeof getCreatorReviewAnalytics>>;
}) {
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
      colorClass: "bg-muted text-warning-700",
    },
    {
      label: "Creator share",
      value: formatPrice(analytics.summary.creatorShare / 100),
      icon: BarChart2,
      colorClass: "bg-muted text-info-700",
    },
    {
      label: "Total sales",
      value: analytics.summary.totalSales.toLocaleString(),
      icon: ShoppingBag,
      colorClass: "bg-muted text-primary-700",
    },
    {
      label: "Total downloads",
      value: analytics.summary.totalDownloads.toLocaleString(),
      icon: Download,
      colorClass: "bg-muted text-success-700",
    },
  ];
  const reviewSummaryCards = [
    {
      label: "Average rating",
      value: reviewAnalytics.overview.averageRating?.toFixed(1) ?? "—",
      icon: Star,
      colorClass: "bg-muted text-warning-700",
      description: "Visible marketplace rating across your owned resources.",
    },
    {
      label: "Visible reviews",
      value: reviewAnalytics.overview.totalVisibleReviews.toLocaleString(),
      icon: MessageSquare,
      colorClass: "bg-muted text-info-700",
      description: "Public reviews that remain visible after moderation.",
    },
    {
      label: "Resources with reviews",
      value: reviewAnalytics.overview.resourcesWithVisibleReviews.toLocaleString(),
      icon: FileText,
      colorClass: "bg-muted text-primary-700",
      description: "Owned resources with at least one visible marketplace review.",
    },
  ];

  return (
    <DashboardPageStack>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reviewSummaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-5">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.colorClass}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Performance over time</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
                Daily rollup for revenue, sales, and downloads in the selected range.
            </p>
          </div>

          {seriesRows.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">No analytics data in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={TABLE_HEAD_CLASS}>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Sales</th>
                    <th className="px-6 py-3 text-right">Downloads</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASS}>
                  {seriesRows.map((row) => (
                    <tr key={row.date}>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {formatPrice(row.revenue / 100)}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">{row.sales}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground">{row.downloads}</td>
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
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {section.metricLabel}
                </span>
              </div>

              {section.resources.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">No resources yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {section.resources.map((resource) => (
                    <li key={`${section.title}-${resource.id}`}>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-4 py-3">
                        <div className="min-w-0">
                          <ResourceIntentLink
                            href={routes.resource(resource.slug)}
                            className="truncate text-sm font-medium text-foreground hover:text-brand-600"
                          >
                            {resource.title}
                          </ResourceIntentLink>
                          <p className="mt-1 text-xs text-muted-foreground">{resource.slug}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
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
        <section className={`${PANEL_CLASS} xl:col-span-2`}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Resource ratings</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
                Visible marketplace review performance across the resources you own.
            </p>
          </div>

          {reviewAnalytics.resources.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">
                No owned resources are available for review analytics yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className={TABLE_HEAD_CLASS}>
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-4 py-3 text-right">Rating</th>
                    <th className="px-4 py-3 text-right">Visible reviews</th>
                    <th className="px-4 py-3 text-right">Last review</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className={TABLE_BODY_CLASS}>
                  {reviewAnalytics.resources.map((resource) => (
                    <tr key={resource.resourceId}>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <ResourceIntentLink
                            href={routes.resource(resource.slug)}
                            className="truncate text-sm font-medium text-foreground hover:text-brand-600"
                          >
                            {resource.title}
                          </ResourceIntentLink>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {resource.averageRating?.toFixed(1) ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {resource.visibleReviewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {resource.lastReviewDate ? formatDate(resource.lastReviewDate) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={resource.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Recent visible reviews</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
                Latest public marketplace feedback for resources you own.
            </p>
          </div>

          {reviewAnalytics.recentReviews.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">
                No visible reviews yet.
            </p>
          ) : (
            <ul className={TABLE_BODY_CLASS}>
              {reviewAnalytics.recentReviews.map((review) => (
                <li key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <ResourceIntentLink
                        href={routes.resource(review.resourceSlug)}
                        className="truncate text-sm font-medium text-foreground hover:text-brand-600"
                      >
                        {review.resourceTitle}
                      </ResourceIntentLink>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.reviewerName} · {formatDate(review.createdAt)}
                      </p>
                      {review.body ? (
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {review.body}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">No written comment.</p>
                      )}
                    </div>
                    <Badge variant="warning" className="px-2.5 py-1 font-semibold">
                      {review.rating}/5
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Rating distribution</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
              Visible review counts by star rating across your resources.
            </p>
          </div>

          {reviewAnalytics.distribution.every((row) => row.count === 0) ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">
              Ratings will appear here once visible reviews are available.
            </p>
          ) : (
            <ul className={TABLE_BODY_CLASS}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  reviewAnalytics.distribution.find((row) => row.rating === rating)?.count ?? 0;

                return (
                  <li key={rating} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Star className="h-4 w-4 fill-warning-500 text-warning-500" />
                      {rating} star{rating === 1 ? "" : "s"}
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {count.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Recent sales activity</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
              Latest completed creator revenue events across your resources.
            </p>
          </div>

          {analytics.recentSales.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">No recent sales yet.</p>
          ) : (
            <ul className={TABLE_BODY_CLASS}>
              {analytics.recentSales.map((sale) => (
                <li key={sale.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <ResourceIntentLink
                      href={routes.resource(sale.resourceSlug)}
                      className="truncate text-sm font-medium text-foreground hover:text-brand-600"
                    >
                      {sale.resourceTitle}
                    </ResourceIntentLink>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {sale.buyerName} · {sale.status} · {formatDate(sale.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(sale.amount / 100)}
                    </p>
                    <p className="mt-1 text-xs text-success-700">
                      Share {formatPrice(sale.creatorShare / 100)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={PANEL_CLASS}>
          <div className={PANEL_HEADER_CLASS}>
            <h2 className={PANEL_TITLE_CLASS}>Recent download activity</h2>
            <p className={PANEL_DESCRIPTION_CLASS}>
              Latest downloads across the resources you publish.
            </p>
          </div>

          {analytics.recentDownloads.length === 0 ? (
            <p className="px-6 py-12 text-sm text-muted-foreground">No recent downloads yet.</p>
          ) : (
            <ul className={TABLE_BODY_CLASS}>
              {analytics.recentDownloads.map((download) => (
                <li key={download.id} className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <ResourceIntentLink
                      href={routes.resource(download.resourceSlug)}
                      className="truncate text-sm font-medium text-foreground hover:text-brand-600"
                    >
                      {download.resourceTitle}
                    </ResourceIntentLink>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {download.userId ? `User ${download.userId.slice(0, 8)}` : "Anonymous user"} ·{" "}
                      {formatDate(download.createdAt)}
                    </p>
                  </div>
                  <Badge variant="success" className="px-2.5 py-1 font-semibold">
                    Download
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={PANEL_CLASS}>
        <div className={PANEL_HEADER_CLASS}>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className={PANEL_TITLE_CLASS}>Next action</h2>
          </div>
          <p className={PANEL_DESCRIPTION_CLASS}>
            Use these numbers to decide which resources to promote, publish, or refresh first.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 px-6 py-5">
          <Button variant="outline" asChild>
            <Link href={routes.creatorResources}>Manage resources</Link>
          </Button>
          <Button asChild>
            <Link href={routes.creatorSales}>Review sales</Link>
          </Button>
        </div>
      </section>
    </DashboardPageStack>
  );
}
