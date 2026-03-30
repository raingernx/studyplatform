import Link from "next/link";
import { BookOpen, Plus, Upload } from "lucide-react";

import { Button } from "@/design-system";
import { ResourceTable, type AdminResourceRow } from "@/components/admin/ResourceTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/design-system";
import { AdminResourcesFilters } from "./AdminResourcesFilters";
import { getAdminResourcesPageData } from "@/services/admin-operations.service";
import {
  traceServerStep,
  withRequestPerformanceTrace,
} from "@/lib/performance/observability";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

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
      await traceServerStep(
        "admin_resources.requireAdminSession",
        () => requireAdminSession(routes.adminResources),
      );

      const {
        rows,
        totalCount,
        totalPages,
        categories,
        hasFilters,
      } = await traceServerStep(
        "admin_resources.getAdminResourcesPageData",
        () =>
          getAdminResourcesPageData({
            q,
            statusFilter,
            categoryIdFilter,
            freeOnly,
            minRevenueCents,
            currentPage,
            pageSize: PAGE_SIZE,
          }),
        {
          currentPage,
          freeOnly,
          hasSearch: Boolean(q),
          minRevenueCents,
          statusFilter: statusFilter || "all",
        },
      );

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
                    <BookOpen className="h-4 w-4 text-text-secondary" />
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
                    <Upload className="h-4 w-4 text-text-secondary" />
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

          {rows.length === 0 ? (
            <EmptyState
              className="min-h-0 border-border-subtle bg-surface-50/50 px-6 py-12"
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
          ) : (
            <>
              <ResourceTable resources={rows} categories={categories} />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-50/70 px-4 py-2.5 text-small text-text-secondary">
                <span className="min-w-0">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                  >
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
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                  >
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
          )}
        </div>
      );
    },
  );
}
