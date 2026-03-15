import type { ResourceStatus } from "@prisma/client";

type Status = ResourceStatus | (string & {});

interface StatusBadgeProps {
  status: Status;
}

const STATUS_LABELS: Record<ResourceStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const STATUS_CLASSES: Record<ResourceStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  ARCHIVED: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = (status as ResourceStatus) ?? "DRAFT";
  const label = STATUS_LABELS[key] ?? status;
  const classes =
    STATUS_CLASSES[key] ?? "bg-zinc-100 text-zinc-600";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        classes,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

