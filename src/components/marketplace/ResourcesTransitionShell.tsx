"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { ResourceDetailLoadingShell } from "@/components/resources/detail/ResourceDetailLoadingShell";
import { useResourcesNavigationState } from "@/components/marketplace/resourcesNavigationState";

function scrollViewportToTopInstantly() {
  const root = document.documentElement;
  const body = document.body;
  const previousRootBehavior = root.style.scrollBehavior;
  const previousBodyBehavior = body.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo(0, 0);
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
  }
  root.scrollTop = 0;
  body.scrollTop = 0;
  root.style.scrollBehavior = previousRootBehavior;
  body.style.scrollBehavior = previousBodyBehavior;
}

export function ResourcesTransitionShell({
  children,
}: {
  children: ReactNode;
}) {
  const navigationState = useResourcesNavigationState();
  const isPending = Boolean(navigationState.mode && navigationState.href);
  const isOverlayPending = isPending && navigationState.overlay;
  const shouldFreezePreviousRoute =
    isPending && !isOverlayPending && navigationState.mode !== "detail";
  const shouldShowPendingDetailShell =
    isPending && !isOverlayPending && navigationState.mode === "detail";
  const [frozenChildren, setFrozenChildren] = useState(children);

  useEffect(() => {
    if (!shouldFreezePreviousRoute) {
      setFrozenChildren(children);
    }
  }, [children, shouldFreezePreviousRoute]);

  useLayoutEffect(() => {
    if (!shouldShowPendingDetailShell) {
      return;
    }

    scrollViewportToTopInstantly();
  }, [shouldShowPendingDetailShell, navigationState.id]);

  return (
    <div className="relative min-h-full">
      <div
        aria-busy={isPending && !isOverlayPending}
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
