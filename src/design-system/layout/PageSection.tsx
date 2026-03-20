import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <section className={cn("py-6 md:py-8 lg:py-12", className)}>
      {children}
    </section>
  );
}
