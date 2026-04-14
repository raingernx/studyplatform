"use client";

import { Save, Rocket, X, Eye } from "lucide-react";
import { Button } from "@/design-system";

interface CreatorPublishActionsProps {
  /** True when required fields (title + description) are filled. */
  canPublish: boolean;
  saving: boolean;
  error: string | null;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
  /** When provided, renders a "Preview as buyer" button before Publish. */
  onPreview?: () => void;
}

export function CreatorPublishActions({
  canPublish,
  saving,
  error,
  onSaveDraft,
  onPublish,
  onCancel,
  onPreview,
}: CreatorPublishActionsProps) {
  return (
    <section
      aria-label="Resource publishing actions"
      className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="text-sm text-danger-700">{error}</p>
          ) : !canPublish ? (
            <p className="text-xs text-muted-foreground">
              Fill in a title and description to enable publishing.
            </p>
          ) : (
            <p className="text-xs text-success-600">
              Ready to publish — all required fields are complete.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            onClick={onCancel}
            disabled={saving}
            variant="ghost"
            size="sm"
            leftIcon={<X className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Cancel</span>
          </Button>

          <Button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            variant="outline"
            size="sm"
            leftIcon={<Save className="h-4 w-4" />}
          >
            {saving ? "Saving..." : "Save draft"}
          </Button>

          {onPreview && (
            <Button
              type="button"
              onClick={onPreview}
              disabled={saving}
              variant="outline"
              size="sm"
              leftIcon={<Eye className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Preview as buyer</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={onPublish}
            disabled={saving || !canPublish}
            title={
              !canPublish
                ? "Add a title and description before publishing"
                : "Publish this resource to the marketplace"
            }
            size="sm"
            leftIcon={<Rocket className="h-4 w-4" />}
          >
            {saving ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </section>
  );
}
