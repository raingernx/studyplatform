import Link from "next/link";
import { ArrowRight, FileEdit } from "lucide-react";
import { routes } from "@/lib/routes";
import { formatRelativeDate } from "@/lib/format";
import type { CreatorDraft } from "@/services/creator";

interface CreatorDraftBannerProps {
  draft: CreatorDraft;
  /** Total number of draft resources, including the most recent one. */
  totalDrafts: number;
}

type FocusField = "title" | "description" | "price" | "file";

/**
 * Returns the first required field that is missing from the draft,
 * in priority order: title → description → price → file.
 * Returns null when all required fields are present.
 */
function deriveFocusField(draft: CreatorDraft): FocusField | null {
  if (draft.title.trim().length < 3) return "title";
  if (draft.description.trim().length < 10) return "description";
  if (!draft.isFree && (!draft.price || draft.price <= 0)) return "price";
  if (!draft.fileUrl) return "file";
  return null;
}

export function CreatorDraftBanner({ draft, totalDrafts }: CreatorDraftBannerProps) {
  const extraDrafts = totalDrafts - 1;
  const focusField = deriveFocusField(draft);
  const continueHref = focusField
    ? `${routes.dashboardV2CreatorResource(draft.id)}?focus=${focusField}`
    : routes.dashboardV2CreatorResource(draft.id);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <FileEdit className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            You have an unfinished draft
          </p>
          <p className="mt-0.5 truncate text-sm text-amber-700">
            <span className="font-medium">{draft.title}</span>
            {" · "}
            <span className="text-amber-600">
              updated {formatRelativeDate(draft.updatedAt)}
            </span>
          </p>
          {extraDrafts > 0 && (
            <p className="mt-0.5 text-xs text-amber-600">
              +{extraDrafts} more draft{extraDrafts > 1 ? "s" : ""} in your{" "}
              <Link
                href={routes.dashboardV2CreatorResources}
                className="font-medium underline underline-offset-2 hover:text-amber-800"
              >
                resource manager
              </Link>
            </p>
          )}
        </div>
      </div>

      <Link
        href={continueHref}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Continue editing
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
