import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { runWithConcurrencyLimit } from "@/lib/async";
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
  CACHE_TTLS,
  getResourceDetailDataTag,
  runSingleFlight,
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
      return runSingleFlight(`resource-reviews:${resourceId}:${take}`, () =>
        findResourceReviews(resourceId, take),
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
      const [ratingSummary, totalSales] = await runSingleFlight(
        `resource-trust-summary:${resourceId}`,
        () =>
          Promise.all([
            getCachedResourceRatingSummary(resourceId),
            getCachedCompletedSalesCount(resourceId),
          ]),
      );

      return {
        averageRating: normalizeAverageRating(ratingSummary._avg.rating),
        totalReviews: ratingSummary._count._all,
        totalSales,
      };
    },
    ["resource-trust-summary", resourceId],
    {
      revalidate: RESOURCE_DETAIL_REVALIDATE_SECONDS,
      tags: [getResourceDetailDataTag(resourceId)],
    },
  )();
}

export async function attachResourceTrustSignals<T extends { id: string }>(
  resources: T[],
  options?: { queryConcurrency?: number },
) {
  if (resources.length === 0) {
    return [] as Array<T & { rating: number | null; reviewCount: number; salesCount: number }>;
  }

  const resourceIds = Array.from(new Set(resources.map((resource) => resource.id)));
  const queryConcurrency = Math.max(1, options?.queryConcurrency ?? 2);
  type TrustQueryResult =
    | Awaited<ReturnType<typeof getResourceRatingSummaries>>
    | Awaited<ReturnType<typeof findCompletedSalesCountsByResourceIds>>;

  let ratingSummaries;
  let salesCounts;

  try {
    if (queryConcurrency >= 2) {
      [ratingSummaries, salesCounts] = await Promise.all([
        getResourceRatingSummaries(resourceIds),
        findCompletedSalesCountsByResourceIds(resourceIds),
      ]);
    } else {
      const [ratingSummaryResult, salesCountResult] = await runWithConcurrencyLimit(
        [
          () => getResourceRatingSummaries(resourceIds),
          () => findCompletedSalesCountsByResourceIds(resourceIds),
        ] as const,
        queryConcurrency,
        async (load) => load() as Promise<TrustQueryResult>,
      );

      ratingSummaries = ratingSummaryResult as Awaited<
        ReturnType<typeof getResourceRatingSummaries>
      >;
      salesCounts = salesCountResult as Awaited<
        ReturnType<typeof findCompletedSalesCountsByResourceIds>
      >;
    }
  } catch (error) {
    if (!isTransientTrustEnrichmentError(error)) {
      throw error;
    }

    return resources.map((resource) => ({
      ...resource,
      rating: null,
      reviewCount: 0,
      salesCount: 0,
    }));
  }

  const ratingsByResourceId = new Map(
    ratingSummaries.map((row) => [
      row.resourceId,
      {
        rating: normalizeAverageRating(row._avg.rating),
        reviewCount: row._count._all,
      },
    ]),
  );

  const salesByResourceId = new Map(
    salesCounts.map((row) => [row.resourceId, row._count._all]),
  );

  return resources.map((resource) => {
    const ratingSummary = ratingsByResourceId.get(resource.id);

    return {
      ...resource,
      rating: ratingSummary?.rating ?? null,
      reviewCount: ratingSummary?.reviewCount ?? 0,
      salesCount: salesByResourceId.get(resource.id) ?? 0,
    };
  });
}
