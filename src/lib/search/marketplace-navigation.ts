import { SEARCH_SORT_OPTION } from "@/config/sortOptions";
import { routes } from "@/lib/routes";

const MARKETPLACE_FILTER_KEYS = ["category", "price", "featured", "tag"] as const;

type SearchParamLike = {
  get(key: string): string | null;
};

function normaliseQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

function isMarketplaceBrowsePath(pathname: string) {
  return pathname === routes.marketplace;
}

function copyMarketplaceListingFilters(searchParams: SearchParamLike) {
  const params = new URLSearchParams();

  for (const key of MARKETPLACE_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export function buildMarketplaceSearchHref({
  pathname,
  searchParams,
  query,
}: {
  pathname: string;
  searchParams: SearchParamLike;
  query: string;
}) {
  const trimmedQuery = normaliseQuery(query);
  const params = isMarketplaceBrowsePath(pathname)
    ? copyMarketplaceListingFilters(searchParams)
    : new URLSearchParams();

  if (trimmedQuery) {
    params.set("search", trimmedQuery);
    // Reset to the default "Best match" behavior for a new search.
    params.delete("sort");
  } else if (isMarketplaceBrowsePath(pathname)) {
    const currentSort = searchParams.get("sort");
    if (currentSort && currentSort !== SEARCH_SORT_OPTION.value) {
      params.set("sort", currentSort);
    }
  }

  return routes.marketplaceQuery(params);
}

export function buildMarketplaceSuggestionsHref({
  pathname,
  searchParams,
  query,
}: {
  pathname: string;
  searchParams: SearchParamLike;
  query: string;
}) {
  const trimmedQuery = normaliseQuery(query);
  if (trimmedQuery.length < 2) {
    return null;
  }

  const params = new URLSearchParams();

  if (isMarketplaceBrowsePath(pathname)) {
    const category = searchParams.get("category");
    if (category && category !== "all") {
      params.set("category", category);
    }
  }

  params.set("q", trimmedQuery);
  params.set("limit", "6");

  return `/api/search?${params.toString()}`;
}

export function buildMarketplaceSearchRecoveryHref(query: string) {
  const trimmedQuery = normaliseQuery(query);
  if (trimmedQuery.length < 2) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("q", trimmedQuery);
  return `/api/search/recovery?${params.toString()}`;
}

export function buildMarketplaceClearSearchHref({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: SearchParamLike;
}) {
  if (!isMarketplaceBrowsePath(pathname)) {
    return routes.marketplace;
  }

  return buildMarketplaceSearchHref({
    pathname,
    searchParams,
    query: "",
  });
}

export function getMarketplaceInitialSearchValue({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: SearchParamLike;
}) {
  if (!isMarketplaceBrowsePath(pathname)) {
    return "";
  }

  return searchParams.get("search") ?? "";
}

export function shouldSyncMarketplaceSearchValue(pathname: string) {
  return isMarketplaceBrowsePath(pathname);
}
