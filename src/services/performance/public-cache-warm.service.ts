import { findResourceById } from "@/repositories/resources/resource.repository";
import {
  deleteMarketplaceListingTotalRedisKeys,
  deleteMarketplaceNewestListingRedisKeys,
  deleteMarketplaceRecommendedListingRedisKeys,
} from "@/lib/cache";
import { logPerformanceEvent, withPerformanceTiming } from "@/lib/performance/observability";
import {
  getCreatorPublicMetadata,
  getCreatorPublicProfile,
  getCreatorPublicResources,
  getCreatorPublicShell,
} from "@/services/creator";
import {
  getDiscoverCategories,
  getDiscoverCollectionsData,
  getDiscoverData,
  getDiscoverLeadData,
  type DiscoverCollectionsData,
  type DiscoverLeadData,
} from "@/services/discover";
import {
  MARKETPLACE_DEFAULT_PAGE,
  getMarketplaceResources,
  getRelatedResources,
  getResourceBySlug,
  getResourceDetailBodyContent,
  getResourceDetailFooterContent,
  getResourceDetailPurchaseMetaBySlug,
  getResourceMetadataBySlug,
  type MarketplaceFilters,
} from "@/services/resources";
import { getResourceTrustSummary } from "@/services/reviews";
import { getResourceReviews } from "@/services/reviews";
import { DEFAULT_SORT } from "@/config/sortOptions";
import { MARKETPLACE_LISTING_PAGE_SIZE } from "@/config/marketplace";

const PUBLIC_WARM_LIMITS = {
  resourceDetails: 8,
  trustSummaries: 4,
  creatorProfiles: 2,
} as const;

const MARKETPLACE_WARM_VARIANTS: readonly MarketplaceFilters[] = [
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_LISTING_PAGE_SIZE },
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_LISTING_PAGE_SIZE, sort: DEFAULT_SORT },
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_LISTING_PAGE_SIZE, sort: "newest" },
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_LISTING_PAGE_SIZE, sort: "recommended" },
];

type ResourceWarmTarget = {
  id?: string | null;
  slug: string;
};

interface WarmedTargetSummary {
  marketplaceVariants: string[];
  resourceSlugs: string[];
  creatorIdentifiers: string[];
}

interface WarmCountSummary {
  discover: number;
  marketplaceVariants: number;
  resourceDetails: number;
  trustSummaries: number;
  creatorProfiles: number;
}

interface WarmResult {
  counts: WarmCountSummary;
  warmedTargets: WarmedTargetSummary;
}

export interface WarmPublicCacheOptions {
  trigger?: string;
}

export interface WarmTargetedPublicCacheOptions {
  trigger?: string;
  includeListings?: boolean;
  includeTrustSummaries?: boolean;
  resourceIds?: string[];
  resourceTargets?: ResourceWarmTarget[];
  creatorIdentifiers?: string[];
}

function pushUniqueString(
  values: string[],
  seen: Set<string>,
  candidate: string | null | undefined,
) {
  const normalized = candidate?.trim();
  if (!normalized || seen.has(normalized)) {
    return;
  }

  seen.add(normalized);
  values.push(normalized);
}

function pushUniqueResourceTarget(
  values: ResourceWarmTarget[],
  seen: Set<string>,
  candidate: ResourceWarmTarget | null | undefined,
) {
  const slug = candidate?.slug?.trim();
  if (!slug || seen.has(slug)) {
    return;
  }

  seen.add(slug);
  values.push({
    slug,
    id: candidate?.id ?? null,
  });
}

function describeMarketplaceVariant(filters: MarketplaceFilters) {
  const category = filters.category ?? "all";

  if (!filters.sort) {
    return `default:${DEFAULT_SORT}:${category}`;
  }

  return `${filters.sort}:${category}`;
}

function buildRecommendedMarketplaceVariant(
  category: string | null | undefined,
): MarketplaceFilters {
  return {
    category: category ?? "all",
    page: MARKETPLACE_DEFAULT_PAGE,
    pageSize: MARKETPLACE_LISTING_PAGE_SIZE,
    sort: "recommended",
  };
}

