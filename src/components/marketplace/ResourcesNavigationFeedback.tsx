"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ResourcesPageSkeleton } from "@/components/skeletons/ResourcesPageSkeleton";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import {
  canonicalizeResourcesHref,
  clearResourcesNavigation,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";

const MIN_PENDING_MS = 160;

export function ResourcesNavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationState = useResourcesNavigationState();
  const currentSearch = searchParams.toString();
  const currentHref = canonicalizeResourcesHref(
    currentSearch ? `${pathname}?${currentSearch}` : pathname,
  );

  useEffect(() => {
    if (!navigationState.mode || !navigationState.href) {
      return;
    }

    const reachedTarget = currentHref === navigationState.href;

    if (!reachedTarget) {
      return;
    }

    const elapsed = Date.now() - navigationState.startedAt;
    const remaining = Math.max(0, MIN_PENDING_MS - elapsed);
    const timeoutId = window.setTimeout(() => {
      clearResourcesNavigation(navigationState.id);
    }, remaining);

    return () => window.clearTimeout(timeoutId);
  }, [navigationState, currentHref]);

  if (!navigationState.mode) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-auto bg-surface-50"
    >
      {navigationState.mode === "discover"
        ? <ResourcesPageSkeleton />
        : <ResourcesRouteSkeleton />}
    </div>
  );
}
