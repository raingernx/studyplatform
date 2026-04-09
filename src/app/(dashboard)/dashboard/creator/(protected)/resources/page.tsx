import { Suspense } from "react";
import Link from "next/link";
import {
  BarChart2,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Plus,
} from "lucide-react";
import { Button, Select, RowActionButton, RowActions } from "@/design-system";
import { CreatorResourceStatusButton } from "@/components/creator/CreatorResourceStatusButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CreatorDashboardResourcesResultsSkeleton } from "@/components/skeletons/CreatorDashboardRouteSkeletons";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getCreatorResourceManagementData } from "@/services/creator";
import { ResourceIntentLink } from "@/components/navigation/ResourceIntentLink";
import { getCreatorProtectedUserContext } from "../creatorProtectedUser";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";

export const metadata = {
  title: "Creator Resources",
};

export const dynamic = "force-dynamic";

type CreatorResourcesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreatorResourcesPage({
  searchParams,
}: CreatorResourcesPageProps) {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorResources);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = firstValue(resolvedSearchParams.status);
  const pricing = firstValue(resolvedSearchParams.pricing);
  const categoryId = firstValue(resolvedSearchParams.categoryId);
  const sort = firstValue(resolvedSearchParams.sort);
  const normalizedStatus =
    status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" || status === "all"
      ? status
      : "all";
  const normalizedPricing =
    pricing === "free" || pricing === "paid" || pricing === "all" ? pricing : "all";
  const normalizedSort =
    sort === "downloads" || sort === "revenue" || sort === "latest" ? sort : "latest";

  return (
    <div data-route-shell-ready="dashboard-creator-resources" className="min-w-0 space-y-8">
      <DashboardPageHeader
        eyebrow="Creator"
        title="Resource management"
        description="Filter, publish, and monitor the listings you own in the marketplace."
        actions={
          <Button asChild size="sm" className="inline-flex items-center gap-2">
            <Link href={routes.creatorNewResource}>
              <Plus className="h-4 w-4" />
              Create resource
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<CreatorDashboardResourcesResultsSkeleton />}>
        <CreatorResourcesResultsSection
          userId={userId}
          status={normalizedStatus}
          pricing={normalizedPricing}
          categoryId={categoryId}
          sort={normalizedSort}
        />
      </Suspense>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4 text-sm text-brand-700">
        <p className="font-semibold">Need deeper performance insights?</p>
        <p className="mt-1 text-brand-700/80">
          Your creator analytics page breaks down downloads, revenue, and sales trends over time.
        </p>
        <Link
          href={routes.creatorAnalytics}
          className="mt-3 inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
        >
          Open analytics
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

async function CreatorResourcesResultsSection({
  userId,
  status,
  pricing,
  categoryId,
  sort,
}: {
  userId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "all";
  pricing: "free" | "paid" | "all";
  categoryId: string | undefined;
  sort: "downloads" | "revenue" | "latest";
}) {
  const data = await getCreatorResourceManagementData(userId, {
    status,
    pricing,
    categoryId: categoryId || undefined,
    sort,
  });

  const publishedCount = data.resources.filter((resource) => resource.status === "PUBLISHED").length;
  const totalRevenue = data.resources.reduce((sum, resource) => sum + resource.revenue, 0);
  const totalDownloads = data.resources.reduce((sum, resource) => sum + resource.downloadCount, 0);
  const hasActiveFilters = Boolean(
    (status && status !== "all") ||
      (pricing && pricing !== "all") ||
      (categoryId && categoryId !== ""),
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">Resources</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">{data.resources.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">{publishedCount} published</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">Downloads</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {totalDownloads.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Across owned resources</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">Revenue</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            {formatPrice(totalRevenue / 100)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Gross sales revenue</p>
        </div>
      </div>

      <form className="flex min-w-0 flex-wrap items-end gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">
            Status
          </label>
          <Select name="status" defaultValue={status ?? "all"}>
            <option value="all">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">
            Pricing
          </label>
          <Select name="pricing" defaultValue={pricing ?? "all"}>
            <option value="all">All pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">
            Category
          </label>
          <Select name="categoryId" defaultValue={categoryId ?? ""}>
            <option value="">All categories</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-muted-foreground">
            Sort
          </label>
          <Select name="sort" defaultValue={sort ?? "latest"}>
            <option value="latest">Latest</option>
            <option value="downloads">Downloads</option>
            <option value="revenue">Revenue</option>
          </Select>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <Button type="submit" size="sm">Apply</Button>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.creatorResources}>Reset</Link>
          </Button>
        </div>
      </form>

      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Your resources</p>
          <p className="text-xs text-muted-foreground">
            {data.resources.length} result{data.resources.length === 1 ? "" : "s"}
          </p>
        </div>

        {data.resources.length === 0 ? (
          hasActiveFilters ? (
            <div className="px-6 py-16 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No resources match your filters
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try adjusting your filters to find what you're looking for.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href={routes.creatorResources}>Clear filters</Link>
              </Button>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm font-semibold text-foreground">No resources yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start building your catalog by creating your first marketplace listing.
              </p>
              <Button className="mt-6" asChild>
                <Link href={routes.creatorNewResource}>
                  <Plus className="h-4 w-4" />
                  Create your first resource
                </Link>
              </Button>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/80">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-tightest text-muted-foreground">Resource</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-tightest text-muted-foreground">Category</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-muted-foreground">Price</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-muted-foreground">Downloads</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-muted-foreground">Revenue</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-tightest text-muted-foreground">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.resources.map((resource) => (
                  <tr key={resource.id} className="bg-card transition-colors hover:bg-muted/60">
                    <td className="px-2 py-3">
                      <div className="min-w-0">
                        <Link
                          href={routes.creatorResource(resource.id)}
                          className="truncate font-medium text-foreground hover:text-brand-600"
                        >
                          {resource.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Updated {formatDate(resource.updatedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground">
                      {resource.category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-foreground">
                      {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-foreground tabular-nums">
                      {resource.downloadCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-foreground tabular-nums">
                      {formatPrice(resource.revenue / 100)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={resource.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <RowActions>
                        <RowActionButton asChild>
                          <ResourceIntentLink href={routes.resource(resource.slug)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </ResourceIntentLink>
                        </RowActionButton>
                        <RowActionButton asChild>
                          <Link href={routes.creatorResource(resource.id)}>
                            <FileText className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </RowActionButton>
                        <CreatorResourceStatusButton
                          resourceId={resource.id}
                          status={resource.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"}
                        />
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
