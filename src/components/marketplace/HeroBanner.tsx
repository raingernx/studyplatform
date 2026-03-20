import { HeroImpressionTracker } from "@/components/marketplace/HeroImpressionTracker";
import { HeroTrackedLink } from "@/components/marketplace/HeroTrackedLink";
import {
  HeroSurface,
  type HeroSurfaceConfig,
} from "@/components/marketplace/HeroSurface";

export type HomepageHeroConfig = HeroSurfaceConfig | null;

/**
 * Hero section for the discover page. Uses config from DB when provided, else defaults.
 */
export function HeroBanner({ config }: { config?: HomepageHeroConfig }) {
  const hero = config ?? null;
  const heroId = hero?.heroId ?? null;
  const experimentId = hero?.experimentId ?? null;
  const variant = hero?.variant ?? null;

  return (
    <>
      <HeroImpressionTracker
        heroId={heroId}
        experimentId={experimentId}
        variant={variant}
      />
      <HeroSurface
        config={hero}
        renderPrimaryCta={({ href, label, className }) => (
          <HeroTrackedLink
            heroId={heroId}
            experimentId={experimentId}
            variant={variant}
            href={href}
            className={className}
          >
            {label}
          </HeroTrackedLink>
        )}
        renderSecondaryCta={({ href, label, className }) => (
          <HeroTrackedLink
            heroId={heroId}
            experimentId={experimentId}
            variant={variant}
            href={href}
            className={className}
          >
            {label}
          </HeroTrackedLink>
        )}
      />
    </>
  );
}
