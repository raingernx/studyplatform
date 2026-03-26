import { Suspense, type ReactNode } from "react";
import { ResourcesNavigationFeedback } from "@/components/marketplace/ResourcesNavigationFeedback";

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
      {children}
    </>
  );
}
