import { HeroForm, type HeroFormValues } from "@/components/admin/heroes/HeroForm";
import { HERO_STYLE_DEFAULTS } from "@/lib/heroes/hero-style";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

export const metadata = {
  title: "Create Hero – Admin",
  description: "Create a new marketing hero campaign.",
};

const DEFAULT_VALUES: HeroFormValues = {
  name: "",
  type: "featured",
  title: "",
  subtitle: "",
  badgeText: "",
  primaryCtaText: "",
  primaryCtaLink: "",
  secondaryCtaText: "",
  secondaryCtaLink: "",
  imageUrl: "",
  mediaUrl: "",
  mediaType: "",
  textAlign: HERO_STYLE_DEFAULTS.textAlign,
  contentWidth: HERO_STYLE_DEFAULTS.contentWidth,
  heroHeight: HERO_STYLE_DEFAULTS.heroHeight,
  spacingPreset: HERO_STYLE_DEFAULTS.spacingPreset,
  headingFont: HERO_STYLE_DEFAULTS.headingFont,
  bodyFont: HERO_STYLE_DEFAULTS.bodyFont,
  titleSize: HERO_STYLE_DEFAULTS.titleSize,
  subtitleSize: HERO_STYLE_DEFAULTS.subtitleSize,
  titleWeight: HERO_STYLE_DEFAULTS.titleWeight,
  subtitleWeight: HERO_STYLE_DEFAULTS.subtitleWeight,
  mobileTitleSize: HERO_STYLE_DEFAULTS.mobileTitleSize,
  mobileSubtitleSize: HERO_STYLE_DEFAULTS.mobileSubtitleSize,
  titleColor: HERO_STYLE_DEFAULTS.titleColor,
  subtitleColor: HERO_STYLE_DEFAULTS.subtitleColor,
  badgeTextColor: HERO_STYLE_DEFAULTS.badgeTextColor,
  badgeBgColor: HERO_STYLE_DEFAULTS.badgeBgColor,
  primaryCtaVariant: HERO_STYLE_DEFAULTS.primaryCtaVariant,
  secondaryCtaVariant: HERO_STYLE_DEFAULTS.secondaryCtaVariant,
  primaryCtaColor: HERO_STYLE_DEFAULTS.primaryCtaColor,
  secondaryCtaColor: HERO_STYLE_DEFAULTS.secondaryCtaColor,
  overlayColor: HERO_STYLE_DEFAULTS.overlayColor,
  overlayOpacity: HERO_STYLE_DEFAULTS.overlayOpacity,
  priority: 0,
  weight: 1,
  experimentId: "",
  variant: "",
  abGroup: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

export default async function NewHeroPage() {
  await requireAdminSession(routes.adminNewHero);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            Create Hero
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            Create a campaign hero that can override the protected fallback hero on the homepage.
          </p>
        </div>
      </div>

      <HeroForm mode="create" initialValues={DEFAULT_VALUES} />
    </div>
  );
}
