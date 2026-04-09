"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";
import {
  clearDashboardNavigation,
  useDashboardNavigationState,
} from "@/components/layout/dashboard/dashboardNavigationState";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";
import {
  getDashboardReadySelector,
  isDashboardGroupHref,
  isDashboardGroupPath,
  renderDashboardOverlayContent,
  shouldWrapDashboardOverlayInShell,
} from "@/components/providers/dashboardNavigationOverlayShared";
const MIN_ENTRY_PENDING_MS = 220;

export function DashboardEntryNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useDashboardNavigationState();
  const previousPathRef = useRef(pathname);
  const forcedOverlayStartedAtRef = useRef(0);
  const [forcedOverlay, setForcedOverlay] = useState(false);
  const targetHref = navigationState.href;
  const isCrossingIntoDashboard =
    Boolean(targetHref) &&
    Boolean(navigationState.overlay) &&
    isDashboardGroupHref(targetHref ?? "") &&
    !isDashboardGroupPath(pathname);
  const crossedIntoDashboard =
    Boolean(navigationState.overlay) &&
    isDashboardGroupPath(pathname) && !isDashboardGroupPath(previousPathRef.current);

  useEffect(() => {
    if (crossedIntoDashboard) {
      forcedOverlayStartedAtRef.current = Date.now();
      setForcedOverlay(true);
    } else if (!isDashboardGroupPath(pathname)) {
      forcedOverlayStartedAtRef.current = 0;
      setForcedOverlay(false);
    }

    previousPathRef.current = pathname;
  }, [crossedIntoDashboard, pathname]);

  useEffect(() => {
    if (!forcedOverlay) {
      return;
    }

    const readySelector = getDashboardReadySelector(pathname, navigationState.href);

    return waitForNavigationSurfaceReady(
      readySelector,
      () => {
        setForcedOverlay(false);
        clearDashboardNavigation(navigationState.id);
      },
      MIN_ENTRY_PENDING_MS,
      forcedOverlayStartedAtRef.current || navigationState.startedAt || Date.now(),
    );
  }, [forcedOverlay, navigationState.startedAt]);

  const stateDrivenOverlay = isCrossingIntoDashboard;

  if (!stateDrivenOverlay && !forcedOverlay && !crossedIntoDashboard) {
    return null;
  }

  const overlayContent = renderDashboardOverlayContent(pathname, navigationState.href);
  const shouldWrapInDashboardShell =
    overlayContent.type !== DashboardGroupLoadingShell &&
    shouldWrapDashboardOverlayInShell(pathname, navigationState.href);

  return (
    <div
      data-loading-scope="dashboard-group"
      className="pointer-events-none fixed inset-0 z-[85] bg-background"
    >
      {shouldWrapInDashboardShell
        ? <DashboardGroupLoadingShell>{overlayContent}</DashboardGroupLoadingShell>
        : overlayContent}
    </div>
  );
}
