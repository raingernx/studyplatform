import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  BarChart2,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  Plus,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { CreatorResourceStatusButton } from "@/components/creator/CreatorResourceStatusButton";
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

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "ARCHIVED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-neutral-50 text-neutral-600 ring-neutral-200";
  }
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
    <div className="space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">
              Creator
            </p>
            <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-neutral-900">
              Resource management
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Filter, publish, and monitor the listings you own in the marketplace.
            </p>
          </div>

          {access.canCreate && (
            <Link
              href={routes.creatorNewResource}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Create resource
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Resources</p>
            <p className="mt-3 text-2xl font-bold text-neutral-900">{data.resources.length}</p>
            <p className="mt-1 text-sm text-neutral-500">{publishedCount} published</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Downloads</p>
            <p className="mt-3 text-2xl font-bold text-neutral-900">
              {totalDownloads.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Across owned resources</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-card">
            <p className="text-xs uppercase tracking-wide text-neutral-400">Revenue</p>
            <p className="mt-3 text-2xl font-bold text-neutral-900">
              {formatPrice(totalRevenue / 100)}
            </p>
            <p className="mt-1 text-sm text-neutral-500">Gross sales revenue</p>
          </div>
        </div>

        <section className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
          </div>

          <form className="mt-4 grid gap-4 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Status
              </label>
              <select
                name="status"
                defaultValue={status ?? "all"}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Pricing
              </label>
              <select
                name="pricing"
                defaultValue={pricing ?? "all"}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              >
                <option value="all">All pricing</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Category
              </label>
              <select
                name="categoryId"
                defaultValue={categoryId ?? ""}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              >
                <option value="">All categories</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Sort
              </label>
              <select
                name="sort"
                defaultValue={sort ?? "latest"}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
              >
                <option value="latest">Latest</option>
                <option value="downloads">Downloads</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="inline-flex h-[42px] items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Apply
              </button>
              <Link
                href={routes.creatorResources}
                className="inline-flex h-[42px] items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-neutral-900">Your resources</h2>
            <p className="text-xs text-neutral-400">
              {data.resources.length} result{data.resources.length === 1 ? "" : "s"}
            </p>
          </div>

          {data.resources.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-600">No resources found</p>
              <p className="mt-1 text-xs text-neutral-400">
                {access.canCreate
                  ? "Try loosening your filters or create your first resource."
                  : "This account can manage existing resources but cannot create new listings."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Downloads</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {data.resources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <Link
                            href={routes.creatorResource(resource.id)}
                            className="truncate font-medium text-neutral-900 hover:text-blue-600"
                          >
                            {resource.title}
                          </Link>
                          <p className="mt-1 text-xs text-neutral-400">
                            Updated {formatDate(resource.updatedAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-neutral-600">
                        {resource.category?.name ?? "Uncategorized"}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-900">
                        {resource.isFree ? "Free" : formatPrice(resource.price / 100)}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-900">
                        {resource.downloadCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-neutral-900">
                        {formatPrice(resource.revenue / 100)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone(resource.status)}`}
                        >
                          {resource.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={routes.resource(resource.slug)}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View page
                          </Link>
                          <Link
                            href={routes.creatorResource(resource.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <CreatorResourceStatusButton
                            resourceId={resource.id}
                            status={resource.status as "DRAFT" | "PUBLISHED" | "ARCHIVED"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
          <p className="font-semibold">Need deeper performance insights?</p>
          <p className="mt-1">
            Your creator analytics page breaks down downloads, revenue, and sales trends over time.
          </p>
          <Link
            href={routes.creatorAnalytics}
            className="mt-3 inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800"
          >
            Open analytics
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
    </div>
  );
}
