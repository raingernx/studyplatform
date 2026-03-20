import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  BarChart2,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Plus,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { Button, Select, RowActionButton, RowActions } from "@/design-system";
import { CreatorResourceStatusButton } from "@/components/creator/CreatorResourceStatusButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { routes } from "@/lib/routes";
import { getCreatorAccessState, getCreatorResourceManagementData } from "@/services/creator.service";

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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/resources");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const status = firstValue(resolvedSearchParams.status);
  const pricing = firstValue(resolvedSearchParams.pricing);
  const categoryId = firstValue(resolvedSearchParams.categoryId);
  const sort = firstValue(resolvedSearchParams.sort);

  const data = await getCreatorResourceManagementData(session.user.id, {
    status:
      status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED" || status === "all"
        ? status
        : "all",
    pricing: pricing === "free" || pricing === "paid" || pricing === "all" ? pricing : "all",
    categoryId: categoryId || undefined,
    sort: sort === "downloads" || sort === "revenue" || sort === "latest" ? sort : "latest",
  });

  const publishedCount = data.resources.filter((resource) => resource.status === "PUBLISHED").length;
  const totalRevenue = data.resources.reduce((sum, resource) => sum + resource.revenue, 0);
  const totalDownloads = data.resources.reduce((sum, resource) => sum + resource.downloadCount, 0);

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-surface-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-tightest text-brand-600">
            Creator
          </p>
          <h1 className="mt-1 font-display text-h2 font-semibold tracking-tight text-text-primary">
            Resource management
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Filter, publish, and monitor the listings you own in the marketplace.
          </p>
        </div>

        {access.canCreate && (
          <Button asChild size="sm" className="inline-flex items-center gap-2">
            <Link href={routes.creatorNewResource}>
              <Plus className="h-4 w-4" />
              Create resource
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">Resources</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-text-primary">{data.resources.length}</p>
          <p className="mt-1 text-sm text-text-secondary">{publishedCount} published</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">Downloads</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
            {totalDownloads.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Across owned resources</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-tightest text-text-muted">Revenue</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-text-primary">
            {formatPrice(totalRevenue / 100)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">Gross sales revenue</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex min-w-0 flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
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
          <label className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
            Pricing
          </label>
          <Select name="pricing" defaultValue={pricing ?? "all"}>
            <option value="all">All pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
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
          <label className="text-xs font-semibold uppercase tracking-tightest text-text-secondary">
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

      {/* Table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">Your resources</p>
          <p className="text-xs text-text-muted">
            {data.resources.length} result{data.resources.length === 1 ? "" : "s"}
          </p>
        </div>

        {data.resources.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-3 text-sm font-medium text-text-secondary">No resources found</p>
            <p className="mt-1 text-xs text-text-muted">
              {access.canCreate
                ? "Try loosening your filters or create your first resource."
                : "This account can manage existing resources but cannot create new listings."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle bg-surface-50/80">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-tightest text-text-secondary">Resource</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-tightest text-text-secondary">Category</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">Price</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">Downloads</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">Revenue</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-tightest text-text-secondary">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-tightest text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {data.resources.map((resource) => (
                  <tr key={resource.id} className="bg-white transition-colors hover:bg-surface-50">
                    <td className="px-2 py-3">
                      <div className="min-w-0">
                        <Link
                          href={routes.creatorResource(resource.id)}
                          className="truncate font-medium text-text-primary hover:text-brand-600"
                        >
                          {resource.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-text-muted">
                          Updated {formatDate(resource.updatedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-text-secondary">
                      {resource.category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-text-primary">
                      {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-text-primary tabular-nums">
                      {resource.downloadCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-text-primary tabular-nums">
                      {formatPrice(resource.revenue / 100)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={resource.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <RowActions>
                        <RowActionButton asChild>
                          <Link href={routes.resource(resource.slug)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
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
