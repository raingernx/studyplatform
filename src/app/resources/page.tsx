import { Suspense } from "react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { ResourceGrid } from "@/components/ui/ResourceGrid";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ResourceFilters, type FilterCategory, type FilterTag } from "@/components/resources/ResourceFilters";
import { ResourceFiltersMobile } from "@/components/resources/ResourceFiltersMobile";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceSort } from "@/components/resources/ResourceSort";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";

export const metadata = {
  title: "Marketplace – PaperDock",
  description: "Browse and download study resources.",
};

// ── Config ────────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

// ── Data fetching ─────────────────────────────────────────────────────────────

// Convenience alias — Prisma accepts either a single clause or an array.
type OrderBy =
  | Prisma.ResourceOrderByWithRelationInput
  | Prisma.ResourceOrderByWithRelationInput[];

/**
 * Maps a URL sort token to a Prisma orderBy clause (or array of clauses).
 *
 * Single-column sorts return a plain object; multi-column sorts return an
 * array so Postgres can use a tie-breaker without extra application logic.
 *
 * "featured"  — featured items float to the top, then newest within each tier.
 * "trending"  — ordered by downloadCount first, then by purchase count as a
 *               tie-breaker.  Both are DB columns / relation counts so the
 *               sort runs entirely inside Postgres.
 * "popular"   — relation-count ordering: { purchases: { _count: "desc" } }.
 */
function buildOrderBy(sort: string): OrderBy {
  switch (sort) {
    case "oldest":     return { createdAt:     "asc"  };
    case "popular":    return { purchases:     { _count: "desc" } };
    case "downloads":  return { downloadCount: "desc" };
    case "price_asc":  return { price:         "asc"  };
    case "price_desc": return { price:         "desc" };

    // Featured items (featured: true) bubble to the top; within each tier
    // resources are sorted newest-first so fresh content stays visible.
    case "featured":
      return [
        { featured:  "desc" },
        { createdAt: "desc" },
      ];

    // Trending = most downloaded, with purchase count as a tie-breaker.
    // downloadCount is a scalar column; purchases uses relation-count ordering.
    case "trending":
      return [
        { downloadCount: "desc" },
        { purchases:     { _count: "desc" } },
      ];

    case "newest":
    default:           return { createdAt: "desc" };
  }
}

/**
 * Fetches a single page of published resources from the database.
 *
 * All filters (search, category, price, featured) and sorting are pushed
 * into Postgres via Prisma so the application layer only receives the rows
 * it needs.  A parallel `count` query provides the total for pagination.
 *
 * URL param → Prisma mapping:
 *   search   → OR [title contains, description contains] (insensitive)
 *   category → category.slug
 *   price    → isFree (free | paid | all)
 *   featured → featured: true
 *   tag      → tags.some.tag.slug
 *   sort     → orderBy via buildOrderBy()
 *   page     → skip / take
 */
async function getMarketplaceData(params: {
  search?:   string;
  category?: string;
  price?:    string;
  featured?: boolean;
  tag?:      string;
  sort?:     string;
  page?:     number;
}) {
  const { search, category, price, featured, tag, sort, page = 1 } = params;

  const trimmedSearch   = search?.trim();
  const trimmedCategory = category?.trim();
  const trimmedTag      = tag?.trim();

  // ── where fragments ──────────────────────────────────────────────────────────
  const searchWhere = trimmedSearch
    ? {
        OR: [
          { title:       { contains: trimmedSearch, mode: "insensitive" as const } },
          { description: { contains: trimmedSearch, mode: "insensitive" as const } },
        ],
      }
    : {};

  const categoryWhere = trimmedCategory
    ? { category: { slug: trimmedCategory } }
    : {};

  const priceWhere =
    price === "free" ? { isFree: true }
    : price === "paid" ? { isFree: false }
    : {};

  const featuredWhere = featured ? { featured: true } : {};

  // Matches resources that have at least one tag with the given slug.
  // Prisma translates this to an EXISTS subquery on the ResourceTag join table.
  const tagWhere = trimmedTag
    ? { tags: { some: { tag: { slug: trimmedTag } } } }
    : {};

  const where = {
    status: "PUBLISHED" as const,
    ...searchWhere,
    ...categoryWhere,
    ...priceWhere,
    ...featuredWhere,
    ...tagWhere,
  };

  // ── parallel queries ──────────────────────────────────────────────────────────
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [resources, total, categories, popularTags] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        author:   { select: { name: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags:     { include: { tag: { select: { name: true, slug: true } } } },
        _count:   { select: { purchases: true, reviews: true } },
      },
      orderBy: buildOrderBy(sort ?? "newest") as
        | Prisma.ResourceOrderByWithRelationInput
        | Prisma.ResourceOrderByWithRelationInput[],
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.resource.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    // Fetch the 20 most-used tags for the sidebar filter list.
    // Ordering by relation count surfaces the tags that appear on the most resources.
    prisma.tag.findMany({
      orderBy: { resources: { _count: "desc" } },
      take: 20,
    }),
  ]);

  return { resources, total, categories, popularTags };
}


