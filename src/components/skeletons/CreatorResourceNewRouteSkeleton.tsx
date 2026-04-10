"use client";

import { Skeleton } from "boneyard-js/react";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DashboardPageHeaderSkeleton } from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageStack } from "@/components/dashboard/DashboardPageShell";
import {
  CreatorResourceFormLoadingShell,
  CreatorResourceFormLoadingShellPreview,
} from "@/components/creator/CreatorResourceFormLoadingShell";

const CREATOR_RESOURCE_NEW_ROUTE_NAME = "creator-resource-new-route";

function CreatorResourceNewRouteSkeletonPreview() {
  return (
    <DashboardPageStack>
      <DashboardPageHeaderSkeleton
        eyebrowWidth="w-16"
        titleWidth="w-64"
        descriptionWidth="w-full max-w-xl"
      />

      <div className="flex items-center gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-1 items-center gap-3">
            <LoadingSkeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <LoadingSkeleton className="h-3 w-20" />
              <LoadingSkeleton className="h-3 w-16" />
            </div>
            {index < 2 ? <LoadingSkeleton className="ml-auto h-px flex-1" /> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <CreatorResourceFormLoadingShellPreview />
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <LoadingSkeleton className="h-5 w-32" />
            <LoadingSkeleton className="mt-4 h-4 w-full" />
            <LoadingSkeleton className="mt-2 h-4 w-5/6" />
            <LoadingSkeleton className="mt-6 h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </DashboardPageStack>
  );
}

function CreatorResourceNewRouteSkeletonFallback() {
  return <CreatorResourceNewRouteSkeletonPreview />;
}

export function CreatorResourceNewRouteSkeleton() {
  return <CreatorResourceNewRouteSkeletonFallback />;
}

export function CreatorResourceNewRouteBonesPreview() {
  return (
    <Skeleton
      name={CREATOR_RESOURCE_NEW_ROUTE_NAME}
      loading={false}
      className="w-full"
    >
      <CreatorResourceNewRouteSkeletonPreview />
    </Skeleton>
  );
}
