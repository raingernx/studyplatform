import {
  countDownloadEventsByUser,
  findCompletedPurchaseByUserAndResource,
  findCompletedPurchasesByUser,
  findRecentPurchasePreferenceSignalsByUser,
  findCompletedResourceIdsByUser,
  findCompletedResourceIdsByUserFromSet,
  findDownloadHistoryByUser,
  findPurchaseByUserAndResource,
  findPurchaseHistoryByUser,
} from "@/repositories/purchases/purchase.repository";

// ── Ownership checks ──────────────────────────────────────────────────────────

/**
 * Returns true when the given user has a COMPLETED purchase for resourceId.
 * Used by the download route and resource detail page.
 */
export async function hasPurchased(userId: string, resourceId: string): Promise<boolean> {
  const purchase = await findCompletedPurchaseByUserAndResource(userId, resourceId);
  return purchase !== null;
}

/**
 * Returns the set of resourceIds the user has COMPLETED purchases for.
 * Used by listing pages to mark owned cards.
 */
export async function getOwnedResourceIds(userId: string): Promise<Set<string>> {
  const purchases = await findCompletedResourceIdsByUser(userId);
  return new Set(purchases.map((p) => p.resourceId));
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

// ── Checkout helpers ──────────────────────────────────────────────────────────

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

export async function getUserDownloadCount(userId: string) {
  return countDownloadEventsByUser(userId);
}

export async function getUserDownloadHistory(userId: string) {
  return findDownloadHistoryByUser(userId);
}

/**
 * Returns all purchases (any status) for a user, ordered newest first.
 * Used by the purchases history page which shows PENDING / FAILED records too.
 */
export async function getUserPurchaseHistory(userId: string) {
  return findPurchaseHistoryByUser(userId);
}

export interface UserLearningProfile {
  hasHistory: boolean;
  recentStudyTitle: string | null;
  recentCategoryName: string | null;
  topCategories: Array<{
    id: string;
    name: string;
    slug: string;
    score: number;
  }>;
  preferredLevels: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">;
}

export async function getUserLearningProfile(
  userId: string,
  take: number = 24,
): Promise<UserLearningProfile> {
  const rows = await findRecentPurchasePreferenceSignalsByUser(userId, take);

  if (rows.length === 0) {
    return {
      hasHistory: false,
      recentStudyTitle: null,
      recentCategoryName: null,
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
    recentCategoryName: rows[0]?.resource.category?.name ?? null,
    topCategories: Array.from(categoryScores.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 3),
    preferredLevels: Array.from(levelScores.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([level]) => level)
      .slice(0, 2),
  };
}
