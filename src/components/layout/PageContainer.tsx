import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Standard page wrapper: max-w-7xl mx-auto px-6 py-8 */
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-6 py-8", className)}>
      {children}
    </div>
  );
}
