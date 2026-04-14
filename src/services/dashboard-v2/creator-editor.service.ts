import { routes } from "@/lib/routes";
import { findResourcePublicCacheTargetById } from "@/repositories/resources/resource.repository";
import {
  canAccessCreatorWorkspace,
  getCreatorAccessState,
  getCreatorResourceForEditForWorkspace,
  getCreatorResourceFormDataForWorkspace,
} from "@/services/creator";
import type { FieldName } from "@/components/creator/CreatorPublishReadiness";
import type {
  CreatorAIDraftValues,
} from "@/components/creator/CreatorAIDraftGenerator";
import type {
  CreatorResourceFormCategory,
  CreatorResourceFormValues,
} from "@/components/creator/CreatorResourceForm";

export type DashboardV2CreatorEditorData =
  | {
      state: "ready";
      mode: "new";
      title: string;
      description: string;
      categories: CreatorResourceFormCategory[];
    }
  | {
      state: "ready";
      mode: "edit";
      resourceId: string;
      title: string;
      description: string;
      categories: CreatorResourceFormCategory[];
      initialValues: CreatorResourceFormValues;
      initialAIDraft: CreatorAIDraftValues | null;
      focusField?: FieldName;
    }
  | {
      state: "locked";
      title: string;
      description: string;
      ctaHref: string;
      ctaLabel: string;
    }
  | {
      state: "not-found";
      title: string;
      description: string;
    }
  | {
      state: "forbidden";
      title: string;
      description: string;
    }
  | {
      state: "error";
      title: string;
      description: string;
    };

function normalizeFocusField(
  input: string | undefined,
): FieldName | undefined {
  const VALID_FOCUS_FIELDS = ["title", "description", "price", "file"] as const;
  return VALID_FOCUS_FIELDS.includes(input as FieldName)
    ? (input as FieldName)
    : undefined;
}

export async function getDashboardV2CreatorEditorData(input: {
  userId: string;
  mode: "new" | "edit";
  resourceId?: string;
  focus?: string;
}): Promise<DashboardV2CreatorEditorData> {
  try {
    const access = await getCreatorAccessState(input.userId);

    if (!canAccessCreatorWorkspace(access)) {
      return {
        state: "locked",
        title: "Creator access is not active",
        description:
          "Apply for creator access before creating or editing storefront resources.",
        ctaHref: routes.dashboardV2CreatorApply,
        ctaLabel: "Apply for creator access",
      };
    }

    if (input.mode === "new") {
      const formData = await getCreatorResourceFormDataForWorkspace(input.userId);

      return {
        state: "ready",
        mode: "new",
        title: "New resource",
        description:
          "Create a new listing with real category options inside the protected creator workspace.",
        categories: formData.categories,
      };
    }

    if (!input.resourceId) {
      return {
        state: "error",
        title: "Could not load creator editor",
        description:
          "The resource editor route is missing its resource identifier.",
      };
    }

    const [resource, formData, resourceTarget] = await Promise.all([
      getCreatorResourceForEditForWorkspace(input.userId, input.resourceId),
      getCreatorResourceFormDataForWorkspace(input.userId),
      findResourcePublicCacheTargetById(input.resourceId),
    ]);

    if (!resource) {
      if (!resourceTarget || resourceTarget.deletedAt) {
        return {
          state: "not-found",
          title: "Resource not found",
          description:
            "This resource could not be found in your creator workspace. It may have been removed or the link is outdated.",
        };
      }

      if (resourceTarget.authorId !== input.userId) {
        return {
          state: "forbidden",
          title: "You cannot edit this resource",
          description:
            "This resource is not owned by the current creator account, so the editor is not available in this workspace.",
        };
      }

      return {
        state: "error",
        title: "Could not load creator editor",
        description:
          "Refresh this route to retry. The resource editor stays protected behind the dashboard-v2 creator gate.",
      };
    }

    return {
      state: "ready",
      mode: "edit",
      resourceId: resource.id,
      title: resource.title,
      description:
        "Update listing details, files, pricing, and publish status without leaving your workspace.",
      categories: formData.categories,
      initialAIDraft: resource.aiDraft
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
        : null,
      initialValues: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        slug: resource.slug,
        type: resource.type as "PDF" | "DOCUMENT",
        status: resource.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
        isFree: resource.isFree || resource.price === 0,
        price:
          resource.isFree || resource.price === 0 ? "" : String(resource.price / 100),
        categoryId: resource.categoryId ?? "",
        fileUrl: resource.fileUrl ?? "",
        fileKey: resource.fileKey ?? "",
        fileName: resource.fileName ?? "",
        fileSize: resource.fileSize ?? null,
        previewUrls: resource.previewUrls,
      },
      focusField: normalizeFocusField(input.focus),
    };
  } catch {
    return {
      state: "error",
      title: "Could not load creator editor",
      description:
        "Refresh this route to retry. The resource editor stays protected behind the dashboard-v2 creator gate.",
    };
  }
}
