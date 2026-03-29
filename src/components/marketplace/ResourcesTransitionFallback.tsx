"use client";

import type { ReactNode } from "react";
import { ResourceDetailLoadingShell } from "@/components/resources/ResourceDetailLoadingShell";
import { useResourcesNavigationState } from "@/components/marketplace/resourcesNavigationState";

export function ResourcesTransitionFallback({
  children,
}: {
  children: ReactNode;
}) {
  const navigationState = useResourcesNavigationState();

  if (navigationState.mode === "detail") {
    return <ResourceDetailLoadingShell />;
  }

  return <>{children}</>;
}
