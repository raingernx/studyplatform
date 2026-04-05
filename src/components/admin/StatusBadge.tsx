import type { ResourceStatus } from "@prisma/client";

type Status = ResourceStatus | (string & {});

export type StatusBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "info"
  | "accent";

interface StatusBadgeProps {
  status: Status;
  /** Override the display label (useful for non-resource statuses). */
  label?: string;
  /** Override the colour tone (useful for non-resource statuses). */
  tone?: StatusBadgeTone;
  className?: string;
}

const TONE_CLASSES: Record<StatusBadgeTone, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  muted: "bg-muted text-muted-foreground",
  info: "bg-info-50 text-info-700",
  accent: "bg-primary-50 text-primary-700",
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

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: StatusBadgeProps) {
  const key = status as ResourceStatus;
  const resolvedLabel = label ?? STATUS_LABELS[key] ?? status;
  const resolvedTone: StatusBadgeTone = tone ?? STATUS_TONES[key] ?? "muted";

  return (
    <span
      className={[
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 font-medium",
        "font-ui text-caption",
        TONE_CLASSES[resolvedTone],
        className,
      ].join(" ")}
    >
      {resolvedLabel}
    </span>
  );
}
