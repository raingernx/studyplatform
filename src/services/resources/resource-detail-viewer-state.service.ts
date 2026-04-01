import { isMissingTableError } from "@/lib/prismaErrors";
import type {
  ResourceDetailViewerBaseState,
  ResourceDetailViewerReview,
} from "@/lib/resources/resource-detail-viewer-state";
import {
  getResourceDetailPageExtras,
  getResourceDetailPageViewerReview,
} from "@/services/resources/resource-detail-page.service";

function getEmptyResourceDetailViewerBaseState(): ResourceDetailViewerBaseState {
  return {
    authenticated: false,
    userId: null,
    subscriptionStatus: null,
    isOwned: false,
  };
}

export async function getResourceDetailViewerBaseState(input: {
  fresh?: boolean;
  resourceId: string;
  userId?: string | null;
  subscriptionStatus?: string | null;
}): Promise<ResourceDetailViewerBaseState> {
  const {
    fresh = false,
    resourceId,
    userId,
    subscriptionStatus,
  } = input;

  if (!userId) {
    return getEmptyResourceDetailViewerBaseState();
  }

  try {
    const ownership = await getResourceDetailPageExtras({
      fresh,
      resourceId,
      userId,
    });

    return {
      authenticated: true,
      userId,
      subscriptionStatus: subscriptionStatus ?? null,
      isOwned: ownership.isOwned,
    };
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    return {
      authenticated: true,
      userId,
      subscriptionStatus: subscriptionStatus ?? null,
      isOwned: false,
    };
  }
}

export async function getResourceDetailViewerReviewState(input: {
  resourceId: string;
  userId?: string | null;
}): Promise<ResourceDetailViewerReview | null> {
  const { resourceId, userId } = input;

  if (!userId) {
    return null;
  }

  try {
    const viewerReview = await getResourceDetailPageViewerReview(userId, resourceId);
    return viewerReview
      ? {
          rating: viewerReview.rating,
          body: viewerReview.body,
        }
      : null;
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }

    return null;
  }
}