function buildMarketplaceWarmVariants(categorySlugs: string[] = []) {
  const uniqueCategorySlugs = Array.from(
    new Set(
      categorySlugs
        .map((categorySlug) => categorySlug?.trim())
        .filter(
          (categorySlug): categorySlug is string =>
            typeof categorySlug === "string" && categorySlug.length > 0,
        ),
    ),
  );

  return [
    ...MARKETPLACE_WARM_VARIANTS,
    ...uniqueCategorySlugs.map((categorySlug) =>
      buildRecommendedMarketplaceVariant(categorySlug),
    ),
  ];
}

function summarizeResult(
  counts: WarmCountSummary,
  warmedTargets: WarmedTargetSummary,
): WarmResult {
  return {
    counts,
    warmedTargets,
  };
}

function logWarmSummary(kind: "full" | "targeted", trigger: string, result: WarmResult) {
  logPerformanceEvent(`public_cache_warm:${kind}`, {
    trigger,
    ...result.counts,
    resourceSlugs: result.warmedTargets.resourceSlugs.length,
    creatorIdentifiers: result.warmedTargets.creatorIdentifiers.length,
    marketplaceVariantNames: result.warmedTargets.marketplaceVariants,
  });
}

async function resolveResourceTargetsFromIds(resourceIds: string[]) {
  const uniqueIds = Array.from(new Set(resourceIds.map((value) => value.trim()).filter(Boolean)));
  if (uniqueIds.length === 0) {
    return [];
  }

  const rows = await Promise.all(uniqueIds.map((resourceId) => findResourceById(resourceId)));

  return rows
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
    }));
}

function collectDiscoverWarmTargets(
  discoverData: WarmDiscoverData,
  resourceTargets: ResourceWarmTarget[],
  resourceSeen: Set<string>,
  creatorIdentifiers: string[],
  creatorSeen: Set<string>,
) {
  const sections = [
    discoverData.trending,
    discoverData.featured,
    discoverData.newReleases,
    discoverData.recommended,
    discoverData.mostDownloaded,
  ];

  sections.forEach((section) => {
    section.forEach((resource) => {
      pushUniqueResourceTarget(resourceTargets, resourceSeen, {
        id: resource.id,
        slug: resource.slug,
      });
    });
  });

  pushUniqueString(
    creatorIdentifiers,
    creatorSeen,
    discoverData.topCreator?.creator.creatorSlug,
  );
}

function collectMarketplaceWarmTargets(
  marketplaceResults: Array<Awaited<ReturnType<typeof getMarketplaceResources>>>,
  resourceTargets: ResourceWarmTarget[],
  resourceSeen: Set<string>,
) {
  marketplaceResults.forEach((result) => {
    result.resources.forEach((resource) => {
      pushUniqueResourceTarget(resourceTargets, resourceSeen, {
        id: resource.id,
        slug: resource.slug,
      });
    });
  });
}

async function warmResourceDetails(
  targets: ResourceWarmTarget[],
  includeTrustSummaries: boolean,
) {
  const resourceShells = await Promise.all(
    targets.map((target) => getResourceBySlug(target.slug)),
  );

  const warmableTargets = resourceShells.flatMap((resource, index) => {
    const target = targets[index];

    if (!target || !resource || resource.status !== "PUBLISHED") {
      return [];
    }

    return [{ target, resource }] as const;
  });

  await Promise.all(
    warmableTargets.flatMap(({ target, resource }) => [
      getResourceMetadataBySlug(target.slug),
      getResourceDetailPurchaseMetaBySlug(target.slug),
      getResourceDetailBodyContent(target.slug),
      getResourceDetailFooterContent(target.slug),
      getResourceReviews(resource.id, 5),
      ...(resource.categoryId
        ? [getRelatedResources(resource.categoryId, resource.id, 4)]
        : []),
    ]),
  );

  const trustSummaryTargets = includeTrustSummaries
    ? warmableTargets
        .map(({ target, resource }) => ({
          slug: target.slug,
          id: target.id ?? resource.id,
        }))
        .filter((target): target is ResourceWarmTarget & { id: string } => typeof target.id === "string")
        .slice(0, PUBLIC_WARM_LIMITS.trustSummaries)
    : [];

  await Promise.all(
    trustSummaryTargets.map((target) => getResourceTrustSummary(target.id)),
  );

  return trustSummaryTargets;
}

