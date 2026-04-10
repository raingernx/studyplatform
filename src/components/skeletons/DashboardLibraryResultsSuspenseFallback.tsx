import { DashboardLibraryResultsSkeleton } from "@/components/skeletons/DashboardUserRouteSkeletons";
import type { getUserLibrarySurfaceSummary } from "@/services/purchases";

type LibrarySurfaceSummary = Awaited<ReturnType<typeof getUserLibrarySurfaceSummary>>;

export function DashboardLibraryResultsSuspenseFallback({
  isReturningFromCheckout,
  surfaceSummary,
}: {
  isReturningFromCheckout: boolean;
  surfaceSummary: LibrarySurfaceSummary;
}) {
  const variant = surfaceSummary.total > 0 ? "populated" : "empty";

  return (
    <DashboardLibraryResultsSkeleton
      reserveRecovery={isReturningFromCheckout && variant === "populated"}
      variant={variant}
    />
  );
}
