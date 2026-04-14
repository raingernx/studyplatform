import { DashboardV2DownloadsContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2DownloadsData } from "@/services/dashboard-v2/downloads.service";

export const metadata = {
  title: "Downloads",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2DownloadsPage() {
  const { userId } = await requireSession(routes.dashboardV2Downloads);
  const data = await getDashboardV2DownloadsData({ userId });

  return <DashboardV2DownloadsContent data={data} />;
}
