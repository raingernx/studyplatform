import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookOpen, Plus } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/design-system";
import { ResourceTable, type AdminResourceRow } from "@/components/admin/ResourceTable";
import { AdminResourcesFilters } from "./AdminResourcesFilters";

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
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?next=/admin/resources");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};

  const q = (resolvedSearchParams.q ?? "").trim();
  const statusFilter = (resolvedSearchParams.status ?? "").toUpperCase();
  const categoryIdFilter = (resolvedSearchParams.categoryId ?? "").trim();
  const minRevenueCents = Number(resolvedSearchParams.minRevenueCents ?? "0") || 0;
  const freeOnly = resolvedSearchParams.free === "1";
  const currentPage = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);

  const where: any = { deletedAt: null };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { name: { contains: q, mode: "insensitive" } } },
      { author: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (["DRAFT", "PUBLISHED", "ARCHIVED"].includes(statusFilter)) {
    where.status = statusFilter;
  }

  if (categoryIdFilter) {
    where.categoryId = categoryIdFilter;
  }

  const skip = (currentPage - 1) * PAGE_SIZE;

  const [resources, totalCount, categories] = await Promise.all([
    prisma.resource.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        previewUrl: true,
        isFree: true,
        price: true,
        status: true,
        createdAt: true,
        downloadCount: true,
        author: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { purchases: true } },
      },
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const revenueRows =
    resources.length === 0
      ? []
      : await prisma.purchase.groupBy({
          by: ["resourceId"],
          where: {
            resourceId: {
              in: resources.map((resource) => resource.id),
            },
          },
          _sum: {
            amount: true,
          },
        });

  const revenueByResourceId = new Map(
    revenueRows.map((row) => [row.resourceId, row._sum.amount ?? 0]),
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  let rows: AdminResourceRow[] = resources.map((r) => {
    const purchases = r._count?.purchases ?? 0;
    const revenue = revenueByResourceId.get(r.id) ?? 0;

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      previewUrl: r.previewUrl ?? null,
      isFree: r.isFree,
      price: r.price,
      status: r.status,
      createdAt: r.createdAt,
      author: r.author,
      category: r.category,
      downloads: r.downloadCount,
      purchases,
      revenue,
    };
  });

  // Apply optional client-side filters derived from presets, without changing API shape.
  if (freeOnly) {
    rows = rows.filter((r) => r.isFree || r.price === 0);
  }

  if (minRevenueCents > 0) {
    rows = rows.filter((r) => r.revenue >= minRevenueCents);
  }

  const hasFilters = !!q || !!statusFilter || !!categoryIdFilter;

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
            <Link href="/admin/resources/trash">
              <BookOpen className="h-4 w-4 text-text-secondary" />
              <span>View Trash</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="inline-flex items-center gap-2">
            <Link href="/admin/resources/new">
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
                      : `/admin/resources${buildQueryString({
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
                      : `/admin/resources${buildQueryString({
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
