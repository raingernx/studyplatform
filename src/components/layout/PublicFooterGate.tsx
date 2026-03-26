"use client";

import type { ReactNode } from "react";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { useResourcesNavigationState } from "@/components/marketplace/resourcesNavigationState";
import { cn } from "@/lib/utils";

export function PublicFooterGate({ children }: { children: ReactNode }) {
  const navigationState = useResourcesNavigationState();
  const isPending = Boolean(navigationState.mode);

  return (
    <div
      aria-hidden={isPending || undefined}
      className={cn(
        "transition-opacity duration-150 ease-out",
        isPending && "pointer-events-none invisible select-none opacity-0",
      )}
    >
      <PublicSiteFooter>{children}</PublicSiteFooter>
    </div>
  );
}
