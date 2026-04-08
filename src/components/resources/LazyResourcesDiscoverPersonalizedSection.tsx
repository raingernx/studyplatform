"use client";

import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { ResourceCardData } from "@/components/resources/ResourceCard";
import { useAuthViewer } from "@/lib/auth/use-auth-viewer";
import { ResourcesViewerStateProvider } from "./ResourcesViewerStateProvider";

type ResourcesDiscoverPersonalizedSectionProps = {
  fallbackCards: ResourceCardData[];
  eagerCardCount?: number;
  eagerPreviewUrls?: string[];
};

let resourcesDiscoverPersonalizedSectionLoader:
  Promise<ComponentType<ResourcesDiscoverPersonalizedSectionProps>> | null = null;

async function loadResourcesDiscoverPersonalizedSection() {
  if (!resourcesDiscoverPersonalizedSectionLoader) {
    resourcesDiscoverPersonalizedSectionLoader = import(
      "@/components/resources/ResourcesDiscoverPersonalizedSection"
    ).then((module) => module.ResourcesDiscoverPersonalizedSection);
  }

  return resourcesDiscoverPersonalizedSectionLoader;
}

export function LazyResourcesDiscoverPersonalizedSection({
  fallbackCards,
  eagerCardCount = 0,
  eagerPreviewUrls = [],
  children,
}: {
  fallbackCards: ResourceCardData[];
  eagerCardCount?: number;
  eagerPreviewUrls?: string[];
  children: ReactNode;
}) {
  const authViewer = useAuthViewer({ strategy: "idle", idleTimeoutMs: 800 });
  const [
    ResourcesDiscoverPersonalizedSection,
    setResourcesDiscoverPersonalizedSection,
  ] = useState<ComponentType<ResourcesDiscoverPersonalizedSectionProps> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    if (!authViewer.isReady || !authViewer.authenticated) {
      return () => {
        cancelled = true;
      };
    }

    void loadResourcesDiscoverPersonalizedSection().then((component) => {
      if (!cancelled) {
        setResourcesDiscoverPersonalizedSection(() => component);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authViewer.authenticated, authViewer.isReady]);

  if (
    !authViewer.isReady ||
    !authViewer.authenticated ||
    !ResourcesDiscoverPersonalizedSection
  ) {
    return <>{children}</>;
  }

  return (
    <ResourcesViewerStateProvider>
      <ResourcesDiscoverPersonalizedSection
        fallbackCards={fallbackCards}
        eagerCardCount={eagerCardCount}
        eagerPreviewUrls={eagerPreviewUrls}
      />
    </ResourcesViewerStateProvider>
  );
}
