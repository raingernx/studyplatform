"use client";

import { Skeleton } from "boneyard-js/react";
import { ResourceCard, type ResourceCardResource } from "./ResourceCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

const RESOURCE_CARD_SKELETON_NAME = "resource-card";
const BONES_PREVIEW_IMAGE = "/uploads/c8fef7c0a5fecefa.png";

const resourceCardFixture: ResourceCardResource = {
  id: "resource-card-bones-fixture",
  slug: "resource-card-bones-fixture",
  title: "Middle School Science Quiz & Assessment Set",
  price: 2000,
  isFree: false,
  thumbnailUrl: BONES_PREVIEW_IMAGE,
  author: { name: "Kru Craft" },
  category: { name: "Science", slug: "science" },
};

function ManualResourceCardSkeleton() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-card shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl rounded-b-none bg-muted">
        <LoadingSkeleton className="h-full w-full rounded-none" />
        <LoadingSkeleton className="absolute left-3 top-3 h-6 w-16 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <div className="flex flex-1 flex-col gap-2">
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-4/5" />
            <LoadingSkeleton className="h-4 w-2/3" />
          </div>
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>

        <div className="mt-auto space-y-2 border-t border-border-subtle pt-3">
          <div className="flex items-end justify-between gap-3">
            <LoadingSkeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCardFixture() {
  return (
    <div className="w-full max-w-[320px]">
      <ResourceCard
        resource={resourceCardFixture}
        previewMode
        linkPrefetchMode="none"
        imageLoading="eager"
      />
    </div>
  );
}

export function ResourceCardBonesPreview() {
  return (
    <Skeleton
      name={RESOURCE_CARD_SKELETON_NAME}
      loading={false}
      className="h-full w-full"
      darkColor="rgba(255,255,255,0.07)"
    >
      <ResourceCardFixture />
    </Skeleton>
  );
}

export function ResourceCardSkeleton() {
  return <ManualResourceCardSkeleton />;
}
