import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatorResourceForm } from "@/components/creator/CreatorResourceForm";
import { routes } from "@/lib/routes";
import { getCreatorAccessState, getCreatorResourceFormData } from "@/services/creator.service";

export const metadata = {
  title: "Create Resource – PaperDock",
};

export const dynamic = "force-dynamic";

export default async function CreatorNewResourcePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/resources/new");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }
  if (!access.canCreate) {
    redirect(routes.creatorResources);
  }

  const { categories } = await getCreatorResourceFormData(session.user.id);

  return (
    <div className="px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <CreatorResourceForm mode="create" categories={categories} />
      </div>
    </div>
  );
}