// ── Page ──────────────────────────────────────────────────────────────────────

interface ResourcesPageProps {
  searchParams: {
    search?: string;  // full-text search term → passed to Prisma where clause
    category?: string;
    price?: string;
    type?: string;
    featured?: string;
    tag?: string;     // tag slug → tags.some.tag.slug in Prisma where clause
    sort?: string;
    page?: string;
  };
}

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const {
    search,
    category,
    price,
    type,
    featured,
    tag,
    sort = "newest",
    page: pageParam,
  } = searchParams;

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // All filters, sorting, and pagination are handled by Prisma
  const { resources, total, categories, popularTags } = await getMarketplaceData({
    search,
    category,
    price,
    featured: featured === "true",
    tag,
    sort,
    page: currentPage,
  });

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  // Clamp the page in case the URL has a stale high page number
  const safePage = Math.min(currentPage, totalPages);

  // Count active sidebar filters (search is shown separately, not counted here)
  const activeFiltersCount = [
    category,
    price && price !== "all" ? price : null,
    type && type !== "all" ? type : null,
    featured === "true" ? "featured" : null,
    tag,
  ].filter(Boolean).length;

  const displayCategories = categories as FilterCategory[];
  const displayTags       = popularTags as FilterTag[];

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10">
          <SectionHeader
            title="Marketplace"
            description="Browse and download study resources created by top students and educators."
            className="mb-8"
          />

          <div className="flex gap-8">
            {/* ── Filter sidebar ─────────────────────────────────────────── */}
            <div className="hidden flex-shrink-0 lg:block lg:w-52 xl:w-60">
              <Suspense fallback={<FiltersFallback />}>
                <ResourceFilters
                  categories={displayCategories}
                  tags={displayTags}
                />
              </Suspense>
            </div>

            {/* ── Main content ───────────────────────────────────────────── */}
            <div className="min-w-0 flex-1">
              {/* ── Search bar ───────────────────────────────────────────── */}
              <div className="mb-6 w-full">
                <Suspense fallback={<SearchFallback />}>
                  <ResourceSearch />
                </Suspense>
              </div>

              {/* ── Mobile filters ───────────────────────────────────────── */}
              <div className="mb-6 lg:hidden">
                <ResourceFiltersMobile
                  categories={displayCategories}
                  tags={displayTags}
                />
              </div>

              {/* ── Result header row ───────────────────────────────────── */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {total === 1
                    ? "1 resource found"
                    : `${total.toLocaleString()} resources found`}
                </p>
                <Suspense fallback={<SortFallback />}>
                  <ResourceSort />
                </Suspense>
              </div>

              {/* ── Search results banner ──────────────────────────────── */}
              {search?.trim() && (
                <p className="mb-5 text-sm text-text-secondary">
                  {total === 0 ? (
                    <>
                      No resources found for{" "}
                      <span className="font-semibold text-text-primary">
                        &ldquo;{search.trim()}&rdquo;
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Showing results for{" "}
                      <span className="font-semibold text-text-primary">
                        &ldquo;{search.trim()}&rdquo;
                      </span>
                    </>
                  )}
                </p>
              )}

              {/* ── Resource grid ──────────────────────────────────────── */}
              <ResourceGrid
                resources={resources as ResourceCardData[]}
                total={total}
                page={safePage}
                totalPages={totalPages}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Fallback skeletons (shown during Suspense hydration) ──────────────────────

function SearchFallback() {
  return (
    <div className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />
  );
}

function FiltersFallback() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </div>
      {[40, 60, 50, 45].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded animate-pulse bg-zinc-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function SortFallback() {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-zinc-300" />
      <div className="h-9 w-36 rounded-xl border border-zinc-200 bg-zinc-100 animate-pulse" />
    </div>
  );
}
