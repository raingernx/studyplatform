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

  const buildHref = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  const prefetchHref = useCallback(
    (href: string) => {
      startTransition(() => {
        router.prefetch(href);
      });
    },
    [router],
  );

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
  }, [onNavigate, pathname, router]);

  return (
    <aside
      className={cn(
        "w-[260px] flex-shrink-0 space-y-5",
        // Subtle opacity while any navigation is in-flight
        isPending && "pointer-events-none opacity-70",
        className
      )}
      aria-busy={isPending}
    >
      {/* Header + clear */}
      {showHeader && (
        <div className="flex items-center justify-between border-b border-surface-200/80 pb-2">
          <p className="font-ui text-caption tracking-[0.12em] text-text-muted">
            Filters
          </p>
          {showClearAll && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-caption text-text-secondary transition hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
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
                    onMouseEnter={() => prefetchHref(buildHref("sort", opt.value))}
                    onFocus={() => prefetchHref(buildHref("sort", opt.value))}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-small transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                      active
                        ? "bg-primary-50 font-medium text-primary-700"
                        : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
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
                onMouseEnter={() => prefetchHref(buildHref("category", "all"))}
                onFocus={() => prefetchHref(buildHref("category", "all"))}
                aria-pressed={isAllCategories || isOptimistic("category", "all")}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left text-small transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                  isAllCategories || isOptimistic("category", "all")
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
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
                    onMouseEnter={() => prefetchHref(buildHref("category", cat.slug))}
                    onFocus={() => prefetchHref(buildHref("category", cat.slug))}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-small transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                      active
                        ? "bg-primary-50 font-medium text-primary-700"
                        : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
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
                    onMouseEnter={() => prefetchHref(buildHref("price", opt.value))}
                    onFocus={() => prefetchHref(buildHref("price", opt.value))}
                    aria-pressed={active}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-small transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                      active
                        ? "bg-primary-50 font-medium text-primary-700"
                        : "text-text-secondary hover:bg-surface-50 hover:text-text-primary",
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
                onMouseEnter={() =>
                  prefetchHref(buildHref("tag", currentlyActive ? "" : diff.value))
                }
                onFocus={() =>
                  prefetchHref(buildHref("tag", currentlyActive ? "" : diff.value))
                }
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-caption transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                  active
                    ? "border border-primary-200 bg-primary-50 text-primary-700"
                    : "border border-border-subtle bg-white text-text-secondary hover:border-surface-300 hover:bg-surface-50",
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
                onMouseEnter={() =>
                  prefetchHref(buildHref("tag", currentlyActive ? "" : type.value))
                }
                onFocus={() =>
                  prefetchHref(buildHref("tag", currentlyActive ? "" : type.value))
                }
                aria-pressed={active}
                className={cn(
                  "rounded-full px-3 py-1.5 text-caption transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2",
                  active
                    ? "border border-primary-200 bg-primary-50 text-primary-700"
                    : "border border-border-subtle bg-white text-text-secondary hover:border-surface-300 hover:bg-surface-50",
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
    <div className="border-b border-surface-200/80 pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-caption text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-offset-2"
      >
        <span>{title}</span>
        <span className="text-caption text-text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}
