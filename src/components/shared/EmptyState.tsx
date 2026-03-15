import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Shared empty state: icon, title, description, optional CTA. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-24 text-center",
        className
      )}
    >
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-base font-semibold text-zinc-500">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
