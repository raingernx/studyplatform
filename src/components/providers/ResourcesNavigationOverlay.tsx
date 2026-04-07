"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import {
  inferResourcesNavigationMode,
  isResourcesSubtreePath,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";
import { routes } from "@/lib/routes";

const RESOURCE_DETAIL_SHELL_SELECTOR = '[data-route-shell-ready="resource-detail"]';
const RESOURCES_BROWSE_SHELL_SELECTOR = '[data-route-shell-ready="resources-browse"]';

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

export function ResourcesNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useResourcesNavigationState();
  const previousPathRef = useRef(pathname);
  const [forcedOverlay, setForcedOverlay] = useState(false);
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

    const routeShellSelector = pathname === "/resources"
      ? RESOURCES_BROWSE_SHELL_SELECTOR
      : RESOURCE_DETAIL_SHELL_SELECTOR;

    return waitForNavigationSurfaceReady(
      routeShellSelector,
      () => {
        setForcedOverlay(false);
      },
      0,
      Date.now(),
    );
  }, [forcedOverlay, pathname]);

  const stateDrivenOverlay = Boolean(
    navigationState.mode && navigationState.href && navigationState.overlay,
  );
  const overlayMode = resolveResourcesOverlayMode(pathname, navigationState.href);
  const overlayScope = overlayMode === "detail" ? "resource-detail" : "resources-browse";

  if (!stateDrivenOverlay && !forcedOverlay && !crossedIntoResources) {
    return null;
  }

  return (
    <div data-loading-scope={overlayScope} className="fixed inset-0 z-[85] bg-background">
      {overlayMode === "detail"
        ? <ResourceDetailLoadingShell />
        : <ResourcesRouteSkeleton mode={overlayMode} />}
    </div>
  );
}
