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
  findCompletedPurchaseByUserAndResource,
  findCompletedSalesCountByResource,
  findCompletedSalesCountsByResourceIds,
} from "@/repositories/purchases/purchase.repository";
import { findAdminActor, findResourceById } from "@/repositories/resources/resource.repository";

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

  const purchase = await findCompletedPurchaseByUserAndResource(userId, resourceId);
  if (!purchase) {
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

export async function getResourceReviews(resourceId: string, take = 5) {
  return findResourceReviews(resourceId, take);
}

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

  const purchase = await findCompletedPurchaseByUserAndResource(userId, resourceId);
  if (!purchase) {
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

export async function getResourceTrustSummary(resourceId: string) {
  const [ratingSummary, totalSales] = await Promise.all([
    getResourceRatingSummary(resourceId),
    findCompletedSalesCountByResource(resourceId),
  ]);

  return {
    averageRating: normalizeAverageRating(ratingSummary._avg.rating),
    totalReviews: ratingSummary._count._all,
    totalSales,
  };
}

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
