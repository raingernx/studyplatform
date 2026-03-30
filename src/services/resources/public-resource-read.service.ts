import {
  getMarketplaceResources,
  getPublicResourcePageData,
  getResourceMetadataBySlug,
  type MarketplaceFilters,
} from "@/services/resource.service";
import {
  createOwnedResource,
  getCachedNewResourcesInCategories,
  getCachedRecommendedResourcesByLevels,
  getDashboardOverviewRecommendations,
  getNewResourcesInCategories,
  getRecommendedResources,
  getRecommendedResourcesByLevels,
  listPublicResources,
  type ListPublicResourcesInput,
} from "@/services/resources/resource.service";

/**
 * Canonical public read surface for marketplace and user-facing resource flows.
 *
 * This keeps route/page owners from importing both legacy resource service
 * owners directly while leaving the underlying query implementations intact.
 */
export type { MarketplaceFilters, ListPublicResourcesInput };

export {
  createOwnedResource,
  getCachedNewResourcesInCategories,
  getCachedRecommendedResourcesByLevels,
  getDashboardOverviewRecommendations,
  getMarketplaceResources,
  getNewResourcesInCategories,
  getPublicResourcePageData,
  getRecommendedResources,
  getRecommendedResourcesByLevels,
  getResourceMetadataBySlug,
  listPublicResources,
};
