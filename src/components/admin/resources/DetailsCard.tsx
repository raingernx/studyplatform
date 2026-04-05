import { formatDate } from "@/lib/format";

interface DetailsCardProps {
  resourceId: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export function DetailsCard({
  resourceId,
  slug,
  createdAt,
  updatedAt,
}: DetailsCardProps) {
  const rows = [
    { label: "Resource ID", value: resourceId },
    { label: "Slug", value: slug },
    { label: "Created Date", value: formatDate(createdAt) },
    { label: "Updated Date", value: formatDate(updatedAt) },
  ] as const;

  return (
    <div className="w-full rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-ui text-caption text-muted-foreground">
        Details
      </h3>
      <dl className="space-y-3 text-small">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4"
          >
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="min-w-0 truncate text-right font-medium text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
