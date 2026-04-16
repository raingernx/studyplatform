import { DashboardV2SettingsStreamedContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireSession } from "@/lib/auth/require-session";
import { routes } from "@/lib/routes";
import { getDashboardV2SettingsData } from "@/services/dashboard-v2/settings.service";

export const metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function DashboardV2SettingsPage() {
  const { userId, session } = await requireSession(routes.dashboardV2Settings);
  const dataPromise = getDashboardV2SettingsData({
    userId,
    fallbackUser: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  });

  return <DashboardV2SettingsStreamedContent dataPromise={dataPromise} />;
}
