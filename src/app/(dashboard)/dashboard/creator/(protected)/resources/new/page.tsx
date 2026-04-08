import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";
import { requireSession } from "@/lib/auth/require-session";
import { CreatorResourceProgress } from "@/components/creator/CreatorResourceProgress";
import { CreatorResourceHelperCard } from "@/components/creator/CreatorResourceHelperCard";
import { CreatorResourceFormLoadingShell } from "@/components/creator/CreatorResourceFormLoadingShell";
import { routes } from "@/lib/routes";
import { getCreatorResourceFormData } from "@/services/creator";
import { getCreatorSetupState } from "@/services/creator";
import { logActivity } from "@/lib/activity";

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
  const { userId } = await requireSession(routes.creatorNewResource);
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

  const { categories } = await getCreatorResourceFormData(userId);

  return (
    <div
      data-route-shell-ready="dashboard-creator-resource-editor"
      className="space-y-6"
    >
      {/* Page header */}
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">Creator</p>
        <h1 className="mt-2 font-display text-h2 font-semibold tracking-tight text-foreground">
          {isFirstResource ? "Create your first resource" : "New resource"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFirstResource
            ? "Fill in the details below. You can save a draft first and publish when you're ready."
            : "Complete the form below and save as a draft or publish directly."}
        </p>
      </div>

      {/* Step progress */}
      <CreatorResourceProgress activeStep={1} />

      {/* Layout: form + optional helper sidebar */}
      <div
        className={
          isFirstResource ? "grid gap-6 lg:grid-cols-[1fr_280px]" : undefined
        }
      >
        <CreatorResourceForm
          mode="create"
          categories={categories}
          isFirstResource={isFirstResource}
        />

        {isFirstResource && (
          <aside className="space-y-4">
            <CreatorResourceHelperCard />
          </aside>
        )}
      </div>
    </div>
  );
}
