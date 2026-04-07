"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";
import { useDashboardNavigationState } from "@/components/layout/dashboard/dashboardNavigationState";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import {
  inferResourcesNavigationMode,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";
import {
  isDashboardGroupHref,
  isDashboardGroupPath,
  renderDashboardOverlayContent,
} from "@/components/providers/dashboardNavigationOverlayShared";

const DASHBOARD_ROUTE_SHELL_SELECTOR = '[data-route-shell-ready="dashboard"]';

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
  const previousPathRef = useRef(pathname);
  const [forcedOverlay, setForcedOverlay] = useState(false);
  const crossedIntoDashboard =
    isDashboardGroupPath(pathname) && !isDashboardGroupPath(previousPathRef.current);

  useEffect(() => {
    if (crossedIntoDashboard) {
      setForcedOverlay(true);
    } else if (!isDashboardGroupPath(pathname)) {
      setForcedOverlay(false);
    }

    previousPathRef.current = pathname;
  }, [crossedIntoDashboard, pathname]);

  useEffect(() => {
    if (!forcedOverlay) {
      return;
    }

    return waitForNavigationSurfaceReady(
      DASHBOARD_ROUTE_SHELL_SELECTOR,
      () => {
        setForcedOverlay(false);
      },
      0,
      Date.now(),
    );
  }, [forcedOverlay]);

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

  if (
    !stateDrivenOverlay &&
    !resourcesStateDrivenOverlay &&
    !forcedOverlay &&
    !crossedIntoDashboard
  ) {
    return null;
  }

  if (resourcesStateDrivenOverlay) {
    return (
      <div
        data-loading-scope={resourcesOverlay.scope}
        className="fixed inset-0 z-[90] bg-background"
      >
        {resourcesOverlay.content}
      </div>
    );
  }

  const shouldWrapInDashboardShell = overlayContent.type !== DashboardGroupLoadingShell;

  return (
    <div data-loading-scope="dashboard-group" className="fixed inset-0 z-[90] bg-background">
      {shouldWrapInDashboardShell
        ? <DashboardGroupLoadingShell>{overlayContent}</DashboardGroupLoadingShell>
        : overlayContent}
    </div>
  );
}
