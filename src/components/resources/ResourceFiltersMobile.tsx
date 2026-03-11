"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { FilterCategory, FilterTag } from "./ResourceFilters";
import { cn } from "@/lib/utils";

interface ResourceFiltersMobileProps {
  categories: FilterCategory[];
  tags: FilterTag[];
}

type SectionKey = "category" | "price" | "type" | "tags" | "featured" | null;

const PRICE_OPTIONS = [
  { value: "all",  label: "All prices" },
  { value: "free", label: "Free only" },
  { value: "paid", label: "Paid only" },
] as const;

const TYPE_OPTIONS = [
  { value: "all",      label: "All types" },
  { value: "guide",    label: "Guides" },
  { value: "template", label: "Templates" },
  { value: "practice", label: "Practice sets" },
  { value: "notes",    label: "Notes" },
] as const;

export function ResourceFiltersMobile({
  categories,
  tags,
}: ResourceFiltersMobileProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openSection, setOpenSection] = useState<SectionKey>(null);

  const activeCategory = searchParams.get("category") ?? "";
  const activePrice = searchParams.get("price") ?? "all";
  const activeType = searchParams.get("type") ?? "all";
  const activeFeatured = searchParams.get("featured") === "true";
  const activeTag = searchParams.get("tag") ?? "";

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
      params.delete(k),
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSection(key: SectionKey) {
    setOpenSection((current) => (current === key ? null : key));
  }

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm lg:hidden">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" />
          Filters
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <section>
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-text-primary"
        >
          <span>Category</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              openSection === "category" && "rotate-180",
            )}
          />
        </button>
        {openSection === "category" && (
          <div className="mt-2 space-y-1 px-1">
            <button
              onClick={() => updateParam("category", null)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm",
                !activeCategory
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-text-secondary hover:bg-muted-100",
              )}
            >
              All categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  updateParam(
                    "category",
                    activeCategory === cat.slug ? null : cat.slug,
                  )
                }
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  activeCategory === cat.slug
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Price */}
      <section>
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-text-primary"
        >
          <span>Price</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              openSection === "price" && "rotate-180",
            )}
          />
        </button>
        {openSection === "price" && (
          <div className="mt-2 space-y-1 px-1">
            {PRICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("price", opt.value)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  activePrice === opt.value ||
                    (opt.value === "all" && !searchParams.get("price"))
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Type */}
      <section>
        <button
          type="button"
          onClick={() => toggleSection("type")}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-text-primary"
        >
          <span>Type</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              openSection === "type" && "rotate-180",
            )}
          />
        </button>
        {openSection === "type" && (
          <div className="mt-2 space-y-1 px-1">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("type", opt.value)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  activeType === opt.value ||
                    (opt.value === "all" && !searchParams.get("type"))
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-text-secondary hover:bg-muted-100",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      <section>
        <button
          type="button"
          onClick={() => toggleSection("featured")}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-text-primary"
        >
          <span>Featured</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform",
              openSection === "featured" && "rotate-180",
            )}
          />
        </button>
        {openSection === "featured" && (
          <div className="mt-2 px-1">
            <button
              onClick={() =>
                updateParam("featured", activeFeatured ? null : "true")
              }
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                activeFeatured
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-text-secondary hover:bg-muted-100",
              )}
            >
              <span>Featured only</span>
              <span
                className={cn(
                  "inline-flex h-4 w-7 items-center rounded-full border border-border-subtle bg-white p-0.5 transition-colors",
                  activeFeatured && "border-brand-500 bg-brand-500/10",
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full bg-border-subtle transition-transform",
                    activeFeatured && "translate-x-3 bg-brand-500",
                  )}
                />
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Tags */}
      {tags.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => toggleSection("tags")}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-text-primary"
          >
            <span>Tags</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform",
                openSection === "tags" && "rotate-180",
              )}
            />
          </button>
          {openSection === "tags" && (
            <div className="mt-2 flex flex-wrap gap-1.5 px-1">
              {tags.map((t) => (
                <button
                  key={t.slug}
                  onClick={() =>
                    updateParam("tag", activeTag === t.slug ? null : t.slug)
                  }
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    activeTag === t.slug
                      ? "bg-brand-500 text-white"
                      : "bg-muted-100 text-text-secondary hover:bg-muted-200",
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

