import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * StudyDock Simple Card. Generic container for forms, panels, settings.
 * Style: rounded-xl, border-zinc-200, bg-white, p-6.
 * No hover effects — use for static content.
 */
interface SimpleCardProps {
  children: ReactNode;
  className?: string;
}

export function SimpleCard({ children, className }: SimpleCardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-zinc-200 bg-white p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
