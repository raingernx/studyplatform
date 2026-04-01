import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { recordAnalyticsEvents } from "@/analytics/event.service";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { rememberJson, runSingleFlight } from "@/lib/cache";
import { recordCacheCall, recordCacheMiss } from "@/lib/performance/observability";
import { isMissingTableError } from "@/lib/prismaErrors";
import {
  assignRecommendationVariant,
  RECOMMENDATION_EXPERIMENT_ID,
} from "@/lib/recommendations/experiment";
import type {
  ResourcesViewerBaseState,
  ResourcesViewerDiscoverState,
} from "@/lib/resources/viewer-state";
import { getDiscoverData } from "@/services/discover.service";
import { getOwnedResourceIds, getUserLearningProfile } from "@/services/purchase.service";
import {
  getBehaviorBasedRecommendations,
  getPhase1Recommendations,
} from "@/services/recommendations/behavior-profile.service";
import {
  getCachedNewResourcesInCategories,
  getCachedRecommendedResourcesByLevels,
} from "@/services/resources/public-resource-read.service";

type CachedDiscoverReader = () => Promise<ResourcesViewerDiscoverState | null>;

const _viewerDiscoverCacheMap = new Map<string, CachedDiscoverReader>();
const DISCOVER_VIEWER_REVALIDATE_SECONDS = 30;

function isResourcesViewerStateTransientError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Timed out fetching a new connection from the connection pool") ||
    message.includes("Can't reach database server") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

async function loadOwnedResourceIdsSafe(userId: string) {
  try {
    return await getOwnedResourceIds(userId);
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isResourcesViewerStateTransientError(error)
    ) {
      throw error;
    }

    return new Set<string>();
  }
}

async function loadLearningProfileSafe(userId: string) {
  try {
    return await getUserLearningProfile(userId);
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isResourcesViewerStateTransientError(error)
    ) {
      throw error;
    }

    return null;
  }
}

async function loadDiscoverDataSafe() {
  try {
    return await getDiscoverData();
  } catch (error) {
    if (
      !isMissingTableError(error) &&
      !isResourcesViewerStateTransientError(error)
    ) {
      throw error;
    }

    return null;
  }
}

function getEmptyResourcesViewerBaseState(): ResourcesViewerBaseState {
  return {
    authenticated: false,
    ownedResourceIds: [],
  };
}

export async function getResourcesViewerBaseState(input: {
  userId?: string | null;
}): Promise<ResourcesViewerBaseState> {
  const { userId } = input;

  if (!userId) {
    return getEmptyResourcesViewerBaseState();
  }

  const ownedIds = await loadOwnedResourceIdsSafe(userId);
  return {
    authenticated: true,
    ownedResourceIds: [...ownedIds],
  };
}

export async function getResourcesViewerDiscoverState(input: {
  userId?: string | null;
}): Promise<ResourcesViewerDiscoverState | null> {
  const { userId } = input;

  if (!userId) {
    return null;
  }

  recordCacheCall("getResourcesViewerDiscoverState", { userId });

  let cachedReader = _viewerDiscoverCacheMap.get(userId);
  if (!cachedReader) {
    cachedReader = unstable_cache(
      async () => {
        recordCacheMiss("getResourcesViewerDiscoverState", { userId });
        const cacheKey = `resources_viewer_discover:${userId}`;

        return rememberJson(
          cacheKey,
          DISCOVER_VIEWER_REVALIDATE_SECONDS,
          () =>
            runSingleFlight(cacheKey, async () => {
              const ownedIds = await loadOwnedResourceIdsSafe(userId);

              const [learningProfile, discoverData] = await Promise.all([
                loadLearningProfileSafe(userId),
                loadDiscoverDataSafe(),
              ]);

              if (!learningProfile?.hasHistory || !discoverData) {
                return null;
              }

              const globalFiltered = (discoverData.recommended as ResourceCardData[]).filter(
                (resource) => !ownedIds.has(resource.id),
              );
              const topCategoryIds = learningProfile.topCategories.map((item) => item.id);
              const recommendationVariant = assignRecommendationVariant(userId);
              const recommendedForYou = (await (
                recommendationVariant === "phase1"
                  ? getPhase1Recommendations(topCategoryIds, ownedIds, globalFiltered, 5)
                  : getBehaviorBasedRecommendations(
                      userId,
                      ownedIds,
                      topCategoryIds,
                      globalFiltered,
                      5,
                    )
              )) as ResourceCardData[];

              if (recommendedForYou.length > 0) {
                void recordAnalyticsEvents(
                  recommendedForYou.map((resource, position) => ({
                    eventType: "RESOURCE_VIEW" as const,
                    userId,
                    resourceId: resource.id,
                    metadata: {
                      source: "recommendation_impression",
                      experiment: RECOMMENDATION_EXPERIMENT_ID,
                      variant: recommendationVariant,
                      section: "recommended_for_you",
                      position,
                    },
                  })),
                ).catch(() => undefined);
              }

              const recentCategoryId = learningProfile.recentCategoryId ?? null;
              const preferredLevels = learningProfile.preferredLevels;
              const [becauseYouStudied, recommendedForLevel] = await Promise.all([
                recentCategoryId
                  ? getCachedNewResourcesInCategories([recentCategoryId], 8).then((resources) =>
                      resources.filter((resource) => !ownedIds.has(resource.id)).slice(0, 5),
                    )
                  : Promise.resolve([] as ResourceCardData[]),
                preferredLevels.length > 0
                  ? getCachedRecommendedResourcesByLevels(preferredLevels, 6).then((resources) =>
                      resources.filter((resource) => !ownedIds.has(resource.id)).slice(0, 4),
                    )
                  : Promise.resolve([] as ResourceCardData[]),
              ]);

              return {
                recommendationVariant,
                recommendedForYou,
                becauseYouStudied,
                recommendedForLevel,
                recentStudyTitle: learningProfile.recentStudyTitle ?? null,
                recentCategoryName: learningProfile.recentCategoryName ?? null,
              };
            }),
          {
            metricName: "getResourcesViewerDiscoverState",
            details: {
              userId,
            },
          },
        );
      },
      ["resources-viewer-discover", userId],
      { revalidate: DISCOVER_VIEWER_REVALIDATE_SECONDS },
    );
    _viewerDiscoverCacheMap.set(userId, cachedReader);
  }

  return cachedReader();
}
