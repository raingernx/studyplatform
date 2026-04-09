"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  canonicalizeDashboardHref,
  clearDashboardNavigation,
  useDashboardNavigationState,
} from "./dashboardNavigationState";
import { waitForNavigationSurfaceReady } from "@/components/providers/navigationDomReady";
import { getDashboardReadySelector } from "@/components/providers/dashboardNavigationOverlayShared";

const MIN_PENDING_MS = 160;

export function DashboardNavigationReady() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationState = useDashboardNavigationState();
  const currentSearch = searchParams.toString();
  const currentHref = canonicalizeDashboardHref(
    currentSearch ? `${pathname}?${currentSearch}` : pathname,
  );

  useEffect(() => {
    if (!navigationState.href) {
      return;
    }

    if (currentHref !== navigationState.href) {
      return;
    }

    const readySelector = getDashboardReadySelector(pathname, navigationState.href);

    return waitForNavigationSurfaceReady(
      readySelector,
      () => {
        clearDashboardNavigation(navigationState.id);
      },
      MIN_PENDING_MS,
      navigationState.startedAt,
    );
  }, [currentHref, navigationState]);

  return null;
}
