import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * StudyDock base card. Use for all card types across the platform.
 * Padding: use p-4 (small), p-5 (standard), or p-6 (large) on content — never mix randomly.
 *
 * Style: rounded-2xl, border zinc-200, white bg, shadow-sm.
 * Hover: shadow-md, subtle lift.
 *
 * Before shipping UI using cards, verify:
 * - Image ratio consistent (aspect-[4/3])
 * - Padding consistent (p-4 | p-5 | p-6)
 * - Tags aligned (2 visible + overflow)
 * - Title line-clamp-2, min-w-0
 * - CTA aligned (full width where applicable)
 * - Grid spacing correct (gap-6, sm:2 lg:3 xl:4 for marketplace)
 */
interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-sm",
        "transition-all hover:shadow-md hover:-translate-y-[2px]",
        className
      )}
    >
      {children}
    </div>
  );
}
