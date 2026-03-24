"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  canonicalizeDashboardHref,
  clearDashboardNavigation,
  useDashboardNavigationState,
} from "./dashboardNavigationState";

const MIN_PENDING_MS = 160;

export function DashboardNavigationFeedback() {
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

    const elapsed = Date.now() - navigationState.startedAt;
    const remaining = Math.max(0, MIN_PENDING_MS - elapsed);
    const timeoutId = window.setTimeout(() => {
      clearDashboardNavigation(navigationState.id);
    }, remaining);

    return () => window.clearTimeout(timeoutId);
  }, [navigationState, currentHref]);

  if (!navigationState.href) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1"
    >
      <div className="relative h-full overflow-hidden bg-brand-100/60">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 shadow-[0_0_14px_rgba(37,99,235,0.45)]" />
        <div className="absolute inset-y-0 w-1/3 animate-[pulse_0.9s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      </div>
    </div>
  );
}
