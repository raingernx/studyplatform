import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
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
        className,
      )}
    >
      <div className={cn("flex flex-col gap-2", alignClass)}>
        {eyebrow ? (
          <p className="font-ui text-caption tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-heading text-h2 font-semibold text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-xl text-small text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="mt-3 sm:mt-0">{actions}</div> : null}
    </div>
  );
}
