import { Suspense } from "react";
import { notFound } from "next/navigation";
import nextDynamic from "next/dynamic";
import { CreatorResourceFormLoadingShell } from "@/components/creator/CreatorResourceFormLoadingShell";
import { PageContent } from "@/design-system";
import { routes } from "@/lib/routes";
import {
  getCreatorResourceForEdit,
  getCreatorResourceFormData,
} from "@/services/creator";
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
  title: "Edit Resource",
};

export const dynamic = "force-dynamic";

type CreatorEditResourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ focus?: string }>;
};

export default async function CreatorEditResourcePage({
  params,
  searchParams,
}: CreatorEditResourcePageProps) {
  const { userId } = await getCreatorProtectedUserContext(routes.creatorResources);

  const [{ id }, { focus }] = await Promise.all([params, searchParams]);
  const VALID_FOCUS_FIELDS = ["title", "description", "price", "file"] as const;
  type ValidFocusField = (typeof VALID_FOCUS_FIELDS)[number];
  const focusField: ValidFocusField | undefined = VALID_FOCUS_FIELDS.includes(
    focus as ValidFocusField,
  )
    ? (focus as ValidFocusField)
    : undefined;

  return (
    <PageContent data-route-shell-ready="dashboard-creator-resource-editor">
      <Suspense fallback={<CreatorResourceFormLoadingShell />}>
        <CreatorEditResourceFormSection
          userId={userId}
          id={id}
          focusField={focusField}
        />
      </Suspense>
    </PageContent>
  );
}

async function CreatorEditResourceFormSection({
  userId,
  id,
  focusField,
}: {
  userId: string;
  id: string;
  focusField: "title" | "description" | "price" | "file" | undefined;
}) {
  const [resource, formData] = await Promise.all([
    getCreatorResourceForEdit(userId, id),
    getCreatorResourceFormData(userId),
  ]);

  if (!resource) {
    notFound();
  }

  return (
    <CreatorResourceForm
      mode="edit"
      focusField={focusField}
      categories={formData.categories}
      initialAIDraft={
        resource.aiDraft
          ? {
              resourceId: resource.aiDraft.resourceId,
              sourceText: resource.aiDraft.sourceText,
              sourceFileName: resource.aiDraft.sourceFileName,
              subject: resource.aiDraft.subject,
              grade: resource.aiDraft.grade,
              language: resource.aiDraft.language,
              quizCount: resource.aiDraft.quizCount,
              summary: resource.aiDraft.summary,
              learningOutcomes: resource.aiDraft.learningOutcomes,
              quizDraft: resource.aiDraft.quizDraft,
              generationMode: resource.aiDraft.generationMode,
            }
          : null
      }
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
        fileKey: resource.fileKey ?? "",
        fileName: resource.fileName ?? "",
        fileSize: resource.fileSize ?? null,
        previewUrls: resource.previewUrls,
      }}
    />
  );
}
