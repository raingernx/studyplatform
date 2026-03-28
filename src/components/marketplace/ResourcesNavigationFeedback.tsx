"use client";

import { useResourcesNavigationState } from "@/components/marketplace/resourcesNavigationState";

export function ResourcesNavigationFeedback() {
  const navigationState = useResourcesNavigationState();

  if (!navigationState.mode) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80]"
    >
      <div className="relative h-1.5 overflow-hidden border-b border-brand-200/60 bg-brand-100/80 shadow-[0_1px_0_rgba(255,255,255,0.65)]">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500" />
      </div>
    </div>
  );
}
