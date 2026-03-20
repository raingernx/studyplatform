import type { ResourceStatus } from "@prisma/client";

type Status = ResourceStatus | (string & {});

export type StatusBadgeTone = "success" | "warning" | "danger" | "muted";

interface StatusBadgeProps {
  status: Status;
  /** Override the display label (useful for non-resource statuses). */
  label?: string;
  /** Override the colour tone (useful for non-resource statuses). */
  tone?: StatusBadgeTone;
}

const TONE_CLASSES: Record<StatusBadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-danger-50 text-danger-600",
  muted:   "bg-surface-100 text-text-secondary",
};

const STATUS_LABELS: Record<ResourceStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const STATUS_TONES: Record<ResourceStatus, StatusBadgeTone> = {
  DRAFT: "muted",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

export function StatusBadge({ status, label, tone }: StatusBadgeProps) {
  const key = status as ResourceStatus;
  const resolvedLabel = label ?? STATUS_LABELS[key] ?? status;
  const resolvedTone: StatusBadgeTone = tone ?? STATUS_TONES[key] ?? "muted";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        TONE_CLASSES[resolvedTone],
      ].join(" ")}
    >
      {resolvedLabel}
    </span>
  );
}
