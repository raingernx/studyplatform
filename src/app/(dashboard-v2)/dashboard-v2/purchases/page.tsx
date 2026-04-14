import { DashboardV2PurchasesContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2PurchasesData } from "@/services/dashboard-v2/purchases.service";

export const metadata = {
  title: "Purchases",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2PurchasesPage() {
  const { userId } = await requireSession(routes.dashboardV2Purchases);
  const data = await getDashboardV2PurchasesData({ userId });

  return <DashboardV2PurchasesContent data={data} />;
}
