import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CreatorResourceForm } from "@/components/creator/CreatorResourceForm";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";
import {
  getCreatorAccessState,
  getCreatorResourceForEdit,
  getCreatorResourceFormData,
} from "@/services/creator.service";

export const metadata = {
  title: "Edit Resource",
};

export const dynamic = "force-dynamic";

type CreatorEditResourcePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreatorEditResourcePage({
  params,
}: CreatorEditResourcePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/login?next=/dashboard/creator/resources");
  }

  const access = await getCreatorAccessState(session.user.id);
  if (!access.eligible) {
    redirect(routes.creatorApply);
  }

  const { id } = await params;
  const [resource, formData] = await Promise.all([
    getCreatorResourceForEdit(session.user.id, id),
    getCreatorResourceFormData(session.user.id),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <PageContent>
      <CreatorResourceForm
        mode="edit"
        categories={formData.categories}
        initialValues={{
          id: resource.id,
          title: resource.title,
          description: resource.description,
          slug: resource.slug,
          type: resource.type as "PDF" | "DOCUMENT",
          status: resource.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          isFree: resource.isFree || resource.price === 0,
          price: resource.isFree || resource.price === 0 ? "" : String(resource.price / 100),
          categoryId: resource.categoryId ?? "",
          fileUrl: resource.fileUrl ?? "",
          previewUrls: resource.previewUrls,
        }}
      />
    </PageContent>
  );
}
