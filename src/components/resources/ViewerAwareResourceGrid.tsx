"use client";

import type { ReactNode } from "react";
import { ResourceGrid } from "./ResourceGrid";
import type { ResourceCardData } from "./ResourceCard";
import { useResourcesViewerState } from "./ResourcesViewerStateProvider";

export function ViewerAwareResourceGrid({
  resources,
  total,
  page,
  totalPages,
  loading,
  hasActiveFilters,
  progressiveLoad,
  cardPrefetchMode,
  routeContext,
  emptyState,
}: {
  resources: ResourceCardData[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  hasActiveFilters?: boolean;
  progressiveLoad?: boolean;
  cardPrefetchMode?: "intent" | "viewport" | "none";
  routeContext?: {
    queryKey: string;
    clearFiltersHref: string;
    exploreAllHref: string;
    cardPrefetchScope: string;
  };
  emptyState?: ReactNode;
}) {
  const { ownedResourceIds } = useResourcesViewerState();

  return (
    <ResourceGrid
      resources={resources}
      ownedIds={ownedResourceIds}
      total={total}
      page={page}
      totalPages={totalPages}
      loading={loading}
      hasActiveFilters={hasActiveFilters}
      progressiveLoad={progressiveLoad}
      cardPrefetchMode={cardPrefetchMode}
      routeContext={routeContext}
      emptyState={emptyState}
    />
  );
}
