import { Suspense, type ReactNode } from "react";
import { ResourcesNavigationFeedback } from "@/components/marketplace/ResourcesNavigationFeedback";
import { ResourcesTransitionFallback } from "@/components/marketplace/ResourcesTransitionFallback";
import { ResourcesTransitionShell } from "@/components/marketplace/ResourcesTransitionShell";

export default function LocaleResourcesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ResourcesNavigationFeedback />
      </Suspense>
      <Suspense fallback={<ResourcesTransitionFallback>{children}</ResourcesTransitionFallback>}>
        <ResourcesTransitionShell>{children}</ResourcesTransitionShell>
      </Suspense>
    </>
  );
}
