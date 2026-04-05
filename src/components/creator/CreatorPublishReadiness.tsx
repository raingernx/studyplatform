"use client";

import { CheckCircle2 } from "lucide-react";

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
            ? "border border-emerald-100 bg-emerald-50/50"
            : "border border-emerald-100 bg-emerald-50"
        }`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <p
            className={`font-semibold text-emerald-800 ${subtle ? "text-xs" : "text-sm"}`}
          >
            Ready to publish
          </p>
          <p className="text-xs text-emerald-600">
            Your resource is complete and can be published
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 ${
        subtle
          ? "border border-border bg-muted"
          : "border border-amber-100 bg-amber-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          subtle ? "text-muted-foreground" : "text-amber-800"
        }`}
      >
        Finish your resource ({completion}/4 complete)
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {missingFields.map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => onJumpToField?.(field)}
            className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              subtle
                ? "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                : "border-amber-200 bg-background text-amber-800 hover:border-amber-300 hover:bg-amber-100"
            }`}
          >
            {FIELD_LABELS[field]}
          </button>
        ))}
      </div>
    </div>
  );
}
