"use client";

import { ResourceCard, type ResourceCardResource } from "@/design-system";
import type { LibraryItemClient } from "./LibraryGridClient";

/** Library grid layout: explicit responsive columns so cards stay wide. */
export const LIBRARY_GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch";

function toCardResource(item: LibraryItemClient): ResourceCardResource {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    authorName: item.authorName,
    previewUrl: item.previewUrl,
    description: "",
    tags: [],
    isFree: true,
    price: 0,
  };
}

interface LibraryGridProps {
  items: LibraryItemClient[];
}

/** Library grid of ResourceCards with variant="library". */
export function LibraryGrid({ items }: LibraryGridProps) {
  return (
    <div className={LIBRARY_GRID_CLASSES}>
      {items.map((item) => (
        <ResourceCard
          key={item.id + item.slug}
          resource={toCardResource(item)}
          variant="library"
        />
      ))}
    </div>
  );
}

export type { LibraryItemClient } from "./LibraryGridClient";
