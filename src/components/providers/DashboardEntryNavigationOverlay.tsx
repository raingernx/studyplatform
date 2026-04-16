"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardV2ShellSkeleton } from "@/components/skeletons/DashboardV2PrototypeSkeleton";
import { useDashboardNavigationState } from "@/components/layout/dashboard/dashboardNavigationState";
import {
  getDashboardReadySelector,
  isDashboardGroupHref,
  isDashboardGroupPath,
} from "@/components/providers/dashboardNavigationOverlayShared";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";

const MIN_ENTRY_PENDING_MS = 220;

export function DashboardEntryNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useDashboardNavigationState();
  const previousPathRef = useRef(pathname);
  const forcedOverlayStartedAtRef = useRef(0);
  const [forcedOverlay, setForcedOverlay] = useState(false);
  const isCrossingIntoDashboard =
    Boolean(navigationState.href) &&
    Boolean(navigationState.overlay) &&
    isDashboardGroupHref(navigationState.href ?? "") &&
    !isDashboardGroupPath(pathname ?? "");
  const crossedIntoDashboard =
    isDashboardGroupPath(pathname ?? "") &&
    !isDashboardGroupPath(previousPathRef.current ?? "");

  useEffect(() => {
    if (crossedIntoDashboard) {
      forcedOverlayStartedAtRef.current = Date.now();
      setForcedOverlay(true);
    } else if (!isDashboardGroupPath(pathname ?? "")) {
      forcedOverlayStartedAtRef.current = 0;
      setForcedOverlay(false);
    }

    previousPathRef.current = pathname;
  }, [crossedIntoDashboard, pathname]);

  useEffect(() => {
    if (!forcedOverlay) {
      return;
    }

    return waitForNavigationSurfaceReady(
      getDashboardReadySelector(pathname, navigationState.href),
      () => {
        setForcedOverlay(false);
      },
      MIN_ENTRY_PENDING_MS,
      forcedOverlayStartedAtRef.current || navigationState.startedAt || Date.now(),
    );
  }, [forcedOverlay, navigationState.href, navigationState.startedAt, pathname]);

  if (!isCrossingIntoDashboard && !forcedOverlay && !crossedIntoDashboard) {
    return null;
  }

  return (
    <div
      data-loading-scope="dashboard-group"
      className="pointer-events-none fixed inset-0 z-[84] bg-background"
    >
      <DashboardV2ShellSkeleton />
    </div>
  );
}
