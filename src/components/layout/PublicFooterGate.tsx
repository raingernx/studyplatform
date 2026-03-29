"use client";

import type { ReactNode } from "react";
import { PublicSiteFooter } from "@/components/layout/PublicSiteFooter";
import { useResourcesNavigationState } from "@/components/marketplace/resourcesNavigationState";

export function PublicFooterGate({ children }: { children: ReactNode }) {
  const navigationState = useResourcesNavigationState();
  const isPending = Boolean(navigationState.mode);

  if (isPending) {
    return null;
  }

  return <PublicSiteFooter>{children}</PublicSiteFooter>;
}
