"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import {
  inferResourcesNavigationMode,
  isResourcesSubtreePath,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";
import { routes } from "@/lib/routes";

const RESOURCE_DETAIL_SHELL_SELECTOR = '[data-route-shell-ready="resource-detail"]';
const RESOURCES_BROWSE_SHELL_SELECTOR = '[data-route-shell-ready="resources-browse"]';
const MIN_ENTRY_PENDING_MS = 260;

function resolveResourcesOverlayMode(
  pathname: string | null,
  href: string | null,
): "discover" | "listing" | "detail" {
  const targetMode = href ? inferResourcesNavigationMode(href) : null;

  if (targetMode === "detail") {
    return "detail";
  }

  if (targetMode === "listing") {
    return "listing";
  }

  if (targetMode === "discover") {
    return "discover";
  }

  if (pathname?.startsWith(`${routes.marketplace}/`)) {
    return "detail";
  }

  return "discover";
}

export function ResourcesEntryNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useResourcesNavigationState();
  const previousPathRef = useRef(pathname);
  const [forcedOverlay, setForcedOverlay] = useState(false);
  const targetHref = navigationState.href;
  const isCrossingIntoResources =
    Boolean(targetHref) &&
    Boolean(navigationState.overlay) &&
    inferResourcesNavigationMode(targetHref ?? "") !== null &&
    !isResourcesSubtreePath(pathname ?? "");
  const crossedIntoResources =
    isResourcesSubtreePath(pathname ?? "") &&
    !isResourcesSubtreePath(previousPathRef.current ?? "");

  useEffect(() => {
    if (crossedIntoResources) {
      setForcedOverlay(true);
    } else if (!isResourcesSubtreePath(pathname ?? "")) {
      setForcedOverlay(false);
    }

    previousPathRef.current = pathname;
  }, [crossedIntoResources, pathname]);

  useEffect(() => {
    if (!forcedOverlay) {
      return;
    }

    const routeShellSelector = pathname === routes.marketplace
      ? RESOURCES_BROWSE_SHELL_SELECTOR
      : RESOURCE_DETAIL_SHELL_SELECTOR;

    return waitForNavigationSurfaceReady(
      routeShellSelector,
      () => {
        setForcedOverlay(false);
      },
      MIN_ENTRY_PENDING_MS,
      navigationState.startedAt || Date.now(),
    );
  }, [forcedOverlay, navigationState.startedAt, pathname]);

  const stateDrivenOverlay = isCrossingIntoResources;

  if (!stateDrivenOverlay && !forcedOverlay && !crossedIntoResources) {
    return null;
  }

  const overlayMode = resolveResourcesOverlayMode(pathname, navigationState.href);

  return (
    <div data-loading-scope="resources-browse" className="fixed inset-0 z-[84] bg-background">
      {overlayMode === "detail"
        ? <ResourceDetailLoadingShell />
        : <ResourcesRouteSkeleton mode={overlayMode} />}
    </div>
  );
}
