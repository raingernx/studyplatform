"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/design-system";
import { IntentPrefetchLink } from "@/components/navigation/IntentPrefetchLink";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { routes } from "@/lib/routes";
import { ResourceCard, ResourceCardSkeleton, type ResourceCardData } from "./ResourceCard";

// Auto-fill: cards are at least 280 px wide and grow equally to fill available space.
// Naturally produces ~2 cols on mobile, ~3 on tablet, ~4-5 on desktop, ~5-6 on 1600px.
export const RESOURCE_GRID_CLASSES =
  "grid items-stretch gap-5 lg:gap-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]";

const LISTING_BATCH_SIZE = 12;
const DeferredOwnedIdsContext = createContext<((ownedIds: string[]) => void) | null>(null);

interface ResourceGridProps {
  resources: ResourceCardData[];
  ownedIds?: string[];
  total: number;
  page: number;
  totalPages: number;
  /** Pass true while a parent is streaming / loading */
  loading?: boolean;
  /**
   * True when search, price, sort (non-default), tag, or featured filters are
   * active. Changes the empty state copy to guide the user toward clearing
   * filters rather than implying no content exists in the section.
   */
  hasActiveFilters?: boolean;
  progressiveLoad?: boolean;
  cardPrefetchMode?: "intent" | "viewport" | "none";
  badgeNodes?: Array<ReactNode | null>;
  deferredOwnedIdsHydrator?: ReactNode;
  emptyState?: ReactNode;
  routeContext?: {
    queryKey: string;
    clearFiltersHref: string;
    exploreAllHref: string;
    cardPrefetchScope: string;
  };
}

export function ResourceGridOwnedIdsHydrator({ ownedIds }: { ownedIds: string[] }) {
  const setDeferredOwnedIds = useContext(DeferredOwnedIdsContext);

  useEffect(() => {
    setDeferredOwnedIds?.(ownedIds);
  }, [ownedIds, setDeferredOwnedIds]);

  return null;
}

function ResourceGridWithClientRouteContext(props: ResourceGridProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const category = searchParams.get("category");
  const clearFiltersParams = new URLSearchParams();
  if (category) clearFiltersParams.set("category", category);
  const clearFiltersHref = clearFiltersParams.size > 0
    ? `${pathname}?${clearFiltersParams.toString()}`
    : pathname;
  const queryKey = `${pathname}?${searchParams.toString()}`;

  return (
    <ResourceGridBody
      {...props}
      routeContext={{
        queryKey,
        clearFiltersHref,
        exploreAllHref: routes.marketplace,
        cardPrefetchScope: `resource-card-grid:${queryKey}`,
      }}
    />
  );
}

