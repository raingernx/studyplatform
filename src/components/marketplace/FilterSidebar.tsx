"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { SORT_OPTIONS, normaliseSortParam } from "@/config/sortOptions";

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: FilterCategory[];
  className?: string;
  showHeader?: boolean;
  showSort?: boolean;
  showPrice?: boolean;
  onNavigate?: () => void;
}

// ── Static filter options ─────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  { label: "PDF", value: "pdf" },
  { label: "Worksheets", value: "worksheet" },
  { label: "Flashcards", value: "flashcard" },
  { label: "Templates", value: "template" },
];

const PRICE_OPTIONS = [
  { label: "All prices", value: "" },
  { label: "Free only", value: "free" },
  { label: "Paid only", value: "paid" },
];

const DIFFICULTY_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function FilterSidebar({
  categories,
  className,
  showHeader = true,
  showSort = true,
  showPrice = true,
  onNavigate,
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get("category");
  const current = {
    category: category ?? "",
    price: searchParams.get("price") ?? "",
    sort: normaliseSortParam(searchParams.get("sort")),
    search: searchParams.get("search") ?? "",
    tag: searchParams.get("tag") ?? "",
  };

  const isAllCategories = current.category === "all";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      onNavigate?.();
    },
    [router, pathname, searchParams, onNavigate]
  );

  const showClearAll = category && category !== "all";

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    params.set("category", "all");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    onNavigate?.();
  }, [router, pathname, onNavigate]);

  return (
    <aside className={cn("w-[280px] flex-shrink-0 space-y-4", className)}>
      {/* Header + clear */}
      {showHeader && (
        <div className="flex items-center justify-between rounded-2xl border border-surface-200 bg-white px-4 py-3 shadow-card">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-zinc-400">
            Filters
          </p>
          {showClearAll && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-700"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Sort ──────────────────────────────────────────────────── */}
      {showSort && (
        <FilterGroup title="Sort by">
          <ul className="space-y-0.5">
            {SORT_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => updateParam("sort", opt.value)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                    current.sort === opt.value
                      ? "bg-zinc-900 font-semibold text-white"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {/* ── Category ──────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <FilterGroup title="Category">
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => updateParam("category", "all")}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                  isAllCategories
                    ? "bg-black font-semibold text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                All categories
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => updateParam("category", cat.slug)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                    current.category === cat.slug
                      ? "bg-zinc-900 font-semibold text-white"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {/* ── Price ─────────────────────────────────────────────────── */}
      {showPrice && (
        <FilterGroup title="Price">
          <ul className="space-y-0.5">
            {PRICE_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => updateParam("price", opt.value)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                    current.price === opt.value
                      ? "bg-zinc-900 font-semibold text-white"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {/* ── Difficulty ────────────────────────────────────────────── */}
      <FilterGroup title="Difficulty">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((diff) => {
            const active = current.tag === diff.value;
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() =>
                  updateParam("tag", active ? "" : diff.value)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                {diff.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* ── Resource type ─────────────────────────────────────────── */}
      <FilterGroup title="Resource type">
        <div className="flex flex-wrap gap-2">
          {RESOURCE_TYPES.map((type) => {
            const active = current.tag === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  updateParam("tag", active ? "" : type.value)
                }
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                )}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>
    </aside>
  );
}

// ── FilterGroup ───────────────────────────────────────────────────────────────

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-zinc-400"
      >
        <span>{title}</span>
        <span className="text-[10px]">{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}
