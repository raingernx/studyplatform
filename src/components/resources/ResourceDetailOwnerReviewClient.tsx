"use client";

import { ResourceReviewForm } from "@/components/resource/ResourceReviewForm";
import type { ResourceDetailViewerReview } from "@/lib/resources/resource-detail-viewer-state";
import { useFetchJson } from "@/lib/use-fetch-json";
import { useResourceDetailViewerState } from "./ResourceDetailViewerStateProvider";

export function ResourceDetailOwnerReviewClient({
  resourceId,
  resourceTitle,
}: {
  resourceId: string;
  resourceTitle: string;
}) {
  const viewer = useResourceDetailViewerState();
  const { data: viewerReview, isReady } = useFetchJson<ResourceDetailViewerReview>({
    cacheKey: `resource-detail-review:${resourceId}`,
    ttlMs: 5_000,
    url: `/api/resources/${resourceId}/viewer-state?scope=review`,
    enabled: viewer.isReady && viewer.authenticated && viewer.isOwned,
  });

  if (!viewer.authenticated || !viewer.isOwned) {
    return null;
  }

  if (!isReady) {
    return null;
  }

  return (
    <ResourceReviewForm
      resourceId={resourceId}
      resourceTitle={resourceTitle}
      existingReview={viewerReview}
    />
  );
}
