"use client";

import { Save, Rocket, X, Eye } from "lucide-react";

interface CreatorStickyActionBarProps {
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

export function CreatorStickyActionBar({
  canPublish,
  saving,
  error,
  onSaveDraft,
  onPublish,
  onCancel,
  onPreview,
}: CreatorStickyActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
        {/* Left — error or hint */}
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="truncate text-sm text-red-600">{error}</p>
          ) : !canPublish ? (
            <p className="hidden text-xs text-muted-foreground sm:block">
              Fill in a title and description to enable publishing.
            </p>
          ) : (
            <p className="hidden text-xs text-emerald-600 sm:block">
              Ready to publish — all required fields are complete.
            </p>
          )}
        </div>

        {/* Right — actions */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save draft"}
          </button>

          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview as buyer</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPublish}
            disabled={saving || !canPublish}
            title={
              !canPublish
                ? "Add a title and description before publishing"
                : "Publish this resource to the marketplace"
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          >
            <Rocket className="h-4 w-4" />
            {saving ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
