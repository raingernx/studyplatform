"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { DashboardGroupLoadingShell } from "@/components/skeletons/DashboardGroupLoadingShell";
import { useDashboardNavigationState } from "@/components/layout/dashboard/dashboardNavigationState";
import {
  isDashboardGroupHref,
  isDashboardGroupPath,
  renderDashboardOverlayContent,
  shouldWrapDashboardOverlayInShell,
} from "@/components/providers/dashboardNavigationOverlayShared";

export function DashboardEntryNavigationOverlay() {
  const pathname = usePathname();
  const navigationState = useDashboardNavigationState();
  const targetHref = navigationState.href;
  const showEntryOverlay = useMemo(() => {
    if (!targetHref || !navigationState.overlay || !isDashboardGroupHref(targetHref)) {
      return false;
    }

    if (!isDashboardGroupPath(pathname)) {
      return true;
    }

    const targetPathname = new URL(targetHref, "http://dashboard.local").pathname;
    return targetPathname === pathname;
  }, [navigationState.overlay, pathname, targetHref]);

  if (!showEntryOverlay) {
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
