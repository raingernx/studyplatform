import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  createReviewRecord,
  findAdminReviews,
  findReviewById,
  findReviewByUserAndResource,
  getResourceRatingSummaries,
  getResourceRatingSummary,
  getResourceReviews as findResourceReviews,
  setReviewVisibility,
  updateReviewRecord,
} from "@/repositories/reviews/review.repository";
import {
  findCompletedSalesCountByResource,
  findCompletedSalesCountsByResourceIds,
} from "@/repositories/purchases/purchase.repository";
import { findAdminActor, findResourceById } from "@/repositories/resources/resource.repository";
import { hasPurchased } from "@/services/purchase.service";
import {
  CACHE_KEYS,
  CACHE_TTLS,
  getResourceDetailDataTag,
  multiGetCachedJson,
  rememberJson,
  runSingleFlight,
  setCachedJson,
} from "@/lib/cache";

export class ReviewServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Review service error");
    this.status = status;
    this.payload = payload;
  }
}

const RESOURCE_DETAIL_REVALIDATE_SECONDS = CACHE_TTLS.homepageList;

function normalizeAverageRating(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function isTransientTrustEnrichmentError(error: unknown) {
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

async function requireAdminReviewer(adminUserId: string) {
  const actor = await findAdminActor(adminUserId);

  if (!actor) {
    throw new ReviewServiceError(401, {
      error: "User not found. Please sign out and sign in again.",
    });
  }

  if (actor.role !== "ADMIN") {
    throw new ReviewServiceError(403, {
      error: "Forbidden. Admin access required.",
    });
  }

  return actor;
}

export async function createReview(
  userId: string,
  resourceId: string,
  input: { rating: number; comment?: string | null },
) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ReviewServiceError(400, {
      error: "Rating must be an integer between 1 and 5.",
    });
  }

  const resource = await findResourceById(resourceId);

  if (!resource || resource.deletedAt) {
    throw new ReviewServiceError(404, {
      error: "Resource not found.",
    });
  }

  const owned = await hasPurchased(userId, resourceId);
  if (!owned) {
    throw new ReviewServiceError(403, {
      error: "You can only review resources you own.",
    });
  }

  const existingReview = await findReviewByUserAndResource(userId, resourceId);
  if (existingReview) {
    throw new ReviewServiceError(409, {
      error: "You have already reviewed this resource.",
    });
  }

  const comment = input.comment?.trim();

  return createReviewRecord({
    userId,
    resourceId,
    rating: input.rating,
    body: comment ? comment : null,
  });
}

/**
 * Returns up to `take` visible reviews for a resource.
 *
 * Cached per resource so unrelated discover invalidations do not evict the
 * hot detail-path review cache for every slug.
 */
export async function getResourceReviews(resourceId: string, take: number) {
  return unstable_cache(
    async function _getResourceReviews() {
      return rememberJson(
        CACHE_KEYS.resourceReviews(resourceId, take),
        CACHE_TTLS.resourceDetail,
        () =>
          runSingleFlight(`resource-reviews:${resourceId}:${take}`, () =>
            findResourceReviews(resourceId, take),
          ),
        {
          metricName: "review.resourceReviews",
          details: { resourceId, take },
        },
      );
    },
    ["resource-reviews", resourceId, String(take)],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceDetailDataTag(resourceId)],
    },
  )();
}

export async function getUserResourceReview(userId: string, resourceId: string) {
  return findReviewByUserAndResource(userId, resourceId);
}

async function getCachedResourceRatingSummary(resourceId: string) {
  return unstable_cache(
    async function _getCachedResourceRatingSummary() {
      return runSingleFlight(`resource-rating-summary:${resourceId}`, () =>
        getResourceRatingSummary(resourceId),
      );
    },
    ["resource-rating-summary", resourceId],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceDetailDataTag(resourceId)],
    },
  )();
}

async function getCachedCompletedSalesCount(resourceId: string) {
  return unstable_cache(
    async function _getCachedCompletedSalesCount() {
      return runSingleFlight(`resource-sales-count:${resourceId}`, () =>
        findCompletedSalesCountByResource(resourceId),
      );
    },
    ["resource-sales-count", resourceId],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceDetailDataTag(resourceId)],
    },
  )();
}

