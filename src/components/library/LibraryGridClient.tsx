"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/design-system";
import { ResourceCard, type ResourceCardResource } from "@/components/resources/ResourceCard";
import { LIBRARY_GRID_CLASSES } from "./LibraryGrid";

type FilterKey = "all" | "pdf" | "worksheets" | "templates";

export interface LibraryResource {
  id: string;
  slug: string;
  title: string;
  authorName?: string | null;
  previewUrl?: string | null;
  downloadedAt: Date;
  /** MIME type of the primary file — used to decide whether to show a Preview CTA. */
  mimeType?: string | null;
}

export interface LibraryItemClient extends LibraryResource {
  type: "PDF" | "DOCUMENT";
  categorySlug?: string | null;
}

function toCardResource(item: LibraryItemClient): ResourceCardResource {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    authorName: item.authorName,
    previewUrl: item.previewUrl,
    downloadedAt: item.downloadedAt,
    mimeType: item.mimeType,
    description: "",
    tags: [],
    isFree: true,
    price: 0,
  };
}

interface PreparedLibraryItem {
  key: string;
  item: LibraryItemClient;
  cardResource: ResourceCardResource;
  titleLower: string;
  authorLower: string;
  categorySlugLower: string;
}

interface LibraryGridClientProps {
  items: LibraryItemClient[];
}

export function LibraryGridClient({ items }: LibraryGridClientProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const preparedItems = useMemo<PreparedLibraryItem[]>(
    () =>
      items.map((item) => ({
        key: `${item.id}${item.slug}`,
        item,
        cardResource: toCardResource(item),
        titleLower: item.title.toLowerCase(),
        authorLower: (item.authorName ?? "").toLowerCase(),
        categorySlugLower: item.categorySlug?.toLowerCase() ?? "",
      })),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return preparedItems.filter((entry) => {
      const matchesSearch =
        q.length === 0 ||
        entry.titleLower.includes(q) ||
        entry.authorLower.includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;

      if (activeFilter === "pdf") {
        return entry.item.type === "PDF";
      }

      if (activeFilter === "worksheets") {
        return entry.categorySlugLower.includes("worksheet");
      }

      if (activeFilter === "templates") {
        return entry.categorySlugLower.includes("template");
      }

      return true;
    });
  }, [preparedItems, search, activeFilter]);

  const makeFilterButtonClass = (key: FilterKey) =>
    [
      "rounded-full px-3 py-1.5 text-small font-medium transition-colors whitespace-nowrap",
      activeFilter === key
        ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200"
        : "bg-card text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground",
    ].join(" ");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-caption font-semibold text-muted-foreground">Library tools</p>
            <p className="text-small text-muted-foreground">
              Search by title or creator, then narrow your library by format.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span className="font-medium text-foreground">{filteredItems.length}</span>
            <span>{filteredItems.length === 1 ? "result" : "results"}</span>
            {search.trim().length > 0 || activeFilter !== "all" ? (
              <>
                <span aria-hidden>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                  }}
                  className="font-medium text-primary-700 transition hover:text-primary-800"
                >
                  Clear filters
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput
            placeholder="Search your library by title or creator"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            containerClassName="min-w-0 flex-1"
            className="bg-muted"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-2 px-1 text-caption font-medium text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </span>
            <button
              type="button"
              className={makeFilterButtonClass("all")}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              className={makeFilterButtonClass("pdf")}
              onClick={() => setActiveFilter("pdf")}
            >
              PDF
            </button>
            <button
              type="button"
              className={makeFilterButtonClass("worksheets")}
              onClick={() => setActiveFilter("worksheets")}
            >
              Worksheets
            </button>
            <button
              type="button"
              className={makeFilterButtonClass("templates")}
              onClick={() => setActiveFilter("templates")}
            >
              Templates
            </button>
          </div>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className={LIBRARY_GRID_CLASSES}>
          {filteredItems.map(({ key, cardResource }) => (
            <ResourceCard
              key={key}
              resource={cardResource}
              variant="library"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="mt-3 text-small font-medium text-foreground">
            No matching resources
          </p>
          <p className="mt-1 max-w-sm text-caption leading-6 text-muted-foreground">
            Try another title, creator name, or filter to find what you need faster.
          </p>
        </div>
      )}
    </div>
  );
}
