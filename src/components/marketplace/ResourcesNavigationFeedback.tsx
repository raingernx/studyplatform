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
      <div className="relative h-1.5 overflow-hidden border-b border-brand-200/60 bg-brand-100/70 shadow-[0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-sm">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-80" />
      </div>
    </div>
  );
}
