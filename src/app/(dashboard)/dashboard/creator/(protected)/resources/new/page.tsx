import { Suspense } from "react";
import nextDynamic from "next/dynamic";
import { CreatorResourceProgress } from "@/components/creator/CreatorResourceProgress";
import { CreatorResourceHelperCard } from "@/components/creator/CreatorResourceHelperCard";
import { CreatorResourceFormLoadingShell } from "@/components/creator/CreatorResourceFormLoadingShell";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { routes } from "@/lib/routes";
import { getCreatorResourceFormData } from "@/services/creator";
import { getCreatorSetupState } from "@/services/creator";
import { logActivity } from "@/lib/activity";
import { getCreatorProtectedUserContext } from "../../creatorProtectedUser";

const CreatorResourceForm = nextDynamic(
  () =>
    import("@/components/creator/CreatorResourceForm").then(
      (mod) => mod.CreatorResourceForm,
    ),
  {
    loading: () => <CreatorResourceFormLoadingShell />,
  },
);

export const metadata = {
  title: "Create Resource",
};

export const dynamic = "force-dynamic";

export default async function CreatorNewResourcePage() {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorNewResource);
  const setupState = await getCreatorSetupState(userId);

  const isFirstResource = setupState.totalResources === 0;

  if (isFirstResource) {
    void logActivity({
      userId,
      action: "creator_create_first_resource_click",
      entity: "creator",
      entityId: userId,
    });
  }

  return (
    <div
      data-route-shell-ready="dashboard-creator-resource-editor"
      className="space-y-8"
    >
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
        <Suspense fallback={<CreatorResourceFormLoadingShell />}>
          <CreatorNewResourceFormSection
            userId={userId}
            isFirstResource={isFirstResource}
          />
        </Suspense>

        {isFirstResource && (
          <aside className="space-y-4">
            <CreatorResourceHelperCard />
          </aside>
        )}
      </div>
    </div>
  );
}

async function CreatorNewResourceFormSection({
  userId,
  isFirstResource,
}: {
  userId: string;
  isFirstResource: boolean;
}) {
  const { categories } = await getCreatorResourceFormData(userId);

  return (
    <CreatorResourceForm
      mode="create"
      categories={categories}
      isFirstResource={isFirstResource}
    />
  );
}
