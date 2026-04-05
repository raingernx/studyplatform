import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function LoadingSkeleton({ className, style }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-muted motion-reduce:animate-none",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}
