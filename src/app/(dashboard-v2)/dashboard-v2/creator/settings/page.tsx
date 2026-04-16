import { redirect } from "next/navigation";

import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Creator Settings",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2CreatorSettingsPage() {
  await requireCreatorDashboardAccess(routes.dashboardV2CreatorSettings);
  redirect(routes.dashboardV2Settings);
}
