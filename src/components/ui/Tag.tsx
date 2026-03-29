import type { ReactNode } from "react";
import { Badge } from "@/design-system";
import { cn } from "@/lib/utils";

/** Legacy compatibility entrypoint. Prefer Badge from "@/design-system". */
interface TagProps {
  children: ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <Badge
      variant="neutral"
      className={cn("bg-neutral-100 text-neutral-700", className)}
    >
      {children}
    </Badge>
  );
}
