import { notFound } from "next/navigation";
import { HeroForm, type HeroFormValues } from "@/components/admin/heroes/HeroForm";
import { normalizeHeroStyle } from "@/lib/heroes/hero-style";
import { getHeroById } from "@/services/heroes/hero.service";
import { routes } from "@/lib/routes";
import { requireAdminSession } from "@/lib/auth/require-admin-session";

type Props = {
  params: Promise<{ id: string }>;
};

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toFormValues(hero: NonNullable<Awaited<ReturnType<typeof getHeroById>>>): HeroFormValues {
  const style = normalizeHeroStyle(hero);

  return {
    name: hero.name,
    type: hero.type as HeroFormValues["type"],
    title: hero.title,
    subtitle: hero.subtitle ?? "",
    badgeText: hero.badgeText ?? "",
    primaryCtaText: hero.primaryCtaText ?? "",
    primaryCtaLink: hero.primaryCtaLink ?? "",
    secondaryCtaText: hero.secondaryCtaText ?? "",
    secondaryCtaLink: hero.secondaryCtaLink ?? "",
    imageUrl: hero.imageUrl ?? "",
    mediaUrl: hero.mediaUrl ?? "",
    mediaType: (hero.mediaType as HeroFormValues["mediaType"]) ?? "",
    textAlign: style.textAlign,
    contentWidth: style.contentWidth,
    heroHeight: style.heroHeight,
    spacingPreset: style.spacingPreset,
    headingFont: style.headingFont,
    bodyFont: style.bodyFont,
    titleSize: style.titleSize,
    subtitleSize: style.subtitleSize,
    titleWeight: style.titleWeight,
    subtitleWeight: style.subtitleWeight,
    mobileTitleSize: style.mobileTitleSize,
    mobileSubtitleSize: style.mobileSubtitleSize,
    titleColor: style.titleColor,
    subtitleColor: style.subtitleColor,
    badgeTextColor: style.badgeTextColor,
    badgeBgColor: style.badgeBgColor,
    primaryCtaVariant: style.primaryCtaVariant,
    secondaryCtaVariant: style.secondaryCtaVariant,
    primaryCtaColor: style.primaryCtaColor,
    secondaryCtaColor: style.secondaryCtaColor,
    overlayColor: style.overlayColor,
    overlayOpacity: style.overlayOpacity,
    priority: hero.priority,
    weight: hero.weight,
    experimentId: hero.experimentId ?? "",
    variant: hero.variant ?? "",
    abGroup: hero.abGroup ?? "",
    startDate: toDateTimeLocalValue(hero.startDate),
    endDate: toDateTimeLocalValue(hero.endDate),
    isActive: hero.isActive,
  };
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const hero = await getHeroById(id);

  return {
    title: hero
      ? `${hero.isFallback ? "Edit Fallback Hero" : `Edit "${hero.name}"`} – Admin`
      : "Edit Hero – Admin",
  };
}

export default async function EditHeroPage({ params }: Props) {
  const { id } = await params;
  await requireAdminSession(routes.adminHero(id));

  const hero = await getHeroById(id);

  if (!hero) {
    notFound();
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-h2 font-semibold tracking-tight text-text-primary">
            {hero.isFallback ? "Edit Fallback Hero" : "Edit Hero"}
          </h1>
          <p className="mt-1 text-meta text-text-secondary">
            {hero.isFallback
              ? "Update the protected homepage fallback hero from the Marketing → Heroes section."
              : "Update this campaign hero without affecting the protected fallback hero."}
          </p>
        </div>
      </div>

      <HeroForm
        mode="edit"
        heroId={hero.id}
        initialValues={toFormValues(hero)}
        isFallback={hero.isFallback}
      />
    </div>
  );
}
