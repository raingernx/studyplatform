"use client";

import { Search } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton, type ResourceCardData } from "./ResourceCard";
import { ResourcePagination } from "./ResourcePagination";

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
      <div className="mt-6 min-h-[200px] space-y-4 animate-fade-in">
        <div className="h-4 w-32 rounded skeleton" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
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
      <div className="mt-6 min-h-[200px] flex flex-col items-center justify-center rounded-2xl border-2
                      border-dashed border-zinc-200 py-24 text-center animate-fade-in">
        <Search className="mb-3 h-10 w-10 text-zinc-300" />
        <p className="text-base font-semibold text-zinc-500">No resources found</p>
        <p className="mt-1 text-sm text-zinc-400">Try adjusting your filters or search term</p>
      </div>
    );
  }

  return (
    <div className="mt-6 min-h-[200px] space-y-6 animate-fade-in">

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
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
      <ResourcePagination page={page} totalPages={totalPages} />
    </div>
  );
}