export async function getResourceReviewDetailState(
  resourceId: string,
  userId?: string,
  take: number = 5,
) {
  const [trustSummary, reviews, viewerReview] = await Promise.all([
    getResourceTrustSummary(resourceId),
    getResourceReviews(resourceId, take),
    userId ? getUserResourceReview(userId, resourceId) : null,
  ]);

  return {
    trustSummary,
    reviews,
    viewerReview,
  };
}

export async function getResourceTrustSummaryWithPrefetchedSales(
  resourceId: string,
  totalSales: number,
  prefetchedReviewSummary?: {
    averageRating: number | null;
    totalReviews: number;
  },
) {
  if (prefetchedReviewSummary) {
    return {
      averageRating: normalizeAverageRating(prefetchedReviewSummary.averageRating),
      totalReviews: prefetchedReviewSummary.totalReviews,
      totalSales,
    };
  }

  const ratingSummary = await getCachedResourceRatingSummary(resourceId);

  return {
    averageRating: normalizeAverageRating(ratingSummary._avg.rating),
    totalReviews: ratingSummary._count._all,
    totalSales,
  };
}

export async function updateReview(
  userId: string,
  resourceId: string,
  input: { rating: number; comment?: string | null },
) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ReviewServiceError(400, {
      error: "Rating must be an integer between 1 and 5.",
    });
  }

  const resource = await findResourceById(resourceId);

  if (!resource || resource.deletedAt) {
    throw new ReviewServiceError(404, {
      error: "Resource not found.",
    });
  }

  const owned = await hasPurchased(userId, resourceId);
  if (!owned) {
    throw new ReviewServiceError(403, {
      error: "You can only review resources you own.",
    });
  }

  const existingReview = await findReviewByUserAndResource(userId, resourceId);
  if (!existingReview) {
    throw new ReviewServiceError(404, {
      error: "Review not found.",
    });
  }

  const comment = input.comment?.trim();

  return updateReviewRecord(existingReview.id, {
    rating: input.rating,
    body: comment ? comment : null,
  });
}

export async function getAdminReviews(adminUserId: string) {
  await requireAdminReviewer(adminUserId);
  return findAdminReviews();
}

async function updateAdminReviewVisibility(
  adminUserId: string,
  reviewId: string,
  isVisible: boolean,
) {
  await requireAdminReviewer(adminUserId);

  const review = await findReviewById(reviewId);
  if (!review) {
    throw new ReviewServiceError(404, {
      error: "Review not found.",
    });
  }

  if (review.isVisible === isVisible) {
    return review;
  }

  return setReviewVisibility(reviewId, isVisible);
}

export async function hideReview(adminUserId: string, reviewId: string) {
  return updateAdminReviewVisibility(adminUserId, reviewId, false);
}

export async function unhideReview(adminUserId: string, reviewId: string) {
  return updateAdminReviewVisibility(adminUserId, reviewId, true);
}

/**
 * Returns aggregated trust signals (average rating, review count, total sales)
 * for a single resource.
 *
 * Cached per resource so unrelated discover invalidations do not evict the
 * strict detail-path trust cache for every slug.
 */
export async function getResourceTrustSummary(resourceId: string) {
  return unstable_cache(
    async function _getResourceTrustSummary() {
      // Redis layer: cross-instance cache so cold lambda instances never hit
      // the DB for a trust summary that is already warm on other instances.
      return rememberJson(
        CACHE_KEYS.resourceTrustSummary(resourceId),
        CACHE_TTLS.stats,
        () =>
          runSingleFlight(`resource-trust-summary:${resourceId}`, () =>
            Promise.all([
              getCachedResourceRatingSummary(resourceId),
              getCachedCompletedSalesCount(resourceId),
            ]).then(([ratingSummary, totalSales]) => ({
              averageRating: normalizeAverageRating(ratingSummary._avg.rating),
              totalReviews: ratingSummary._count._all,
              totalSales,
            })),
          ),
        { metricName: "review.resourceTrustSummary", details: { resourceId } },
      );
    },
    ["resource-trust-summary", resourceId],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceDetailDataTag(resourceId)],
    },
  )();
}