async function warmCreatorProfiles(creatorIdentifiers: string[]) {
  await Promise.all(
    creatorIdentifiers.flatMap((identifier) => [
      getCreatorPublicMetadata(identifier),
      getCreatorPublicShell(identifier),
      getCreatorPublicResources(identifier),
      getCreatorPublicProfile(identifier),
    ]),
  );
}

async function resolveRecommendedListingCategorySlugs(
  targets: ResourceWarmTarget[],
) {
  if (targets.length === 0) {
    return [];
  }

  const pages = await Promise.all(
    targets.map((target) => getResourceBySlug(target.slug)),
  );

  return Array.from(
    new Set(
      pages
        .map((resource) => resource?.category?.slug?.trim())
        .filter(
          (categorySlug): categorySlug is string =>
            typeof categorySlug === "string" && categorySlug.length > 0,
        ),
    ),
  );
}

export async function warmPublicCaches(
  options: WarmPublicCacheOptions = {},
) {
  const trigger = options.trigger ?? "manual";

  return withPerformanceTiming(
    "public_cache_warm_full",
    { trigger },
    async () => {
      let marketplaceResults: Array<Awaited<ReturnType<typeof getMarketplaceResources>>> = [];
      const [
        discoverCategories,
        discoverLeadData,
        discoverCollectionsData,
      ] = await Promise.all([
        getDiscoverCategories(),
        getDiscoverLeadData(),
        getDiscoverCollectionsData(),
      ]);
      const marketplaceWarmVariants = buildMarketplaceWarmVariants(
        discoverCategories.map((category) => category.slug),
      );

      const resourceTargets: ResourceWarmTarget[] = [];
      const resourceSeen = new Set<string>();
      const creatorIdentifiers: string[] = [];
      const creatorSeen = new Set<string>();

      const warmDiscoverData: WarmDiscoverData = {
        trending: discoverLeadData.trending,
        recommended: discoverLeadData.recommended,
        newReleases: discoverCollectionsData.newReleases,
        featured: discoverCollectionsData.featured,
        mostDownloaded: discoverCollectionsData.mostDownloaded,
        topCreator: discoverCollectionsData.topCreator,
      };

      collectDiscoverWarmTargets(
        warmDiscoverData,
        resourceTargets,
        resourceSeen,
        creatorIdentifiers,
        creatorSeen,
      );

      marketplaceResults = await Promise.all(
        marketplaceWarmVariants.map((filters) => getMarketplaceResources(filters)),
      );

      collectMarketplaceWarmTargets(
        marketplaceResults,
        resourceTargets,
        resourceSeen,
      );

      const headResourceTargets = resourceTargets.slice(0, PUBLIC_WARM_LIMITS.resourceDetails);
      const trustSummaryTargets = await warmResourceDetails(
        headResourceTargets,
        true,
      );

      const headCreatorIdentifiers = creatorIdentifiers.slice(
        0,
        PUBLIC_WARM_LIMITS.creatorProfiles,
      );
      await warmCreatorProfiles(headCreatorIdentifiers);

      const result = summarizeResult(
        {
          discover: 1,
          marketplaceVariants: marketplaceResults.length,
          resourceDetails: headResourceTargets.length,
          trustSummaries: trustSummaryTargets.length,
          creatorProfiles: headCreatorIdentifiers.length,
        },
        {
          marketplaceVariants: marketplaceWarmVariants.map(describeMarketplaceVariant),
          resourceSlugs: headResourceTargets.map((target) => target.slug),
          creatorIdentifiers: headCreatorIdentifiers,
        },
      );

      logWarmSummary("full", trigger, result);
      return result;
    },
  );
}

