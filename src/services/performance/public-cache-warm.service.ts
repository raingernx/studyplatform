import { findResourceById } from "@/repositories/resources/resource.repository";
import { logPerformanceEvent, withPerformanceTiming } from "@/lib/performance/observability";
import { getCreatorPublicProfile } from "@/services/creator.service";
import {
  getDiscoverCategories,
  getDiscoverData,
  getHeroConfig,
  type DiscoverData,
} from "@/services/discover.service";
import {
  getMarketplaceResources,
  MARKETPLACE_DEFAULT_PAGE,
  MARKETPLACE_DEFAULT_PAGE_SIZE,
  getPublicResourcePageData,
  type MarketplaceFilters,
} from "@/services/resource.service";
import { getResourceTrustSummary } from "@/services/review.service";

const PUBLIC_WARM_LIMITS = {
  resourceDetails: 8,
  trustSummaries: 4,
  creatorProfiles: 2,
} as const;

const MARKETPLACE_WARM_VARIANTS: readonly MarketplaceFilters[] = [
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_DEFAULT_PAGE_SIZE },
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_DEFAULT_PAGE_SIZE, sort: "newest" },
  { category: "all", page: MARKETPLACE_DEFAULT_PAGE, pageSize: MARKETPLACE_DEFAULT_PAGE_SIZE, sort: "recommended" },
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
  hero: number;
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
  if (!filters.sort) {
    return "default";
  }

  return filters.sort;
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
  discoverData: DiscoverData,
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
    discoverData.freeResources,
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
  await Promise.all(targets.map((target) => getPublicResourcePageData(target.slug)));

  const trustSummaryTargets = includeTrustSummaries
    ? targets
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
    creatorIdentifiers.map((identifier) => getCreatorPublicProfile(identifier)),
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
      let discoverData: DiscoverData | null = null;
      let marketplaceResults: Array<Awaited<ReturnType<typeof getMarketplaceResources>>> = [];

      await Promise.all([
        getHeroConfig(),
        getDiscoverCategories(),
        getDiscoverData().then((data) => {
          discoverData = data;
        }),
        Promise.all(MARKETPLACE_WARM_VARIANTS.map((filters) => getMarketplaceResources(filters))).then(
          (results) => {
            marketplaceResults = results;
          },
        ),
      ]);

      const resourceTargets: ResourceWarmTarget[] = [];
      const resourceSeen = new Set<string>();
      const creatorIdentifiers: string[] = [];
      const creatorSeen = new Set<string>();

      if (discoverData) {
        collectDiscoverWarmTargets(
          discoverData,
          resourceTargets,
          resourceSeen,
          creatorIdentifiers,
          creatorSeen,
        );
      }

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
          hero: 1,
          marketplaceVariants: MARKETPLACE_WARM_VARIANTS.length,
          resourceDetails: headResourceTargets.length,
          trustSummaries: trustSummaryTargets.length,
          creatorProfiles: headCreatorIdentifiers.length,
        },
        {
          marketplaceVariants: MARKETPLACE_WARM_VARIANTS.map(describeMarketplaceVariant),
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

      let warmedMarketplaceVariants: string[] = [];

      const [, , , trustSummaryTargets] = await Promise.all([
        includeListings
          ? getDiscoverData()
          : Promise.resolve(null),
        includeListings
          ? getDiscoverCategories()
          : Promise.resolve(null),
        includeListings
          ? Promise.all(
              MARKETPLACE_WARM_VARIANTS.map((filters) => getMarketplaceResources(filters)),
            ).then(() => {
              warmedMarketplaceVariants = MARKETPLACE_WARM_VARIANTS.map(
                describeMarketplaceVariant,
              );
            })
          : Promise.resolve(),
        resourceTargets.length > 0
          ? warmResourceDetails(resourceTargets, includeTrustSummaries)
          : Promise.resolve([] as Array<ResourceWarmTarget & { id: string }>),
        creatorIdentifiers.length > 0
          ? warmCreatorProfiles(creatorIdentifiers)
          : Promise.resolve(),
      ]);

      const result = summarizeResult(
        {
          discover: includeListings ? 1 : 0,
          hero: 0,
          marketplaceVariants: warmedMarketplaceVariants.length,
          resourceDetails: resourceTargets.length,
          trustSummaries: trustSummaryTargets.length,
          creatorProfiles: creatorIdentifiers.length,
        },
        {
          marketplaceVariants: warmedMarketplaceVariants,
          resourceSlugs: resourceTargets.map((target) => target.slug),
          creatorIdentifiers,
        },
      );

      logWarmSummary("targeted", trigger, result);
      return result;
    },
  );
}