type CachedResourceTrust = {
  rating: number | null;
  reviewCount: number;
  salesCount: number;
};

/**
 * Enriches a batch of resources with trust signals (rating, reviewCount, salesCount).
 *
 * Cache strategy:
 *   1. Batch-fetch all resource trust signals from Redis in one MGET round-trip.
 *   2. Run the two DB aggregation queries only for cache-miss IDs.
 *   3. Write misses back to Redis in parallel before returning.
 *
 * On a warm cache (all hits): zero DB queries — pure Redis MGET.
 * On a cold cache (all misses): 2 parallel groupBy queries, same as before.
 * Partial hits reduce DB load proportionally.
 *
 * The `queryConcurrency` option is preserved for API compatibility but is no
 * longer used for the Redis-warm path; the DB miss path always runs in parallel.
 */
export async function attachResourceTrustSignals<T extends { id: string }>(
  resources: T[],
  options?: { queryConcurrency?: number },
) {
  if (resources.length === 0) {
    return [] as Array<T & { rating: number | null; reviewCount: number; salesCount: number }>;
  }

  const resourceIds = Array.from(new Set(resources.map((r) => r.id)));
  const trustCacheKeys = resourceIds.map((id) => CACHE_KEYS.resourceTrust(id));

  // ── Step 1: Batch Redis read ───────────────────────────────────────────────
  const cachedSignals = await multiGetCachedJson<CachedResourceTrust>(trustCacheKeys);

  const trustMap = new Map<string, CachedResourceTrust>();
  const missIds: string[] = [];

  resourceIds.forEach((id, i) => {
    const signal = cachedSignals[i];
    if (signal !== null) {
      trustMap.set(id, signal);
    } else {
      missIds.push(id);
    }
  });

  // ── Step 2: DB queries for cache-miss IDs only ────────────────────────────
  if (missIds.length > 0) {
    let ratingSummaries: Awaited<ReturnType<typeof getResourceRatingSummaries>> = [];
    let salesCounts: Awaited<ReturnType<typeof findCompletedSalesCountsByResourceIds>> = [];

    try {
      [ratingSummaries, salesCounts] = await Promise.all([
        getResourceRatingSummaries(missIds),
        findCompletedSalesCountsByResourceIds(missIds),
      ]);
    } catch (error) {
      if (!isTransientTrustEnrichmentError(error)) throw error;
      // On pool pressure: serve cached hits; fall back to zeros for misses.
      return resources.map((resource) => {
        const trust = trustMap.get(resource.id);
        return {
          ...resource,
          rating: trust?.rating ?? null,
          reviewCount: trust?.reviewCount ?? 0,
          salesCount: trust?.salesCount ?? 0,
        };
      });
    }

    const ratingMap = new Map(
      ratingSummaries.map((row) => [
        row.resourceId,
        {
          rating: normalizeAverageRating(row._avg.rating),
          reviewCount: row._count._all,
        },
      ]),
    );
    const salesMap = new Map(
      salesCounts.map((row) => [row.resourceId, row._count._all]),
    );

    // Populate the trust map for misses and write back to Redis in parallel.
    const writePromises: Promise<void>[] = [];
    for (const id of missIds) {
      const ratingInfo = ratingMap.get(id);
      const signal: CachedResourceTrust = {
        rating: ratingInfo?.rating ?? null,
        reviewCount: ratingInfo?.reviewCount ?? 0,
        salesCount: salesMap.get(id) ?? 0,
      };
      trustMap.set(id, signal);
      writePromises.push(setCachedJson(CACHE_KEYS.resourceTrust(id), signal, CACHE_TTLS.stats));
    }

    await Promise.all(writePromises);
  }

  // ── Step 3: Map trust signals back onto the original resources ────────────
  return resources.map((resource) => {
    const trust = trustMap.get(resource.id);
    return {
      ...resource,
      rating: trust?.rating ?? null,
      reviewCount: trust?.reviewCount ?? 0,
      salesCount: trust?.salesCount ?? 0,
    };
  });
}
