import { unstable_cache } from "next/cache";
import {
  countDownloadEventsByUser,
  countPurchaseHistoryByUser,
  findCompletedPurchaseByUserAndResource,
  findCompletedLibraryItemsByUser,
  findLibrarySurfaceSummaryByUser,
  findCompletedPurchasesByUser,
  findRecentPurchasePreferenceSignalsByUser,
  findCompletedResourceIdsByUser,
  findCompletedResourceIdsByUserFromSet,
  findDownloadHistoryByUser,
  findPurchaseByUserAndResource,
  findPurchaseHistoryByUser,
} from "@/repositories/purchases/purchase.repository";
import { CACHE_KEYS, CACHE_TTLS, rememberJson, runSingleFlight } from "@/lib/cache";

type CachedFn<T> = () => Promise<T>;

// Private ownership state should be warm across repeated signed-in navigations,
// but fresh purchase confirmation must still break through quickly.
const OWNERSHIP_REVALIDATE_SECONDS = 10;

const _hasPurchasedCacheMap = new Map<string, CachedFn<boolean>>();
const _ownedResourceIdsCacheMap = new Map<string, CachedFn<string[]>>();

function getHasPurchasedCachedReader(userId: string, resourceId: string) {
  const key = `${userId}:${resourceId}`;
  let cachedFn = _hasPurchasedCacheMap.get(key);

  if (!cachedFn) {
    cachedFn = unstable_cache(
      async () => {
        const purchase = await findCompletedPurchaseByUserAndResource(userId, resourceId);
        return purchase !== null;
      },
      ["owned-resource", userId, resourceId],
      { revalidate: OWNERSHIP_REVALIDATE_SECONDS },
    );
    _hasPurchasedCacheMap.set(key, cachedFn);
  }

  return cachedFn;
}

function getOwnedResourceIdsCachedReader(userId: string) {
  let cachedFn = _ownedResourceIdsCacheMap.get(userId);

  if (!cachedFn) {
    cachedFn = unstable_cache(
      async () => {
        const purchases = await findCompletedResourceIdsByUser(userId);
        return purchases.map((purchase) => purchase.resourceId);
      },
      ["owned-resource-ids", userId],
      { revalidate: OWNERSHIP_REVALIDATE_SECONDS },
    );
    _ownedResourceIdsCacheMap.set(userId, cachedFn);
  }

  return cachedFn;
}

// ── Ownership checks ──────────────────────────────────────────────────────────

/**
 * Returns true when the given user has a COMPLETED purchase for resourceId.
 * Used by the download route and resource detail page.
 */
export async function hasPurchased(
  userId: string,
  resourceId: string,
  options?: { fresh?: boolean },
): Promise<boolean> {
  if (options?.fresh) {
    const purchase = await findCompletedPurchaseByUserAndResource(userId, resourceId);
    return purchase !== null;
  }

  return getHasPurchasedCachedReader(userId, resourceId)();
}

/**
 * Returns the set of resourceIds the user has COMPLETED purchases for.
 * Used by listing pages to mark owned cards.
 */
export async function getOwnedResourceIds(userId: string): Promise<Set<string>> {
  const ownedIds = await getOwnedResourceIdsCachedReader(userId)();
  return new Set(ownedIds);
}

/**
 * Returns the owned resourceIds from a specific subset (e.g. related resources).
 * More efficient than getOwnedResourceIds when only a small set needs checking.
 */
export async function getOwnedIdsFromSet(
  userId: string,
  resourceIds: string[]
): Promise<string[]> {
  if (resourceIds.length === 0) return [];
  const purchases = await findCompletedResourceIdsByUserFromSet(userId, resourceIds);
  return purchases.map((p) => p.resourceId);
}

export async function getOwnedDetailState(
  userId: string | undefined,
  resourceId: string,
  relatedResourceIds: string[],
  options?: { fresh?: boolean },
) {
  if (!userId) {
    return {
      isOwned: false,
      ownedRelatedIds: [] as string[],
    };
  }

  if (relatedResourceIds.length === 0) {
    return {
      isOwned: await hasPurchased(userId, resourceId, options),
      ownedRelatedIds: [] as string[],
    };
  }

  const ownedIds = await getOwnedIdsFromSet(userId, [
    resourceId,
    ...relatedResourceIds,
  ]);

  return {
    isOwned: ownedIds.includes(resourceId),
    ownedRelatedIds: ownedIds.filter((id) => id !== resourceId),
  };
}

// ── Checkout helpers ──────────────────────────────────────────────────────────

/**
 * Returns the completed Purchase record for a user+resource pair, or null.
 *
 * Identical rule to hasPurchased — status must be COMPLETED — but returns
 * the record instead of a boolean.  Use this when the caller needs the
 * purchase ID (e.g. to attribute a download to a specific purchase).
 */
export async function getCompletedPurchase(
  userId: string,
  resourceId: string,
): Promise<{ id: string } | null> {
  return findCompletedPurchaseByUserAndResource(userId, resourceId);
}

export async function getCompletedPurchaseAccess(input: {
  userId: string;
  resourceId: string;
  isFree: boolean;
}) {
  const purchase = await findCompletedPurchaseByUserAndResource(
    input.userId,
    input.resourceId,
  );

  if (purchase) {
    return {
      allowed: true as const,
      purchase,
      errorMessage: null,
    };
  }

  return {
    allowed: false as const,
    purchase: null,
    errorMessage: input.isFree
      ? "Please add this resource to your library before downloading or previewing."
      : "Forbidden. You have not purchased this resource.",
  };
}

