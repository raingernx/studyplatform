import { CreatorResourceProgress } from "@/components/creator/CreatorResourceProgress";
import { CreatorResourceHelperCard } from "@/components/creator/CreatorResourceHelperCard";
import { CreatorResourceForm } from "@/components/creator/CreatorResourceForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { routes } from "@/lib/routes";
import {
  getCreatorResourceFormDataForWorkspace,
  getCreatorResourceOnboardingSurfaceSummaryForWorkspace,
} from "@/services/creator";
import { logActivity } from "@/lib/activity";
import { getCreatorProtectedUserContext } from "../../creatorProtectedUser";

export const metadata = {
  title: "Create Resource",
};

export const dynamic = "force-dynamic";

export default async function CreatorNewResourcePage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorNewResource);
  const formData = await getCreatorResourceFormDataForWorkspace(userId);
  const onboardingSurface =
    await getCreatorResourceOnboardingSurfaceSummaryForWorkspace(userId);
  const isFirstResource = onboardingSurface.isFirstResource;

  if (isFirstResource) {
    void logActivity({
      userId,
      action: "creator_create_first_resource_click",
      entity: "creator",
      entityId: userId,
    });
  }

  return (
    <DashboardPageShell routeReady="dashboard-creator-resource-editor">
      <DashboardPageHeader
        eyebrow="Creator"
        title={isFirstResource ? "Create your first resource" : "New resource"}
        description={
          isFirstResource
            ? "Fill in the details below. You can save a draft first and publish when you're ready."
            : "Complete the form below and save as a draft or publish directly."
        }
      />

      {/* Step progress */}
      <CreatorResourceProgress activeStep={1} />

      {/* Layout: form + optional helper sidebar */}
      <div
        className={
          isFirstResource ? "grid gap-6 lg:grid-cols-[1fr_280px]" : undefined
        }
      >
        <CreatorNewResourceFormSection
          categories={formData.categories}
          isFirstResource={isFirstResource}
        />

        {isFirstResource && (
          <aside className="space-y-4">
            <CreatorResourceHelperCard />
          </aside>
        )}
      </div>
    </DashboardPageShell>
  );
}

function CreatorNewResourceFormSection({
  categories,
  isFirstResource,
}: {
  categories: Awaited<ReturnType<typeof getCreatorResourceFormDataForWorkspace>>["categories"];
  isFirstResource: boolean;
}) {
  return (
    <CreatorResourceForm
      mode="create"
      categories={categories}
      isFirstResource={isFirstResource}
    />
  );
}
