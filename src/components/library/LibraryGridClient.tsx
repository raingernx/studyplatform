"use client";

import { useMemo, useState } from "react";
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

interface LibraryGridClientProps {
  items: LibraryItemClient[];
}

export function LibraryGridClient({ items }: LibraryGridClientProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        q.length === 0 ||
        item.title.toLowerCase().includes(q) ||
        (item.authorName ?? "").toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;

      if (activeFilter === "pdf") {
        return item.type === "PDF";
      }

      const slug = item.categorySlug?.toLowerCase() ?? "";

      if (activeFilter === "worksheets") {
        return slug.includes("worksheet");
      }

      if (activeFilter === "templates") {
        return slug.includes("template");
      }

      return true;
    });
  }, [items, search, activeFilter]);

  const makeFilterButtonClass = (key: FilterKey) =>
    [
      "text-sm font-medium transition-colors",
      "rounded-full px-3 py-1",
      activeFilter === key
        ? "bg-brand-600 text-white"
        : "bg-white text-text-secondary border border-border-subtle hover:bg-surface-50",
    ].join(" ");

  return (
    <div>
      <div className="mb-6 max-w-md">
        <input
          type="search"
          placeholder="Search your library by title or creator"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="mb-6 flex gap-3">
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

      <div className={LIBRARY_GRID_CLASSES}>
        {filteredItems.map((item) => (
          <ResourceCard
            key={item.id + item.slug}
            resource={toCardResource(item)}
            variant="library"
          />
        ))}
      </div>
    </div>
  );
}

