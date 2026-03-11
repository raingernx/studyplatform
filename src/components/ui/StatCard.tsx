import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * StudyDock Stat Card. Used in dashboard and admin panels.
 * Style: rounded-xl, border-zinc-200, bg-white, p-5.
 * Layout: metric label, then metric value (e.g. "Downloads" / "1,240").
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-zinc-200 bg-white p-5",
        className
      )}
    >
      {icon && <div className="mb-2 flex justify-start">{icon}</div>}
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums text-zinc-900">
        {displayValue}
      </p>
    </div>
  );
}
