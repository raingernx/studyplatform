"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { SORT_OPTIONS, normaliseSortParam } from "@/config/sortOptions";
import { beginResourcesNavigation } from "@/components/marketplace/resourcesNavigationState";

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
  const [isPending, startTransition] = useTransition();
  // Track the param key+value being navigated to for optimistic active state.
  const [pendingParam, setPendingParam] = useState<{ key: string; value: string } | null>(null);

  const category = searchParams.get("category");
  const current = {
    category: category ?? "",
    price: searchParams.get("price") ?? "",
    sort: normaliseSortParam(searchParams.get("sort")),
    search: searchParams.get("search") ?? "",
    tag: searchParams.get("tag") ?? "",
  };

  const isAllCategories = current.category === "all";

  /** Returns true when this specific key+value is the optimistic target. */
  function isOptimistic(key: string, value: string) {
    return isPending && pendingParam?.key === key && pendingParam?.value === value;
  }

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      const href = `${pathname}?${params.toString()}`;
      setPendingParam({ key, value });
      beginResourcesNavigation("listing", href);
      startTransition(() => {
        router.push(href, { scroll: false });
      });
      // Keep outside startTransition — closes mobile dialog synchronously.
      onNavigate?.();
    },
    [router, pathname, searchParams, onNavigate]
  );

  const showClearAll = category && category !== "all";

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    params.set("category", "all");
    const href = `${pathname}?${params.toString()}`;
    setPendingParam({ key: "category", value: "all" });
    beginResourcesNavigation("listing", href);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
    onNavigate?.();
  }, [router, pathname, onNavigate]);

  return (
    <aside
      className={cn(
        "w-[280px] flex-shrink-0 space-y-4",
        // Subtle opacity while any navigation is in-flight
        isPending && "pointer-events-none opacity-70",
        className
      )}
      aria-busy={isPending}
    >
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
            {SORT_OPTIONS.map((opt) => {
              const optimistic = isOptimistic("sort", opt.value);
              const active = current.sort === opt.value || optimistic;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => updateParam("sort", opt.value)}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                      active
                        ? "bg-zinc-900 font-semibold text-white"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                      optimistic && "cursor-wait"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
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
                aria-pressed={isAllCategories || isOptimistic("category", "all")}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                  isAllCategories || isOptimistic("category", "all")
                    ? "bg-black font-semibold text-white"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                  isOptimistic("category", "all") && "cursor-wait"
                )}
              >
                All categories
              </button>
            </li>
            {categories.map((cat) => {
              const optimistic = isOptimistic("category", cat.slug);
              const active = current.category === cat.slug || optimistic;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => updateParam("category", cat.slug)}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                      active
                        ? "bg-zinc-900 font-semibold text-white"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                      optimistic && "cursor-wait"
                    )}
                  >
                    {cat.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      {/* ── Price ─────────────────────────────────────────────────── */}
      {showPrice && (
        <FilterGroup title="Price">
          <ul className="space-y-0.5">
            {PRICE_OPTIONS.map((opt) => {
              const optimistic = isOptimistic("price", opt.value);
              const active = current.price === opt.value || optimistic;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => updateParam("price", opt.value)}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-[13px] transition",
                      active
                        ? "bg-zinc-900 font-semibold text-white"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                      optimistic && "cursor-wait"
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterGroup>
      )}

      {/* ── Difficulty ────────────────────────────────────────────── */}
      <FilterGroup title="Difficulty">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((diff) => {
            const currentlyActive = current.tag === diff.value;
            const optimistic = isOptimistic("tag", diff.value);
            const active = currentlyActive || optimistic;
            return (
              <button
                key={diff.value}
                type="button"
                onClick={() => updateParam("tag", currentlyActive ? "" : diff.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                  optimistic && "cursor-wait"
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
            const currentlyActive = current.tag === type.value;
            const optimistic = isOptimistic("tag", type.value);
            const active = currentlyActive || optimistic;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateParam("tag", currentlyActive ? "" : type.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                  optimistic && "cursor-wait"
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
