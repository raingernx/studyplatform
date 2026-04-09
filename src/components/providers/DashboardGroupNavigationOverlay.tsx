"use client";

import { usePathname } from "next/navigation";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { ResourcesRouteSkeleton } from "@/components/skeletons/ResourcesRouteSkeleton";
import {
  inferResourcesNavigationMode,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";
import { isDashboardGroupPath } from "@/components/providers/dashboardNavigationOverlayShared";

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
  const resourcesNavigationState = useResourcesNavigationState();

  const resourcesStateDrivenOverlay = Boolean(
    isDashboardGroupPath(pathname) &&
    resourcesNavigationState.href &&
    resourcesNavigationState.overlay &&
    inferResourcesNavigationMode(resourcesNavigationState.href),
  );
  const resourcesOverlay = renderResourcesOverlayContent(resourcesNavigationState.href);

  if (!resourcesStateDrivenOverlay) {
    return null;
  }

  return (
    <div
      data-loading-scope={resourcesOverlay.scope}
      className="pointer-events-none fixed inset-0 z-[90] bg-background"
    >
      {resourcesOverlay.content}
    </div>
  );
}
