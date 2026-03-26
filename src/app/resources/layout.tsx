import { Suspense, type ReactNode } from "react";
import { ResourcesNavigationFeedback } from "@/components/marketplace/ResourcesNavigationFeedback";
import { ResourcesTransitionShell } from "@/components/marketplace/ResourcesTransitionShell";

export default function ResourcesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ResourcesNavigationFeedback />
      </Suspense>
      <ResourcesTransitionShell>{children}</ResourcesTransitionShell>
    </>
  );
}
