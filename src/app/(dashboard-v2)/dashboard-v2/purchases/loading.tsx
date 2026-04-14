import {
  DashboardV2PurchasesRouteFrame,
  DashboardV2PurchasesSectionsSkeleton,
} from "@/components/dashboard-v2/DashboardV2Sections";

export default function DashboardV2PurchasesLoading() {
  return (
    <DashboardV2PurchasesRouteFrame>
      <DashboardV2PurchasesSectionsSkeleton />
    </DashboardV2PurchasesRouteFrame>
  );
}
