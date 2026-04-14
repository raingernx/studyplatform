import { DashboardV2CreatorResourceEditorContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorEditorData } from "@/services/dashboard-v2/creator-editor.service";

export const metadata = {
  title: "New Resource",
};

async function applyDashboardV2CreatorEditorProbe(
  searchParams:
    | Promise<{ __forceRouteError?: string; __delayMs?: string }>
    | undefined,
) {
  if (process.env.NODE_ENV === "production" || !searchParams) {
    return;
  }

  const { __forceRouteError, __delayMs } = await searchParams;

  if (__forceRouteError === "1") {
    throw new Error("Forced dashboard-v2 creator editor route error");
  }

  const delayMs = Number(__delayMs);
  if (Number.isFinite(delayMs) && delayMs > 0) {
    const boundedDelay = Math.min(delayMs, 5000);
    await new Promise((resolve) => setTimeout(resolve, boundedDelay));
  }
}

export default async function DashboardV2CreatorNewResourcePage({
  searchParams,
}: {
  searchParams?: Promise<{ __forceRouteError?: string; __delayMs?: string }>;
}) {
  await applyDashboardV2CreatorEditorProbe(searchParams);
  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorNewResource,
  );
  const data = await getDashboardV2CreatorEditorData({
    userId,
    mode: "new",
  });

  return <DashboardV2CreatorResourceEditorContent mode="new" data={data} />;
}
