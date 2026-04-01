"use client";

import { ResourceCard, type ResourceCardData, type ResourceCardVariant } from "./ResourceCard";
import { useResourcesViewerState } from "./ResourcesViewerStateProvider";

export function ViewerAwareResourceCard({
  owned,
  ...props
}: {
  resource: ResourceCardData;
  variant?: ResourceCardVariant | "preview";
  size?: "sm" | "md" | "lg";
  owned?: boolean;
  previewMode?: boolean;
  linkPrefetchMode?: "intent" | "viewport" | "none";
  linkPrefetchScope?: string;
}) {
  const { ownedIdSet } = useResourcesViewerState();
  const isOwned = owned ?? ownedIdSet.has(props.resource.id);

  return <ResourceCard {...props} owned={isOwned} />;
}
