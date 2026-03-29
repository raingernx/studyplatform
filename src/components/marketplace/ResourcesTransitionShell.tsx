"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ResourceDetailLoadingShell } from "@/components/resources/ResourceDetailLoadingShell";
import {
  canonicalizeResourcesHref,
  clearResourcesNavigation,
  useResourcesNavigationState,
} from "@/components/marketplace/resourcesNavigationState";

const MIN_PENDING_MS = 260;

export function ResourcesTransitionShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationState = useResourcesNavigationState();
  const currentSearch = searchParams.toString();
  const currentHref = canonicalizeResourcesHref(
    currentSearch ? `${pathname}?${currentSearch}` : pathname,
  );
  const isPending = Boolean(navigationState.mode && navigationState.href);
  const shouldFreezePreviousRoute =
    isPending && navigationState.mode !== "detail";
  const shouldShowPendingDetailShell =
    isPending &&
    navigationState.mode === "detail" &&
    currentHref !== navigationState.href;
  const reachedTarget =
    isPending && currentHref === navigationState.href;
  const [frozenChildren, setFrozenChildren] = useState(children);

  useEffect(() => {
    if (!shouldFreezePreviousRoute) {
      setFrozenChildren(children);
    }
  }, [children, shouldFreezePreviousRoute]);

  useEffect(() => {
    if (!navigationState.mode || !navigationState.href || !reachedTarget) {
      return;
    }

    const elapsed = Date.now() - navigationState.startedAt;
    const remaining = Math.max(0, MIN_PENDING_MS - elapsed);
    let frameId = 0;
    let nestedFrameId = 0;
    const timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        nestedFrameId = window.requestAnimationFrame(() => {
          clearResourcesNavigation(navigationState.id);
        });
      });
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (nestedFrameId) {
        window.cancelAnimationFrame(nestedFrameId);
      }
    };
  }, [navigationState, reachedTarget]);

  return (
    <div className="relative min-h-full">
      <div
        aria-busy={isPending}
        className={
          shouldFreezePreviousRoute
            ? "pointer-events-none opacity-[0.94] transition-opacity duration-150 ease-out motion-reduce:transition-none"
            : "transition-opacity duration-150 ease-out motion-reduce:transition-none"
        }
      >
        {shouldShowPendingDetailShell
          ? <ResourceDetailLoadingShell />
          : shouldFreezePreviousRoute
            ? frozenChildren
            : children}
      </div>

      {shouldFreezePreviousRoute ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.22))]"
        />
      ) : null}
    </div>
  );
}
