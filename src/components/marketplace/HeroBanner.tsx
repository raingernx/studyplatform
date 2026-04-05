import { HeroSurface, HeroSurfaceSkeleton } from "@/components/marketplace/HeroSurface";
import { cn } from "@/lib/utils";

/**
 * Hero section for the discover page. The redesigned banner is now a fixed
 * repo-owned surface rather than a data-driven marketing slot.
 */
export function HeroBanner({
  className,
}: {
  className?: string;
}) {
  return <HeroSurface className={className} />;
}

export function HeroBannerFallback({
  className,
}: {
  className?: string;
}) {
  return <HeroSurfaceSkeleton className={cn("w-full", className)} />;
}
