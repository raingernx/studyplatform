"use client";

import { useRef, Suspense } from "react";
import { Search } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton, type ResourceCardData } from "./ResourceCard";
import { ResourcePagination } from "./ResourcePagination";

export const RESOURCE_GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch";

interface ResourceGridProps {
  resources: ResourceCardData[];
  ownedIds?: string[];
  total: number;
  page: number;
  totalPages: number;
  /** Pass true while a parent is streaming / loading */
  loading?: boolean;
}

export function ResourceGrid({
  resources,
  ownedIds = [],
  total,
  page,
  totalPages,
  loading = false,
}: ResourceGridProps) {
  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-4 w-32 rounded skeleton" />
        <div className={RESOURCE_GRID_CLASSES}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ResourceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2
                      border-dashed border-zinc-200 py-24 text-center animate-fade-in">
        <Search className="mb-3 h-10 w-10 text-zinc-300" />
        <p className="text-base font-semibold text-zinc-500">No resources found</p>
        <p className="mt-1 text-sm text-zinc-400">Try adjusting your filters or search term</p>
      </div>
    );
  }

  const gridContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={gridContainerRef} className="space-y-6 animate-fade-in">
      {/* ── Grid: consistent height, no vertical stretch; 16:10 thumb prevents layout shift ── */}
      <div className={RESOURCE_GRID_CLASSES}>
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            variant="marketplace"
            owned={ownedIds.includes(resource.id)}
          />
        ))}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <ResourcePagination
          page={page}
          totalPages={totalPages}
          gridContainerRef={gridContainerRef}
        />
      </Suspense>
    </div>
  );
}

