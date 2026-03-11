import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** PaperDock Design System: tags are lowercase, bg-neutral-100 text-neutral-700, max 2 visible in cards. */
interface TagProps {
  children: ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5",
        "text-xs font-medium text-neutral-700",
        className
      )}
    >
      {children}
    </span>
  );
}

