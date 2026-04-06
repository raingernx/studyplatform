import { Suspense, type ReactNode } from "react";
import { ResourcesNavigationFeedback } from "@/components/marketplace/ResourcesNavigationFeedback";
import { ResourcesTransitionFallback } from "@/components/marketplace/ResourcesTransitionFallback";
import { ResourcesTransitionShell } from "@/components/marketplace/ResourcesTransitionShell";

export function ResourcesLayoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ResourcesNavigationFeedback />
      <Suspense fallback={<ResourcesTransitionFallback />}>
        <ResourcesTransitionShell>{children}</ResourcesTransitionShell>
      </Suspense>
    </>
  );
}
