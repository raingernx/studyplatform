import type { ReactNode } from "react";

import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-h2 font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-small leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}

interface DashboardPageHeaderSkeletonProps {
  titleWidth: string;
  descriptionWidth?: string;
  eyebrowWidth?: string | null;
  actionWidth?: string;
  className?: string;
}

export function DashboardPageHeaderSkeleton({
  titleWidth,
  descriptionWidth = "w-[32rem]",
  eyebrowWidth = null,
  actionWidth,
  className,
}: DashboardPageHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrowWidth ? <LoadingSkeleton className={`h-3 ${eyebrowWidth}`} /> : null}
        <LoadingSkeleton className={`h-10 rounded-2xl ${titleWidth}`} />
        <LoadingSkeleton className={`h-4 max-w-full ${descriptionWidth}`} />
      </div>
      {actionWidth ? <LoadingSkeleton className={`h-10 ${actionWidth} rounded-xl`} /> : null}
    </div>
  );
}
