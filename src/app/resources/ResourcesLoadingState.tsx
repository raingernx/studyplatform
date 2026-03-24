"use client";

import { useSearchParams, useSelectedLayoutSegment } from "next/navigation";
import { type HomepageHeroConfig, HeroBannerSkeleton } from "@/components/marketplace/HeroBanner";
import { ResourceDetailSkeleton } from "@/components/skeletons/ResourceDetailSkeleton";
import { ResourcesPageSkeleton } from "@/components/skeletons/ResourcesPageSkeleton";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";

export function ResourcesLoadingState({
  heroConfig,
}: {
  heroConfig: HomepageHeroConfig;
}) {
  const selectedSegment = useSelectedLayoutSegment();
  const searchParams = useSearchParams();

  if (selectedSegment !== null) {
    return <ResourceDetailSkeleton />;
  }

  const category = searchParams.get("category")?.trim();
  if (!category) {
    return <ResourcesPageSkeleton heroConfig={heroConfig} />;
  }

  return <ResourcesRouteSkeleton />;
}

export { HeroBannerSkeleton };
