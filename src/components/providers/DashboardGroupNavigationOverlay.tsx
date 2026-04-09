"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";
import {
  clearDashboardNavigation,
  useDashboardNavigationState,
} from "@/components/layout/dashboard/dashboardNavigationState";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import {
  inferResourcesNavigationMode,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";
import {
  getDashboardReadySelector,
  isDashboardGroupHref,
  isDashboardGroupPath,
  renderDashboardOverlayContent,
  shouldWrapDashboardOverlayInShell,
} from "@/components/providers/dashboardNavigationOverlayShared";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";

const MIN_PENDING_MS = 220;

function renderResourcesOverlayContent(href: string | null) {
  const mode = href ? inferResourcesNavigationMode(href) : null;

  if (mode === "detail") {
    return {
      scope: "resource-detail" as const,
      content: <ResourceDetailLoadingShell />,
    };
  }

  return {
    scope: "resources-browse" as const,
    content: <ResourcesRouteSkeleton mode={mode === "listing" ? "listing" : "discover"} />,
  };
}

export function DashboardGroupNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useDashboardNavigationState();
  const resourcesNavigationState = useResourcesNavigationState();

  const stateDrivenOverlay = Boolean(
    navigationState.href &&
    navigationState.overlay &&
    isDashboardGroupHref(navigationState.href),
  );
  const resourcesStateDrivenOverlay = Boolean(
    isDashboardGroupPath(pathname) &&
    resourcesNavigationState.href &&
    resourcesNavigationState.overlay &&
    inferResourcesNavigationMode(resourcesNavigationState.href),
  );
  const overlayContent = renderDashboardOverlayContent(pathname, navigationState.href);
  const resourcesOverlay = renderResourcesOverlayContent(resourcesNavigationState.href);

  useEffect(() => {
    if (!stateDrivenOverlay) {
      return;
    }

    const readySelector = getDashboardReadySelector(pathname, navigationState.href);

    return waitForNavigationSurfaceReady(
      readySelector,
      () => {
        clearDashboardNavigation(navigationState.id);
      },
      MIN_PENDING_MS,
      navigationState.startedAt,
    );
  }, [
    navigationState.href,
    navigationState.id,
    navigationState.startedAt,
    pathname,
    stateDrivenOverlay,
  ]);

  if (
    !stateDrivenOverlay &&
    !resourcesStateDrivenOverlay
  ) {
    return null;
  }

  if (resourcesStateDrivenOverlay) {
    return (
      <div
        data-loading-scope={resourcesOverlay.scope}
        className="pointer-events-none fixed inset-0 z-[90] bg-background"
      >
        {resourcesOverlay.content}
      </div>
    );
  }

  const shouldWrapInDashboardShell =
    overlayContent.type !== DashboardGroupLoadingShell &&
    shouldWrapDashboardOverlayInShell(pathname, navigationState.href);

  return (
    <div
      data-loading-scope="dashboard-group"
      className="pointer-events-none fixed inset-0 z-[90] bg-background"
    >
      {shouldWrapInDashboardShell
        ? <DashboardGroupLoadingShell>{overlayContent}</DashboardGroupLoadingShell>
        : overlayContent}
    </div>
  );
}
