import { DashboardV2CreatorResourceEditorContent } from "@/components/dashboard-v2/DashboardV2Sections";
import { requireCreatorDashboardAccess } from "@/lib/auth/require-creator-dashboard-access";
import { routes } from "@/lib/routes";
import { getDashboardV2CreatorEditorData } from "@/services/dashboard-v2/creator-editor.service";

export const metadata = {
  title: "Edit Resource",
};

export default async function DashboardV2CreatorResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    focus?: string;
    __forceRouteError?: string;
    __delayMs?: string;
  }>;
}) {
  const { id } = await params;
  const { focus, __forceRouteError, __delayMs } = await searchParams;

  if (process.env.NODE_ENV !== "production") {
    if (__forceRouteError === "1") {
      throw new Error("Forced dashboard-v2 creator editor route error");
    }

    const delayMs = Number(__delayMs);
    if (Number.isFinite(delayMs) && delayMs > 0) {
      const boundedDelay = Math.min(delayMs, 5000);
      await new Promise((resolve) => setTimeout(resolve, boundedDelay));
    }
  }

  const { userId } = await requireCreatorDashboardAccess(
    routes.dashboardV2CreatorResource(id),
  );
  const data = await getDashboardV2CreatorEditorData({
    userId,
    mode: "edit",
    resourceId: id,
    focus,
  });

  return (
    <DashboardV2CreatorResourceEditorContent
      mode="edit"
      resourceId={id}
      data={data}
    />
  );
}
