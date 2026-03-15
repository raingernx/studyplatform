import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
}

/** Generic loading skeleton bar. */
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("rounded bg-neutral-200 animate-pulse", className)}
      aria-hidden
    />
  );
}
