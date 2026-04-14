"use client";

import { CheckCircle2, ListChecks } from "lucide-react";

export type FieldName = "title" | "description" | "price" | "file";

const FIELD_LABELS: Record<FieldName, string> = {
  title: "Add title",
  description: "Add description",
  price: "Set price",
  file: "Upload file",
};

type CreatorPublishReadinessProps = {
  missingFields: FieldName[];
  completion: number;
  onJumpToField?: (field: FieldName) => void;
  /**
   * When true, renders a visually quieter variant suited for edit mode —
   * neutral colours instead of amber, smaller ready-state text.
   */
  subtle?: boolean;
};

export function CreatorPublishReadiness({
  missingFields,
  completion,
  onJumpToField,
  subtle = false,
}: CreatorPublishReadinessProps) {
  const isReady = missingFields.length === 0;

  if (isReady) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
          subtle
            ? "border border-border bg-muted"
            : "border border-success-500/25 bg-accent"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            subtle ? "bg-background text-success-600" : "bg-card text-success-600"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p
            className={`font-semibold ${subtle ? "text-xs text-muted-foreground" : "text-sm text-foreground"}`}
          >
            Ready to publish
          </p>
          <p className="text-xs text-muted-foreground">
            Your resource is complete and can be published
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        subtle ? "border-border bg-muted" : "border-warning-500/25 bg-accent"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            subtle ? "bg-background text-muted-foreground" : "bg-card text-warning-600"
          }`}
        >
          <ListChecks className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Finish your resource ({completion}/4 complete)
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Complete the missing steps before publishing.
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-11">
        {missingFields.map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => onJumpToField?.(field)}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              subtle
                ? "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-warning-500/40 hover:bg-muted hover:text-foreground"
            }`}
          >
            {FIELD_LABELS[field]}
          </button>
        ))}
      </div>
    </div>
  );
}