/**
 * Returns the existing Purchase row for a user+resource pair, or null.
 * Used by checkout routes for idempotency / duplicate-purchase guards.
 */
export async function getExistingPurchase(userId: string, resourceId: string) {
  return findPurchaseByUserAndResource(userId, resourceId);
}

/**
 * Returns all COMPLETED purchases for a user, ordered newest first.
 * Covers dashboard, library, and downloads pages.
 */
export async function getUserPurchases(userId: string) {
  return findCompletedPurchasesByUser(userId);
}

export async function getUserLibraryItems(userId: string) {
  const purchases = await findCompletedLibraryItemsByUser(userId);

  return purchases
    .filter((purchase) => Boolean(purchase.resource))
    .map((purchase) => ({
      purchaseId: purchase.id,
      purchasedAt: purchase.createdAt,
      id: purchase.resource.id,
      slug: purchase.resource.slug,
      title: purchase.resource.title,
      authorName: purchase.resource.author?.name ?? null,
      previewUrl: purchase.resource.previewUrl ?? null,
      mimeType: purchase.resource.mimeType ?? null,
      type: purchase.resource.type,
      categorySlug: purchase.resource.category?.slug ?? null,
    }));
}

export async function getUserLibrarySurfaceSummary(userId: string) {
  const summary = await findLibrarySurfaceSummaryByUser(userId);

  return {
    total: summary.total,
    latest:
      summary.latest && summary.latest.resource
        ? {
            purchaseId: summary.latest.id,
            purchasedAt: summary.latest.createdAt,
            id: summary.latest.resource.id,
            slug: summary.latest.resource.slug,
            title: summary.latest.resource.title,
            authorName: summary.latest.resource.author?.name ?? null,
            previewUrl: summary.latest.resource.previewUrl ?? null,
            mimeType: summary.latest.resource.mimeType ?? null,
            type: summary.latest.resource.type,
            categorySlug: summary.latest.resource.category?.slug ?? null,
          }
        : null,
  };
}

export async function getUserDownloadCount(userId: string) {
  return countDownloadEventsByUser(userId);
}

export async function getUserDownloadHistory(userId: string) {
  return findDownloadHistoryByUser(userId);
}

export async function getUserDownloadHistorySurfaceSummary(userId: string) {
  const downloads = await findDownloadHistoryByUser(userId);
  const count = downloads.length;

  return {
    count,
    rowCount: Math.min(Math.max(count, 1), 10),
  };
}

/**
 * Returns all purchases (any status) for a user, ordered newest first.
 * Used by the purchases history page which shows PENDING / FAILED records too.
 */
export async function getUserPurchaseHistory(userId: string) {
  return findPurchaseHistoryByUser(userId);
}

export async function getUserPurchaseHistorySurfaceSummary(userId: string) {
  const count = await countPurchaseHistoryByUser(userId);

  return {
    count,
    rowCount: Math.min(Math.max(count, 1), 10),
  };
}

export interface UserLearningProfile {
  hasHistory: boolean;
  recentStudyTitle: string | null;
  recentCategoryId: string | null;
  recentCategoryName: string | null;
  recentCategorySlug: string | null;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    score: number;
  }>;
  preferredLevels: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">;
}

/**
 * Returns a user's learning profile derived from their recent purchases.
 *
 * Cached per user for CACHE_TTLS.publicPage seconds via Next.js Data Cache.
 * The profile is used only to personalise the /resources recommendation
 * pipeline — a short lag after a new purchase is acceptable.
 */
export const getUserLearningProfile = unstable_cache(
  async function _getUserLearningProfile(
    userId: string,
    take: number = 24,
  ): Promise<UserLearningProfile> {
    const cacheKey = CACHE_KEYS.userLearningProfile(userId, take);

    return rememberJson(
      cacheKey,
      CACHE_TTLS.publicPage,
      () =>
        runSingleFlight(cacheKey, async () => {
          const rows = await findRecentPurchasePreferenceSignalsByUser(userId, take);

          if (rows.length === 0) {
            return {
              hasHistory: false,
              recentStudyTitle: null,
              recentCategoryId: null,
              recentCategoryName: null,
              recentCategorySlug: null,
              topCategories: [],
              preferredLevels: [],
            };
          }

          const categoryScores = new Map<
            string,
            { id: string; name: string; slug: string; score: number }
          >();
          const levelScores = new Map<"BEGINNER" | "INTERMEDIATE" | "ADVANCED", number>();

          rows.forEach((row, index) => {
            const weight = Math.max(1, 4 - Math.floor(index / 4));
            const category = row.resource.category;

            if (category) {
              const existing = categoryScores.get(category.id);
              if (existing) {
                existing.score += weight;
              } else {
                categoryScores.set(category.id, {
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                  score: weight,
                });
              }
            }

            if (row.resource.level) {
              levelScores.set(
                row.resource.level,
                (levelScores.get(row.resource.level) ?? 0) + weight,
              );
            }
          });

          return {
            hasHistory: true,
            recentStudyTitle: rows[0]?.resource.title ?? null,
            recentCategoryId: rows[0]?.resource.category?.id ?? null,
            recentCategoryName: rows[0]?.resource.category?.name ?? null,
            recentCategorySlug: rows[0]?.resource.category?.slug ?? null,
            topCategories: Array.from(categoryScores.values())
              .sort((left, right) => right.score - left.score)
              .slice(0, 3),
            preferredLevels: Array.from(levelScores.entries())
              .sort((left, right) => right[1] - left[1])
              .map(([level]) => level)
              .slice(0, 2),
          };
        }),
    );
  },
  ["user-learning-profile"],
  { revalidate: CACHE_TTLS.publicPage },
);
