import { DashboardV2LibraryContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2LibraryData } from "@/services/dashboard-v2/library.service";

export const metadata = {
  title: "Library",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }) {
  const params = searchParams ? await searchParams : {};
  const { userId } = await requireSession(routes.dashboardV2Library);
  const data = await getDashboardV2LibraryData({
    userId,
    rawQuery: params.q,
    rawFilter: params.filter,
    rawPayment: params.payment,
  });

  return <DashboardV2LibraryContent data={data} />;
}
