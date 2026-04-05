/**
 * Admin Stats Card. StudyDock Stat Card — multiple metrics.
 * Style: rounded-xl, border-border, bg-card, p-5.
 * Layout per metric: label, then value (e.g. Downloads / 1,240).
 */
import { formatNumber } from "@/lib/format";

interface StatsCardProps {
  downloads: number;
  purchases: number;
  reviews: number;
}

export function StatsCard({ downloads, purchases, reviews }: StatsCardProps) {
  const metrics = [
    { label: "Downloads", value: downloads },
    { label: "Purchases", value: purchases },
    { label: "Reviews", value: reviews },
  ] as const;

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-ui text-caption text-muted-foreground">
        Stats
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <p className="text-small text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-lg font-semibold tabular-nums text-foreground">
              {formatNumber(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
