"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Card } from "@/design-system";

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
}

export interface FilterTag {
  id: string;
  name: string;
  slug: string;
}

interface ResourceFiltersProps {
  categories: FilterCategory[];
  tags:       FilterTag[];
}

const PRICE_OPTIONS = [
  { value: "all",  label: "All Prices" },
  { value: "free", label: "Free Only" },
  { value: "paid", label: "Paid Only" },
] as const;

const TYPE_OPTIONS = [
  { value: "all",       label: "All Types" },
  { value: "guide",     label: "Guides" },
  { value: "template",  label: "Templates" },
  { value: "practice",  label: "Practice Sets" },
  { value: "notes",     label: "Notes" },
] as const;

export function ResourceFilters({ categories, tags }: ResourceFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") ?? "";
  const activePrice    = searchParams.get("price") ?? "all";
  const activeType     = searchParams.get("type") ?? "all";
  const activeFeatured = searchParams.get("featured") === "true";
  const activeTag      = searchParams.get("tag") ?? "";

  const hasFilters =
    activeCategory ||
    (activePrice && activePrice !== "all") ||
    (activeType && activeType !== "all") ||
    activeFeatured ||
    activeTag;

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["category", "price", "type", "featured", "tag", "page"].forEach((k) =>
      params.delete(k)
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="w-full">
      <Card className="sticky top-6 p-5 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-text-muted
                       transition-colors hover:text-text-primary"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* ── Category ───────────────────────────────────────────────── */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Category
        </p>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => updateParam("category", null)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ease-out",
                  !activeCategory
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100"
                )}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() =>
                  updateParam(
                    "category",
                    activeCategory === cat.slug ? null : cat.slug
                  )
                }
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ease-out",
                  activeCategory === cat.slug
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100"
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Price ──────────────────────────────────────────────────── */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Price
        </p>
        <ul className="space-y-0.5">
          {PRICE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => updateParam("price", opt.value)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ease-out",
                  activePrice === opt.value ||
                    (opt.value === "all" && !searchParams.get("price"))
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100"
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Type ───────────────────────────────────────────────────── */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Type
        </p>
        <ul className="space-y-0.5">
          {TYPE_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => updateParam("type", opt.value)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 ease-out",
                  activeType === opt.value ||
                    (opt.value === "all" && !searchParams.get("type"))
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100"
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Featured ───────────────────────────────────────────────── */}
      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Featured
        </p>
        <button
          onClick={() => updateParam("featured", activeFeatured ? null : "true")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out",
            activeFeatured
              ? "bg-brand-50 text-brand-700 font-medium"
              : "text-text-secondary hover:bg-muted-100"
          )}
        >
          {/* Custom checkbox */}
          <span
            className={cn(
              "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
              activeFeatured
                ? "border-brand-500 bg-brand-500"
                : "border-border-subtle"
            )}
          >
            {activeFeatured && (
              <svg
                viewBox="0 0 10 8"
                className="h-2.5 w-2.5 fill-none text-white"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 4l2.5 2.5L9 1" />
              </svg>
            )}
          </span>
          Featured only
        </button>
      </section>

      {/* ── Tags ───────────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Tags
          </p>

          {/* Active-tag pill + dismiss — shown above the list when a tag is selected */}
          {activeTag && (
            <div className="mb-2 flex items-center gap-1.5">
              <Badge variant="neutral" className="bg-violet-100 text-violet-700">
                {tags.find((t) => t.slug === activeTag)?.name ?? activeTag}
              </Badge>
              <button
                onClick={() => updateParam("tag", null)}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center
                           rounded-full text-zinc-400 transition-colors hover:text-zinc-700"
                aria-label="Remove tag filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Popular tag pills */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t.slug}
                onClick={() =>
                  updateParam("tag", activeTag === t.slug ? null : t.slug)
                }
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  activeTag === t.slug
                    ? "bg-brand-500 text-white"
                    : "bg-muted-100 text-text-secondary hover:bg-muted-200"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </section>
      )}

      </Card>
    </aside>
  );
}
