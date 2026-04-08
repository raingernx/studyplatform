import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, Plus, Upload } from "lucide-react";
import dynamic from "next/dynamic";

import { Button, EmptyState } from "@/design-system";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminResourcesFilters } from "./AdminResourcesFilters";
import {
  getAdminResourcesFilterData,
  getAdminResourcesListingData,
} from "@/services/admin";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { routes } from "@/lib/routes";
import { AdminResourcesResultsSkeleton } from "@/components/skeletons/AdminResourcesRouteSkeletons";
import type { AdminResourceRow } from "@/components/admin/resources";

const ResourceTable = dynamic(() =>
  import("@/components/admin/resources").then((m) => m.ResourceTable),
);

export const metadata = {
  title: "Resources – Admin",
  description: "Browse and manage resources in the marketplace.",
};

const PAGE_SIZE = 20;

interface AdminResourcesPageProps {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    status?: string;
    categoryId?: string;
    minRevenueCents?: string;
    free?: string;
  }>;
}

function buildQueryString(base: {
  page?: number;
  q?: string;
  status?: string;
  categoryId?: string;
}) {
  const params = new URLSearchParams();

  if (base.q) params.set("q", base.q);
  if (base.status) params.set("status", base.status);
  if (base.categoryId) params.set("categoryId", base.categoryId);
  if (base.page && base.page > 1) params.set("page", String(base.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function AdminResourcesResultsSection({
  dataPromise,
  categories,
  currentPage,
  q,
  statusFilter,
  categoryIdFilter,
}: {
  dataPromise: ReturnType<typeof getAdminResourcesListingData>;
  categories: { id: string; name: string }[];
  currentPage: number;
  q: string;
  statusFilter: string;
  categoryIdFilter: string;
}) {
  const { rows, totalPages, hasFilters } = await dataPromise;

  if (rows.length === 0) {
    return (
      <EmptyState
        className="min-h-0 border-border bg-muted/50 px-6 py-12"
        icon={
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50">
            <BookOpen className="h-6 w-6 text-primary-700" />
          </span>
        }
        title="No resources found"
        description={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Create your first resource to populate the library."
        }
      />
    );
  }

  return (
    <>
      <ResourceTable resources={rows as AdminResourceRow[]} categories={categories} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-small text-muted-foreground">
        <span className="min-w-0">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" disabled={currentPage <= 1}>
            <Link
              href={
                currentPage <= 1
                  ? "#"
                  : `${routes.adminResources}${buildQueryString({
                      q,
                      status: statusFilter,
                      categoryId: categoryIdFilter,
                      page: currentPage - 1,
                    })}`
              }
            >
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={currentPage >= totalPages}>
            <Link
              href={
                currentPage >= totalPages
                  ? "#"
                  : `${routes.adminResources}${buildQueryString({
                      q,
                      status: statusFilter,
                      categoryId: categoryIdFilter,
                      page: currentPage + 1,
                    })}`
              }
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default async function AdminResourcesPage({
  searchParams,
}: AdminResourcesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const q = (resolvedSearchParams.q ?? "").trim();
  const statusFilter = (resolvedSearchParams.status ?? "").toUpperCase();
  const categoryIdFilter = (resolvedSearchParams.categoryId ?? "").trim();
  const minRevenueCents = Number(resolvedSearchParams.minRevenueCents ?? "0") || 0;
  const freeOnly = resolvedSearchParams.free === "1";
  const currentPage = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);

  return withRequestPerformanceTrace(
    "route:/admin/resources",
    {
      currentPage,
      freeOnly,
      hasCategoryFilter: Boolean(categoryIdFilter),
      hasQuery: Boolean(q),
      minRevenueCents,
      statusFilter: statusFilter || "all",
    },
    async () => {
      const filtersPromise = traceServerStep("admin_resources.getAdminResourcesFilterData", () =>
        getAdminResourcesFilterData(),
      );
      const listingPromise = traceServerStep("admin_resources.getAdminResourcesListingData", () =>
        getAdminResourcesListingData({
          q,
          statusFilter,
          categoryIdFilter,
          freeOnly,
          minRevenueCents,
          currentPage,
          pageSize: PAGE_SIZE,
        }),
      );

      const { categories } = await filtersPromise;

      return (
        <div className="min-w-0 space-y-7">
          <AdminPageHeader
            title="Resources"
            description="View and manage all resources in the marketplace."
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Link href={routes.adminTrash}>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>View Trash</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Link href={routes.adminBulkUpload}>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span>Bulk Upload</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="inline-flex items-center gap-2">
                  <Link href={routes.adminNewResource}>
                    <Plus className="h-4 w-4" />
                    <span>Create Resource</span>
                  </Link>
                </Button>
              </div>
            }
          />

          <AdminResourcesFilters
            q={q}
            statusFilter={statusFilter}
            categoryIdFilter={categoryIdFilter}
            categories={categories}
          />

          <Suspense fallback={<AdminResourcesResultsSkeleton />}>
            <AdminResourcesResultsSection
              dataPromise={listingPromise}
              categories={categories}
              currentPage={currentPage}
              q={q}
              statusFilter={statusFilter}
              categoryIdFilter={categoryIdFilter}
            />
          </Suspense>
        </div>
      );
    },
  );
}
