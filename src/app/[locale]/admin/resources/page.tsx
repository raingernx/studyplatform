import Link from "next/link";
import { BookOpen, Plus, Upload } from "lucide-react";

import { Button } from "@/design-system";
import { AdminResourcesFilters } from "./AdminResourcesFilters";
import { routes } from "@/lib/routes";
import { getAdminResourcesPageData } from "@/services/admin-operations.service";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import dynamic from "next/dynamic";
import type { AdminResourceRow } from "@/components/admin/ResourceTable";

const ResourceTable = dynamic(() =>
  import("@/components/admin/ResourceTable").then((m) => m.ResourceTable),
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

export default async function AdminResourcesPage({
  searchParams,
}: AdminResourcesPageProps) {
  await requireAdminSession(routes.adminResources);

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const q = (resolvedSearchParams.q ?? "").trim();
  const statusFilter = (resolvedSearchParams.status ?? "").toUpperCase();
  const categoryIdFilter = (resolvedSearchParams.categoryId ?? "").trim();
  const minRevenueCents = Number(resolvedSearchParams.minRevenueCents ?? "0") || 0;
  const freeOnly = resolvedSearchParams.free === "1";
  const currentPage = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);

  const {
    rows,
    categories,
    totalPages,
    hasFilters,
  } = await getAdminResourcesPageData({
    q,
    statusFilter,
    categoryIdFilter,
    freeOnly,
    minRevenueCents,
    currentPage,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-surface-200 pb-4">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Resources
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            View and manage all resources in the marketplace.
          </p>
        </div>
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
      </div>

      {/* Toolbar */}
      <AdminResourcesFilters
        q={q}
        statusFilter={statusFilter}
        categoryIdFilter={categoryIdFilter}
        categories={categories}
      />

      {/* Table / Empty state */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-border-subtle bg-white px-6 py-16 text-center shadow-card">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <BookOpen className="h-7 w-7 text-brand-600" />
          </span>
          <p className="mt-4 font-semibold text-text-primary">
            No resources found
          </p>
          <p className="mt-1.5 max-w-md text-sm text-text-secondary">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "Create your first resource to populate the library."}
          </p>
        </div>
      ) : (
        <>
          <ResourceTable resources={rows} categories={categories} />

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 text-xs text-text-secondary shadow-card">
            <span>
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
}
