interface DetailsCardProps {
  resourceId: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
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
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-tight text-zinc-500">
        Details
      </h3>
      <dl className="space-y-3 text-xs">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4"
          >
            <dt className="shrink-0 text-zinc-500">{label}</dt>
            <dd className="min-w-0 truncate text-right font-medium text-zinc-900">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