export async function warmTargetedPublicCaches(
  options: WarmTargetedPublicCacheOptions,
) {
  const trigger = options.trigger ?? "mutation";

  return withPerformanceTiming(
    "public_cache_warm_targeted",
    {
      trigger,
      includeListings: options.includeListings ?? false,
      includeTrustSummaries: options.includeTrustSummaries ?? true,
      requestedResourceIds: options.resourceIds?.length ?? 0,
      requestedResourceTargets: options.resourceTargets?.length ?? 0,
      requestedCreatorIdentifiers: options.creatorIdentifiers?.length ?? 0,
    },
    async () => {
      const includeListings = options.includeListings ?? false;
      const includeTrustSummaries = options.includeTrustSummaries ?? true;

      const resourceTargets: ResourceWarmTarget[] = [];
      const resourceSeen = new Set<string>();

      (options.resourceTargets ?? []).forEach((target) => {
        pushUniqueResourceTarget(resourceTargets, resourceSeen, target);
      });

      const resourceTargetsFromIds = await resolveResourceTargetsFromIds(options.resourceIds ?? []);
      resourceTargetsFromIds.forEach((target) => {
        pushUniqueResourceTarget(resourceTargets, resourceSeen, target);
      });

      const creatorIdentifiers: string[] = [];
      const creatorSeen = new Set<string>();
      (options.creatorIdentifiers ?? []).forEach((identifier) => {
        pushUniqueString(creatorIdentifiers, creatorSeen, identifier);
      });

      const warmResourceTargets = resourceTargets.slice(
        0,
        PUBLIC_WARM_LIMITS.resourceDetails,
      );
      const recommendedCategorySlugs = includeListings
        ? await resolveRecommendedListingCategorySlugs(warmResourceTargets)
        : [];

      let warmedMarketplaceVariants: string[] = [];

      if (includeListings) {
        await Promise.all([
          deleteMarketplaceListingTotalRedisKeys(
            ["recommended", "newest"],
            recommendedCategorySlugs,
          ),
          deleteMarketplaceRecommendedListingRedisKeys(recommendedCategorySlugs),
          deleteMarketplaceNewestListingRedisKeys(recommendedCategorySlugs),
        ]);
      }

      const listingWarmVariants = includeListings
        ? buildMarketplaceWarmVariants(recommendedCategorySlugs)
        : [];

      const [, , , trustSummaryTargets] = await Promise.all([
        includeListings
          ? Promise.all([
              getDiscoverLeadData(),
              getDiscoverCollectionsData(),
              getDiscoverData(),
            ])
          : Promise.resolve(null),
        includeListings
          ? getDiscoverCategories()
          : Promise.resolve(null),
        includeListings
          ? Promise.all(
              listingWarmVariants.map((filters) => getMarketplaceResources(filters)),
            ).then(() => {
              warmedMarketplaceVariants = listingWarmVariants.map(describeMarketplaceVariant);
            })
          : Promise.resolve(),
        warmResourceTargets.length > 0
          ? warmResourceDetails(warmResourceTargets, includeTrustSummaries)
          : Promise.resolve([] as Array<ResourceWarmTarget & { id: string }>),
        creatorIdentifiers.length > 0
          ? warmCreatorProfiles(creatorIdentifiers)
          : Promise.resolve(),
      ]);

      const result = summarizeResult(
        {
          discover: includeListings ? 1 : 0,
          marketplaceVariants: warmedMarketplaceVariants.length,
          resourceDetails: warmResourceTargets.length,
          trustSummaries: trustSummaryTargets.length,
          creatorProfiles: creatorIdentifiers.length,
        },
        {
          marketplaceVariants: warmedMarketplaceVariants,
          resourceSlugs: warmResourceTargets.map((target) => target.slug),
          creatorIdentifiers,
        },
      );

      logWarmSummary("targeted", trigger, result);
      return result;
    },
  );
}
type WarmDiscoverData = DiscoverLeadData & DiscoverCollectionsData;