function ResourceGridBody({
  resources,
  ownedIds = [],
  total,
  page,
  totalPages,
  loading = false,
  hasActiveFilters = false,
  progressiveLoad = false,
  cardPrefetchMode = "viewport",
  badgeNodes,
  deferredOwnedIdsHydrator,
  emptyState,
  routeContext,
}: ResourceGridProps) {
  const {
    queryKey,
    clearFiltersHref,
    exploreAllHref,
    cardPrefetchScope,
  } = routeContext!;
  const [loadState, setLoadState] = useState(() => ({
    queryKey,
    appendedResources: [] as ResourceCardData[],
    nextPage: page + 1,
    isLoadingMore: false,
  }));
  const [deferredOwnedIds, setDeferredOwnedIds] = useState<string[] | null>(null);
  const effectiveOwnedIds = deferredOwnedIds ?? ownedIds;
  const ownedIdSet = new Set(effectiveOwnedIds);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-4 w-32" />
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
    if (emptyState) {
      return emptyState;
    }

    if (hasActiveFilters) {
      return (
        <div className="rounded-2xl border border-border-subtle bg-white px-6 py-14 text-center sm:px-8 sm:py-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50">
            <Search className="h-7 w-7 text-zinc-300" />
          </div>
          <p className="mt-5 text-lg font-semibold tracking-tight text-zinc-900">
            Nothing matched these filters
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Try a broader keyword or clear a few filters to reopen the full library.
          </p>
          <IntentPrefetchLink
            href={clearFiltersHref}
            resourcesNavigationMode="auto"
            className="mt-5 inline-flex items-center rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
          >
            Clear filters
          </IntentPrefetchLink>
        </div>
      );
    }

    return (
        <div className="rounded-2xl border border-border-subtle bg-white px-6 py-14 text-center sm:px-8 sm:py-16">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-200 bg-surface-50">
          <BookOpen className="h-7 w-7 text-zinc-300" />
        </div>
        <p className="mt-5 text-lg font-semibold tracking-tight text-zinc-900">
          No resources here yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
          This collection is still growing. Explore the full library or check back soon for new releases.
        </p>
        <IntentPrefetchLink
          href={exploreAllHref}
          resourcesNavigationMode="discover"
          className="mt-5 inline-flex items-center rounded-full border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-text-primary transition hover:border-surface-300 hover:bg-surface-50"
        >
          Explore all resources
        </IntentPrefetchLink>
      </div>
    );
  }
  const isSameQuery = loadState.queryKey === queryKey;
  const appendedResources = isSameQuery ? loadState.appendedResources : [];
  const nextPage = isSameQuery ? loadState.nextPage : page + 1;
  const isLoadingMore = isSameQuery ? loadState.isLoadingMore : false;
  const displayedResources = progressiveLoad
    ? [...resources, ...appendedResources]
    : resources;
  const loadedCount = displayedResources.length;
  const hasMore = progressiveLoad && loadedCount < total && nextPage <= totalPages;

  async function handleLoadMore() {
    if (!hasMore || isLoadingMore) {
      return;
    }

    setLoadState((current) => ({
      queryKey,
      appendedResources:
        current.queryKey === queryKey ? current.appendedResources : [],
      nextPage,
      isLoadingMore: true,
    }));

    try {
      const requestQueryKey = queryKey;
      const requestPage = nextPage;
      const params = new URLSearchParams(queryKey.split("?")[1] ?? "");
      params.set("page", String(requestPage));
      params.set("pageSize", String(LISTING_BATCH_SIZE));

      const response = await fetch(`/api/resources?${params.toString()}`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to load more resources");
      }

      const json = await response.json();
      const nextResources = (json.data?.resources ?? json.data?.items ?? []) as ResourceCardData[];

      setLoadState((current) => {
        if (current.queryKey !== requestQueryKey) {
          return current;
        }

        const seen = new Set([
          ...resources.map((resource) => resource.id),
          ...current.appendedResources.map((resource) => resource.id),
        ]);

        return {
          queryKey: requestQueryKey,
          appendedResources: [
            ...current.appendedResources,
            ...nextResources.filter((resource) => !seen.has(resource.id)),
          ],
          nextPage: current.nextPage + 1,
          isLoadingMore: false,
        };
      });
    } finally {
      setLoadState((current) => {
        if (current.queryKey !== queryKey) {
          return current;
        }

        return {
          ...current,
          isLoadingMore: false,
        };
      });
    }
  }

  return (
    <DeferredOwnedIdsContext.Provider value={setDeferredOwnedIds}>
      {deferredOwnedIdsHydrator}
      <div className="space-y-8">
      {/* ── Grid: consistent height, no vertical stretch; 16:10 thumb prevents layout shift ── */}
        <div className={RESOURCE_GRID_CLASSES}>
          {displayedResources.map((resource, index) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              variant="marketplace"
              owned={ownedIdSet.has(resource.id)}
              linkPrefetchMode={cardPrefetchMode}
              linkPrefetchScope={cardPrefetchScope}
              badge={badgeNodes?.[index]}
            />
          ))}
        </div>

        {progressiveLoad ? (
          <div className="flex flex-col items-center gap-3 border-t border-surface-200/80 pt-5">
            <p className="text-small text-text-secondary">
              Showing {loadedCount} of {total} resource{total === 1 ? "" : "s"}
            </p>

            {hasMore ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
                loading={isLoadingMore}
              >
                {isLoadingMore ? "Loading more…" : "Load more"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </DeferredOwnedIdsContext.Provider>
  );
}

export function ResourceGrid(props: ResourceGridProps) {
  if (props.routeContext) {
    return <ResourceGridBody {...props} />;
  }

  return <ResourceGridWithClientRouteContext {...props} />;
}
