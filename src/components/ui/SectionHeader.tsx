import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
  className,
}: SectionHeaderProps) {
  const alignClass =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("flex flex-col gap-2", alignClass)}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            {eyebrow}
          </p>
        )}
        <h2 className="text-3xl font-semibold tracking-tight text-text-primary">
          {title}
        </h2>
        {description && (
          <p className="max-w-xl text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}

