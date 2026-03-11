import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BookOpen, Filter, Search } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ResourceTable, type AdminResourceRow } from "@/components/admin/ResourceTable";

export const metadata = {
  title: "Resources – Admin",
  description: "Browse and manage resources in the marketplace.",
};

const PAGE_SIZE = 20;

interface AdminResourcesPageProps {
  searchParams?: {
    page?: string;
    q?: string;
    status?: string;
    categoryId?: string;
  };
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

  const q = (searchParams?.q ?? "").trim();
  const statusFilter = (searchParams?.status ?? "").toUpperCase();
  const categoryIdFilter = (searchParams?.categoryId ?? "").trim();
  const currentPage = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  const where: any = {};

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
      include: {
        author: { select: { name: true, email: true } },
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rows: AdminResourceRow[] = resources.map((r) => ({
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
  }));

  const hasFilters = !!q || !!statusFilter || !!categoryIdFilter;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Resources
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage all resources in the marketplace.
          </p>
        </div>

        <Button asChild size="sm">
          <Link href="/admin/resources/new">Create Resource</Link>
        </Button>
      </div>

      {/* Toolbar */}
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <label
            htmlFor="q"
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
          >
            Search
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-text-muted" />
            </span>
            <Input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search by title or creator…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-40">
          <label
            htmlFor="status"
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
          >
            Status
          </label>
          <Select
            id="status"
            name="status"
            defaultValue={statusFilter}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <div className="flex w-full flex-col gap-1 sm:w-52">
          <label
            htmlFor="categoryId"
            className="text-xs font-semibold uppercase tracking-tightest text-text-secondary"
          >
            Category
          </label>
          <Select
            id="categoryId"
            name="categoryId"
            defaultValue={categoryIdFilter}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/admin/resources">Clear</Link>
            </Button>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            Apply
          </Button>
        </div>
      </form>

      {/* Table / Empty state */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle bg-white py-16 text-center">
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
          <ResourceTable resources={rows} />

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
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
    </>
  );
}

