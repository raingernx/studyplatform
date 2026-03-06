"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton, type ResourceCardData } from "./ResourceCard";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ResourceGridProps {
  initialResources?: ResourceCardData[];
  categories?: Category[];
  ownedIds?: string[];
}

export function ResourceGrid({
  initialResources = [],
  categories = [],
  ownedIds = [],
}: ResourceGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [resources, setResources] = useState<ResourceCardData[]>(initialResources);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const activeCategory = searchParams.get("category") ?? "";
  const activeSearch = searchParams.get("q") ?? "";
  const activeFree = searchParams.get("free") === "true";
  const [searchInput, setSearchInput] = useState(activeSearch);

  const fetchResources = useCallback(
    async (params: {
      q?: string;
      category?: string;
      free?: boolean;
      page?: number;
    }) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (params.q) qs.set("q", params.q);
        if (params.category) qs.set("category", params.category);
        if (params.free) qs.set("free", "true");
        qs.set("page", String(params.page ?? 1));
        qs.set("pageSize", "12");

        const res = await fetch(`/api/resources?${qs.toString()}`);
        const json = await res.json();
        if (json.data) {
          setResources(json.data.items);
          setTotal(json.data.total);
          setTotalPages(json.data.totalPages);
          setPage(json.data.page);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when URL params change
  useEffect(() => {
    fetchResources({
      q: activeSearch || undefined,
      category: activeCategory || undefined,
      free: activeFree || undefined,
      page: 1,
    });
  }, [activeCategory, activeSearch, activeFree, fetchResources]);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput || null, page: null });
  }

  function handleCategoryClick(slug: string) {
    updateParams({ category: activeCategory === slug ? null : slug, page: null });
  }

  function handleFreeToggle() {
    updateParams({ free: activeFree ? null : "true", page: null });
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchResources({
      q: activeSearch || undefined,
      category: activeCategory || undefined,
      free: activeFree || undefined,
      page: newPage,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const hasFilters = activeSearch || activeCategory || activeFree;

  return (
    <div className="space-y-6">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search resources…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </form>

        {/* Free filter */}
        <button
          onClick={handleFreeToggle}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            activeFree
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Free only
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => {
              setSearchInput("");
              updateParams({ q: null, category: null, free: null, page: null });
            }}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ category: null, page: null })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              !activeCategory
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === cat.slug
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {total === 0 ? "No resources found" : `${total} resource${total === 1 ? "" : "s"} found`}
          {activeSearch && <> for &ldquo;<span className="font-medium text-gray-700">{activeSearch}</span>&rdquo;</>}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <Search className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-base font-medium text-gray-500">No resources found</p>
          <p className="mt-1 text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              owned={ownedIds.includes(resource.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={cn(
                  "min-w-[36px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  p === page
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
