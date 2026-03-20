"use client";

import { useRef, Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ResourceCard, ResourceCardSkeleton, type ResourceCardData } from "./ResourceCard";
import { ResourcePagination } from "./ResourcePagination";

export const RESOURCE_GRID_CLASSES =
  "grid grid-cols-1 gap-4 items-stretch sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6";

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
      <div className="animate-fade-in rounded-[28px] border border-surface-200 bg-white px-6 py-16 text-center shadow-card sm:px-8 sm:py-20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50">
          <Search className="h-7 w-7 text-zinc-300" />
        </div>
        <p className="mt-5 text-lg font-semibold tracking-tight text-zinc-900">No resources found</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          Try broadening your filters or return to the main library to start a wider browse.
        </p>
        <Link
          href="/resources"
          className="mt-5 inline-flex items-center rounded-full border border-surface-200 bg-surface-50 px-4 py-2 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-white"
        >
          Browse all resources
        </Link>
      </div>
    );
  }

  const gridContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={gridContainerRef} className="space-y-8 animate-fade-in">
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
