import {
  getResourceDetailBodyContent,
  getResourceBySlug,
  getResourceDetailFooterContent,
  getResourceDetailPurchaseMetaBySlug,
} from "@/services/resource.service";
import {
  getResourceDetailExtras,
  getResourceDetailRelatedSection,
  getResourceDetailReviewSection,
  getResourceDetailTrustSummary,
} from "@/services/resources/resource.service";
import { getResourceReviews, getUserResourceReview } from "@/services/review.service";

/**
 * Canonical public resource-detail read surface.
 *
 * This keeps the route from reaching into multiple service owners directly,
 * while leaving the underlying query implementations unchanged for now.
 */
export async function getResourceDetailPageResource(slug: string) {
  return getResourceBySlug(slug);
}

export async function getResourceDetailPageMetadata(slug: string) {
  const resource = await getResourceBySlug(slug);
  return resource
    ? {
        title: resource.title,
        description: resource.description,
      }
    : null;
}

export async function getResourceDetailPageBodyContent(slug: string) {
  return getResourceDetailBodyContent(slug);
}

export async function getResourceDetailPageFooterContent(slug: string) {
  return getResourceDetailFooterContent(slug);
}

export async function getResourceDetailPagePurchaseMeta(slug: string) {
  return getResourceDetailPurchaseMetaBySlug(slug);
}

export async function getResourceDetailPageExtras(input: {
  fresh?: boolean;
  resourceId: string;
  userId: string;
}) {
  return getResourceDetailExtras(input);
}

export async function getResourceDetailPageTrustSummary(input: {
  resourceId: string;
  resourceAverageRating: number | null;
  resourceSalesCount: number | null;
  resourceTotalReviews: number;
}) {
  return getResourceDetailTrustSummary(input);
}

export async function getResourceDetailPageRelatedSection(input: {
  resourceId: string;
  categoryId?: string | null;
  take?: number;
}) {
  return getResourceDetailRelatedSection(input);
}

export async function getResourceDetailPageReviewSection(input: {
  resourceId: string;
  userId?: string;
  isOwned: boolean;
  reviewTake?: number;
}) {
  return getResourceDetailReviewSection(input);
}

/** Fetches the public review list without requiring ownership state.
 *  Used to start the review fetch in parallel with the ownership check. */
export async function getResourceDetailPageReviewList(
  resourceId: string,
  reviewTake = 5,
) {
  return getResourceReviews(resourceId, reviewTake);
}

/** Fetches the viewer's own review for a resource they own.
 *  Only called after ownership is confirmed. */
export async function getResourceDetailPageViewerReview(
  userId: string,
  resourceId: string,
) {
  return getUserResourceReview(userId, resourceId);
}
