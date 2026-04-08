"use client";

import dynamic from "next/dynamic";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import type { ResourceDetailViewerReview } from "@/lib/resources/resource-detail-viewer-state";
import { useFetchJson } from "@/lib/use-fetch-json";
import { useResourceDetailViewerState } from "./ResourceDetailViewerStateProvider";

const ResourceReviewForm = dynamic(
  () =>
    import("./ResourceReviewForm").then((module) => ({
      default: module.ResourceReviewForm,
    })),
  {
    loading: () => <ResourceDetailOwnerReviewSlotSkeleton />,
  },
);

export function ResourceDetailOwnerReviewSlotSkeleton() {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="space-y-1">
        <LoadingSkeleton className="h-6 w-40 rounded-lg" />
        <LoadingSkeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="mt-5 space-y-5">
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-24" />
          <div className="flex flex-wrap gap-2">
            {[68, 68, 72, 72, 76].map((width, index) => (
              <LoadingSkeleton
                key={`${width}-${index}`}
                className="h-9 rounded-md"
                style={{ width }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-36 w-full rounded-2xl" />
          <LoadingSkeleton className="h-3.5 w-64" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LoadingSkeleton className="h-10 w-36 rounded-md" />
          <LoadingSkeleton className="h-4 w-32" />
        </div>
      </div>
    </section>
  );
}

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
    return <ResourceDetailOwnerReviewSlotSkeleton />;
  }

  return (
    <ResourceReviewForm
      resourceId={resourceId}
      resourceTitle={resourceTitle}
      existingReview={viewerReview}
    />
  );
}
