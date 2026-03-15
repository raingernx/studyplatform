"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import { AdminResourcesClearButton } from "./AdminResourcesClearButton";
import { FilterChips } from "@/components/admin/FilterChips";
import {
  SavedFiltersDropdown,
  type SavedFilterPresetId,
} from "@/components/admin/SavedFiltersDropdown";

interface AdminResourcesFiltersProps {
  q: string;
  statusFilter: string;
  categoryIdFilter: string;
  categories: { id: string; name: string }[];
}

type FilterState = {
  search: string;
  status: string;
  categoryId: string;
};

function buildQueryString(base: {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (base.q) params.set("q", base.q);
  if (base.status) params.set("status", base.status);
  if (base.categoryId) params.set("categoryId", base.categoryId);
  if (base.page && base.page > 1) params.set("page", String(base.page));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function AdminResourcesFilters({
  q,
  statusFilter,
  categoryIdFilter,
  categories,
}: AdminResourcesFiltersProps) {
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({
    search: q,
    status: statusFilter,
    categoryId: categoryIdFilter,
  });

  // Keep local state in sync when URL/searchParams change (e.g. via back/forward).
  useEffect(() => {
    setFilters({
      search: q,
      status: statusFilter,
      categoryId: categoryIdFilter,
    });
  }, [q, statusFilter, categoryIdFilter]);

  const hasFilters =
    !!filters.search.trim() || !!filters.status || !!filters.categoryId;

  const debouncedSearch = useDebounce(filters.search, 300);

  const hrefForFilters = useMemo(
    () =>
      (next: FilterState, page: number = 1) =>
        `/admin/resources${buildQueryString({
          q: next.search.trim() || undefined,
          status: next.status || undefined,
          categoryId: next.categoryId || undefined,
          page,
        })}`,
    [],
  );

  // Debounced search: when the user pauses typing, update URL + data.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    // Avoid pushing empty search when nothing else is set and we're already on base URL.
    const next: FilterState = { ...filters, search: trimmed };
    const href = hrefForFilters(next, 1);
    router.replace(href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const href = hrefForFilters(filters, 1);
    router.replace(href);
  }

  function handleClear() {
    const cleared: FilterState = { search: "", status: "", categoryId: "" };
    setFilters(cleared);
    router.replace("/admin/resources");
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      const href = hrefForFilters(filters, 1);
      router.replace(href);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const cleared: FilterState = { ...filters, search: "" };
      setFilters(cleared);
      const href = hrefForFilters(cleared, 1);
      router.replace(href);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mb-2 flex min-w-0 flex-wrap items-end gap-3 rounded-2xl border border-border-subtle bg-white px-4 py-3 shadow-card"
      >
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
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            onKeyDown={handleSearchKeyDown}
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
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
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
          value={filters.categoryId}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, categoryId: e.target.value }))
          }
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <SavedFiltersDropdown
            currentFilters={filters}
            onApplyPreset={(preset: SavedFilterPresetId) => {
              let next: FilterState = filters;
              const extras: Record<string, string | undefined> = {};

              if (preset === "all") {
                next = { search: "", status: "", categoryId: "" };
                extras.minRevenueCents = undefined;
                extras.free = undefined;
              } else if (preset === "published") {
                next = { ...filters, status: "PUBLISHED" };
              } else if (preset === "draft") {
                next = { ...filters, status: "DRAFT" };
              } else if (preset === "highRevenue") {
                next = { ...filters };
                extras.minRevenueCents = "100000"; // $1,000 in cents
              } else if (preset === "free") {
                next = { ...filters };
                extras.free = "1";
              }

              setFilters(next);

              const params = new URLSearchParams();
              if (next.search.trim()) params.set("q", next.search.trim());
              if (next.status) params.set("status", next.status);
              if (next.categoryId) params.set("categoryId", next.categoryId);
              if (extras.minRevenueCents)
                params.set("minRevenueCents", extras.minRevenueCents);
              if (extras.free) params.set("free", extras.free);
              const qs = params.toString();

              const href = qs
                ? `/admin/resources?${qs}`
                : "/admin/resources";
              router.replace(href);
            }}
          />
          <AdminResourcesClearButton
            hasFilters={hasFilters}
            onClear={handleClear}
          />
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

      <FilterChips
        filters={filters}
        categories={categories}
        onRemove={(key) => {
          const next: FilterState =
            key === "search"
              ? { ...filters, search: "" }
              : key === "status"
                ? { ...filters, status: "" }
                : { ...filters, categoryId: "" };
          setFilters(next);
          const href = hrefForFilters(next, 1);
          router.replace(href);
        }}
        onClearAll={hasFilters ? handleClear : undefined}
      />
    </>
  );
}
