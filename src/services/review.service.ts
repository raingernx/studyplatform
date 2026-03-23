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
import { CACHE_TAGS, CACHE_TTLS } from "@/lib/cache";

export class ReviewServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Review service error");
    this.status = status;
    this.payload = payload;
  }
}

function normalizeAverageRating(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
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
 * Cached via Next.js Data Cache (unstable_cache) for CACHE_TTLS.publicPage
 * seconds.  The "discover" cache tag is used so this entry is invalidated
 * whenever a review is submitted, updated, or hidden by an admin — those
 * mutation routes all call `revalidateTag(CACHE_TAGS.discover)`.
 *
 * User-specific data (viewerReview, ownership) is handled separately and
 * is never cached.
 */
export const getResourceReviews = unstable_cache(
  async function _getResourceReviews(resourceId: string, take: number) {
    return findResourceReviews(resourceId, take);
  },
  ["resource-reviews"],
  { revalidate: CACHE_TTLS.publicPage, tags: [CACHE_TAGS.discover] },
);

export async function getUserResourceReview(userId: string, resourceId: string) {
  return findReviewByUserAndResource(userId, resourceId);
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
 * Cached via Next.js Data Cache (unstable_cache) for CACHE_TTLS.publicPage
 * seconds.  The "discover" tag ensures the entry is invalidated when reviews
 * are submitted or when admin modifies the resource — those mutation routes
 * call `revalidateTag(CACHE_TAGS.discover)`.  A new completed purchase does
 * not currently invalidate this cache; totalSales may lag by up to
 * CACHE_TTLS.publicPage seconds, which is acceptable for a public trust signal.
 */
export const getResourceTrustSummary = unstable_cache(
  async function _getResourceTrustSummary(resourceId: string) {
    const [ratingSummary, totalSales] = await Promise.all([
      getResourceRatingSummary(resourceId),
      findCompletedSalesCountByResource(resourceId),
    ]);

    return {
      averageRating: normalizeAverageRating(ratingSummary._avg.rating),
      totalReviews: ratingSummary._count._all,
      totalSales,
    };
  },
  ["resource-trust-summary"],
  { revalidate: CACHE_TTLS.publicPage, tags: [CACHE_TAGS.discover] },
);

export async function attachResourceTrustSignals<T extends { id: string }>(resources: T[]) {
  if (resources.length === 0) {
    return [] as Array<T & { rating: number | null; reviewCount: number; salesCount: number }>;
  }

  const resourceIds = Array.from(new Set(resources.map((resource) => resource.id)));

  const [ratingSummaries, salesCounts] = await Promise.all([
    getResourceRatingSummaries(resourceIds),
    findCompletedSalesCountsByResourceIds(resourceIds),
  ]);

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
