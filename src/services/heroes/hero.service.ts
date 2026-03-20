import {
  countEligibleHomepageHeroes,
  createHeroClick,
  createHeroImpression,
  createHeroRecord,
  deleteHeroRecord,
  findActiveHero,
  findFallbackHero,
  findHeroById,
  findLegacyHomepageHero,
  incrementHeroClick,
  incrementHeroImpression,
  listHeroVariantAnalytics,
  type HeroListFilter,
  listHeroes,
  updateHeroRecord,
} from "@/repositories/heroes/hero.repository";
import { revalidateTag } from "next/cache";
import { deleteCachedKey } from "@/lib/cache";
import { HERO_CACHE_TAG } from "@/lib/cache/heroCache";
import { resolveHomepageHero, type ResolvedHomepageHeroConfig } from "@/services/heroes/hero.resolver";
import {
  normalizeHeroOverlayOpacity,
  normalizeHeroStyle,
  type HeroBadgeBgColor,
  type HeroBadgeTextColor,
  type HeroBodyFont,
  type HeroContentWidth,
  type HeroHeadingFont,
  type HeroHeight,
  type HeroMobileSubtitleSize,
  type HeroMobileTitleSize,
  type HeroOverlayColor,
  type HeroPrimaryCtaColor,
  type HeroPrimaryCtaVariant,
  type HeroSecondaryCtaColor,
  type HeroSecondaryCtaVariant,
  type HeroSpacingPreset,
  type HeroStyleFields,
  type HeroSubtitleColor,
  type HeroSubtitleSize,
  type HeroSubtitleWeight,
  type HeroTextAlign,
  type HeroTitleColor,
  type HeroTitleSize,
  type HeroTitleWeight,
} from "@/lib/heroes/hero-style";

export type ActiveHeroConfig = ResolvedHomepageHeroConfig;

export interface HeroListItem {
  id: string;
  name: string;
  type: string;
  isFallback: boolean;
  priority: number;
  weight: number;
  experimentId: string | null;
  variant: string | null;
  abGroup: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  impressions: number;
  clicks: number;
  ctr: number;
  variantAnalytics: HeroVariantAnalytics[];
  createdAt: Date;
}

export interface HeroRecord {
  id: string;
  name: string;
  type: string;
  isFallback: boolean;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  imageUrl: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  textAlign: string | null;
  contentWidth: string | null;
  heroHeight: string | null;
  spacingPreset: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  titleSize: string | null;
  subtitleSize: string | null;
  titleWeight: string | null;
  subtitleWeight: string | null;
  mobileTitleSize: string | null;
  mobileSubtitleSize: string | null;
  titleColor: string | null;
  subtitleColor: string | null;
  badgeTextColor: string | null;
  badgeBgColor: string | null;
  primaryCtaVariant: string | null;
  secondaryCtaVariant: string | null;
  primaryCtaColor: string | null;
  secondaryCtaColor: string | null;
  overlayColor: string | null;
  overlayOpacity: number | null;
  priority: number;
  weight: number;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  experimentId: string | null;
  variant: string | null;
  abGroup: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeroAnalyticsEventInput {
  heroId: string;
  experimentId?: string | null;
  variant?: string | null;
}

export interface HeroVariantAnalytics {
  experimentId: string | null;
  variant: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface HeroMutationInput extends HeroStyleFields {
  name?: string;
  type?: string;
  title?: string;
  subtitle?: string | null;
  badgeText?: string | null;
  primaryCtaText?: string | null;
  primaryCtaLink?: string | null;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
  imageUrl?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  priority?: number;
  weight?: number;
  isActive?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  experimentId?: string | null;
  variant?: string | null;
  abGroup?: string | null;
  isFallback?: boolean;
}

export class HeroServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Hero service error");
    this.status = status;
    this.payload = payload;
  }
}

function trimRequired(value: string | null | undefined, field: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        [field]: `${field} is required.`,
      },
    });
  }

  return trimmed;
}

function trimOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalStyle<T extends string>(
  value: string | null | undefined,
): T | null {
  return trimOptional(value) as T | null;
}

function validateExperimentFields(
  experimentId: string | null | undefined,
  variant: string | null | undefined,
) {
  const normalizedExperimentId = trimOptional(experimentId);
  const normalizedVariant = trimOptional(variant);

  if ((normalizedExperimentId && !normalizedVariant) || (!normalizedExperimentId && normalizedVariant)) {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        experimentId: "Experiment ID and variant must be provided together.",
        variant: "Experiment ID and variant must be provided together.",
      },
    });
  }

  return {
    experimentId: normalizedExperimentId,
    variant: normalizedVariant,
  };
}

function toCtr(impressions: number, clicks: number) {
  if (impressions <= 0) {
    return 0;
  }

  return Number(((clicks / impressions) * 100).toFixed(2));
}

function normalizeDate(value: string | Date | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        date: "Invalid date value.",
      },
    });
  }

  return parsed;
}

export async function invalidateActiveHeroCache() {
  await deleteCachedKey("active-hero");
  revalidateTag(HERO_CACHE_TAG, "max");
}

function toHeroConfig(
  hero:
    | {
        experimentId?: string | null;
        variant?: string | null;
        title: string;
        subtitle?: string | null;
        primaryCtaText?: string | null;
        primaryCtaLink?: string | null;
        secondaryCtaText?: string | null;
        secondaryCtaLink?: string | null;
        badgeText?: string | null;
        imageUrl?: string | null;
        mediaUrl?: string | null;
        mediaType?: string | null;
        textAlign?: string | null;
        contentWidth?: string | null;
        heroHeight?: string | null;
        spacingPreset?: string | null;
        headingFont?: string | null;
        bodyFont?: string | null;
        titleSize?: string | null;
        subtitleSize?: string | null;
        titleWeight?: string | null;
        subtitleWeight?: string | null;
        mobileTitleSize?: string | null;
        mobileSubtitleSize?: string | null;
        titleColor?: string | null;
        subtitleColor?: string | null;
        badgeTextColor?: string | null;
        badgeBgColor?: string | null;
        primaryCtaVariant?: string | null;
        secondaryCtaVariant?: string | null;
        primaryCtaColor?: string | null;
        secondaryCtaColor?: string | null;
        overlayColor?: string | null;
        overlayOpacity?: number | null;
      }
    | null,
): ActiveHeroConfig | null {
  if (!hero) {
    return null;
  }

  return {
    title: hero.title,
    subtitle: hero.subtitle ?? "",
    primaryCtaText: hero.primaryCtaText ?? "",
    primaryCtaLink: hero.primaryCtaLink ?? "",
    experimentId: hero.experimentId ?? null,
    variant: hero.variant ?? null,
    secondaryCtaText: hero.secondaryCtaText ?? null,
    secondaryCtaLink: hero.secondaryCtaLink ?? null,
    badgeText: hero.badgeText ?? null,
    imageUrl: hero.imageUrl ?? null,
    mediaUrl: hero.mediaUrl ?? null,
    mediaType: hero.mediaType ?? null,
    textAlign: normalizeOptionalStyle<HeroTextAlign>(hero.textAlign),
    contentWidth: normalizeOptionalStyle<HeroContentWidth>(hero.contentWidth),
    heroHeight: normalizeOptionalStyle<HeroHeight>(hero.heroHeight),
    spacingPreset: normalizeOptionalStyle<HeroSpacingPreset>(hero.spacingPreset),
    headingFont: normalizeOptionalStyle<HeroHeadingFont>(hero.headingFont),
    bodyFont: normalizeOptionalStyle<HeroBodyFont>(hero.bodyFont),
    titleSize: normalizeOptionalStyle<HeroTitleSize>(hero.titleSize),
    subtitleSize: normalizeOptionalStyle<HeroSubtitleSize>(hero.subtitleSize),
    titleWeight: normalizeOptionalStyle<HeroTitleWeight>(hero.titleWeight),
    subtitleWeight: normalizeOptionalStyle<HeroSubtitleWeight>(hero.subtitleWeight),
    mobileTitleSize: normalizeOptionalStyle<HeroMobileTitleSize>(hero.mobileTitleSize),
    mobileSubtitleSize:
      normalizeOptionalStyle<HeroMobileSubtitleSize>(hero.mobileSubtitleSize),
    titleColor: normalizeOptionalStyle<HeroTitleColor>(hero.titleColor),
    subtitleColor: normalizeOptionalStyle<HeroSubtitleColor>(hero.subtitleColor),
    badgeTextColor:
      normalizeOptionalStyle<HeroBadgeTextColor>(hero.badgeTextColor),
    badgeBgColor: normalizeOptionalStyle<HeroBadgeBgColor>(hero.badgeBgColor),
    primaryCtaVariant:
      normalizeOptionalStyle<HeroPrimaryCtaVariant>(hero.primaryCtaVariant),
    secondaryCtaVariant:
      normalizeOptionalStyle<HeroSecondaryCtaVariant>(hero.secondaryCtaVariant),
    primaryCtaColor:
      normalizeOptionalStyle<HeroPrimaryCtaColor>(hero.primaryCtaColor),
    secondaryCtaColor:
      normalizeOptionalStyle<HeroSecondaryCtaColor>(hero.secondaryCtaColor),
    overlayColor: normalizeOptionalStyle<HeroOverlayColor>(hero.overlayColor),
    overlayOpacity: hero.overlayOpacity ?? null,
  };
}

export async function getActiveHero(now = new Date()) {
  if (arguments.length > 0) {
    const activeHero = await findActiveHero(now);
    if (activeHero) {
      return toHeroConfig(activeHero);
    }

    const fallbackHero = await findFallbackHero();
    if (fallbackHero) {
      return toHeroConfig(fallbackHero);
    }

    const legacyFallbackHero = await findLegacyHomepageHero();
    return toHeroConfig(legacyFallbackHero);
  }

  return resolveHomepageHero();
}

export async function getHeroList(
  filter: HeroListFilter = "all",
): Promise<HeroListItem[]> {
  const heroes = await listHeroes(filter);
  const variantAnalytics = await listHeroVariantAnalytics(heroes.map((hero) => hero.id));
  const variantMap = new Map<string, HeroVariantAnalytics[]>();

  for (const row of variantAnalytics) {
    const list = variantMap.get(row.heroId);
    const item = {
      experimentId: row.experimentId,
      variant: row.variant,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: toCtr(row.impressions, row.clicks),
    };

    if (list) {
      list.push(item);
    } else {
      variantMap.set(row.heroId, [item]);
    }
  }

  return heroes.map((hero) => ({
    id: hero.id,
    name: hero.name,
    type: hero.type,
    isFallback: hero.isFallback,
    priority: hero.priority,
    weight: hero.weight,
    experimentId: hero.experimentId,
    variant: hero.variant,
    abGroup: hero.abGroup,
    isActive: hero.isActive,
    startDate: hero.startDate,
    endDate: hero.endDate,
    impressions: hero.impressions,
    clicks: hero.clicks,
    ctr: toCtr(hero.impressions, hero.clicks),
    variantAnalytics: variantMap.get(hero.id) ?? [],
    createdAt: hero.createdAt,
  }));
}

function mapHeroRecord(hero: Awaited<ReturnType<typeof findHeroById>>): HeroRecord | null {
  if (!hero) {
    return null;
  }

  return {
    id: hero.id,
    name: hero.name,
    type: hero.type,
    isFallback: hero.isFallback,
    title: hero.title,
    subtitle: hero.subtitle,
    badgeText: hero.badgeText,
    primaryCtaText: hero.primaryCtaText,
    primaryCtaLink: hero.primaryCtaLink,
    secondaryCtaText: hero.secondaryCtaText,
    secondaryCtaLink: hero.secondaryCtaLink,
    imageUrl: hero.imageUrl,
    mediaUrl: hero.mediaUrl,
    mediaType: hero.mediaType,
    textAlign: hero.textAlign,
    contentWidth: hero.contentWidth,
    heroHeight: hero.heroHeight,
    spacingPreset: hero.spacingPreset,
    headingFont: hero.headingFont,
    bodyFont: hero.bodyFont,
    titleSize: hero.titleSize,
    subtitleSize: hero.subtitleSize,
    titleWeight: hero.titleWeight,
    subtitleWeight: hero.subtitleWeight,
    mobileTitleSize: hero.mobileTitleSize,
    mobileSubtitleSize: hero.mobileSubtitleSize,
    titleColor: hero.titleColor,
    subtitleColor: hero.subtitleColor,
    badgeTextColor: hero.badgeTextColor,
    badgeBgColor: hero.badgeBgColor,
    primaryCtaVariant: hero.primaryCtaVariant,
    secondaryCtaVariant: hero.secondaryCtaVariant,
    primaryCtaColor: hero.primaryCtaColor,
    secondaryCtaColor: hero.secondaryCtaColor,
    overlayColor: hero.overlayColor,
    overlayOpacity: hero.overlayOpacity,
    priority: hero.priority,
    weight: hero.weight,
    isActive: hero.isActive,
    startDate: hero.startDate,
    endDate: hero.endDate,
    experimentId: hero.experimentId,
    variant: hero.variant,
    abGroup: hero.abGroup,
    impressions: hero.impressions,
    clicks: hero.clicks,
    ctr: toCtr(hero.impressions, hero.clicks),
    createdAt: hero.createdAt,
    updatedAt: hero.updatedAt,
  };
}

export async function getHeroById(id: string) {
  return mapHeroRecord(await findHeroById(id));
}

export async function createHero(input: HeroMutationInput) {
  const type = trimRequired(input.type, "type");
  if (type === "fallback") {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        type: "Fallback heroes cannot be created from this form.",
      },
    });
  }

  const startDate = normalizeDate(input.startDate);
  const endDate = normalizeDate(input.endDate);
  const experiment = validateExperimentFields(input.experimentId, input.variant);
  const style = normalizeHeroStyle(input);

  if (startDate && endDate && endDate <= startDate) {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        endDate: "End date must be after start date.",
      },
    });
  }

  const hero = await createHeroRecord({
    name: trimRequired(input.name, "name"),
    type,
    title: trimRequired(input.title, "title"),
    subtitle: trimOptional(input.subtitle),
    badgeText: trimOptional(input.badgeText),
    primaryCtaText: trimRequired(input.primaryCtaText, "primaryCtaText"),
    primaryCtaLink: trimRequired(input.primaryCtaLink, "primaryCtaLink"),
    secondaryCtaText: trimOptional(input.secondaryCtaText),
    secondaryCtaLink: trimOptional(input.secondaryCtaLink),
    imageUrl: trimOptional(input.imageUrl),
    mediaUrl: trimOptional(input.mediaUrl),
    mediaType: trimOptional(input.mediaType),
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
    priority: input.priority ?? 0,
    weight: Math.max(1, input.weight ?? 1),
    isActive: input.isActive ?? true,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    experimentId: experiment.experimentId,
    variant: experiment.variant,
    abGroup: trimOptional(input.abGroup),
    isFallback: false,
  });

  await invalidateActiveHeroCache();

  return mapHeroRecord(hero);
}

export async function updateHero(id: string, input: HeroMutationInput) {
  const existing = await findHeroById(id);

  if (!existing) {
    throw new HeroServiceError(404, {
      error: "Hero not found.",
    });
  }

  const normalizedStartDate = normalizeDate(input.startDate);
  const normalizedEndDate = normalizeDate(input.endDate);
  const nextType =
    input.type !== undefined ? trimRequired(input.type, "type") : existing.type;
  const nextExperiment = validateExperimentFields(
    input.experimentId !== undefined ? input.experimentId : existing.experimentId,
    input.variant !== undefined ? input.variant : existing.variant,
  );
  const nextStyle = normalizeHeroStyle({
    textAlign:
      input.textAlign !== undefined ? input.textAlign : existing.textAlign,
    contentWidth:
      input.contentWidth !== undefined
        ? input.contentWidth
        : existing.contentWidth,
    heroHeight:
      input.heroHeight !== undefined ? input.heroHeight : existing.heroHeight,
    spacingPreset:
      input.spacingPreset !== undefined
        ? input.spacingPreset
        : existing.spacingPreset,
    headingFont:
      input.headingFont !== undefined
        ? input.headingFont
        : existing.headingFont,
    bodyFont:
      input.bodyFont !== undefined ? input.bodyFont : existing.bodyFont,
    titleSize:
      input.titleSize !== undefined ? input.titleSize : existing.titleSize,
    subtitleSize:
      input.subtitleSize !== undefined
        ? input.subtitleSize
        : existing.subtitleSize,
    titleWeight:
      input.titleWeight !== undefined
        ? input.titleWeight
        : existing.titleWeight,
    subtitleWeight:
      input.subtitleWeight !== undefined
        ? input.subtitleWeight
        : existing.subtitleWeight,
    mobileTitleSize:
      input.mobileTitleSize !== undefined
        ? input.mobileTitleSize
        : existing.mobileTitleSize,
    mobileSubtitleSize:
      input.mobileSubtitleSize !== undefined
        ? input.mobileSubtitleSize
        : existing.mobileSubtitleSize,
    titleColor:
      input.titleColor !== undefined ? input.titleColor : existing.titleColor,
    subtitleColor:
      input.subtitleColor !== undefined
        ? input.subtitleColor
        : existing.subtitleColor,
    badgeTextColor:
      input.badgeTextColor !== undefined
        ? input.badgeTextColor
        : existing.badgeTextColor,
    badgeBgColor:
      input.badgeBgColor !== undefined
        ? input.badgeBgColor
        : existing.badgeBgColor,
    primaryCtaVariant:
      input.primaryCtaVariant !== undefined
        ? input.primaryCtaVariant
        : existing.primaryCtaVariant,
    secondaryCtaVariant:
      input.secondaryCtaVariant !== undefined
        ? input.secondaryCtaVariant
        : existing.secondaryCtaVariant,
    primaryCtaColor:
      input.primaryCtaColor !== undefined
        ? input.primaryCtaColor
        : existing.primaryCtaColor,
    secondaryCtaColor:
      input.secondaryCtaColor !== undefined
        ? input.secondaryCtaColor
        : existing.secondaryCtaColor,
    overlayColor:
      input.overlayColor !== undefined
        ? input.overlayColor
        : existing.overlayColor,
    overlayOpacity:
      input.overlayOpacity !== undefined
        ? normalizeHeroOverlayOpacity(input.overlayOpacity)
        : existing.overlayOpacity,
  });

  if (!existing.isFallback && nextType === "fallback") {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        type: "Only the protected fallback hero can use the fallback type.",
      },
    });
  }

  if (existing.isFallback && input.isActive === false) {
    throw new HeroServiceError(400, {
      error: "The fallback hero must remain active.",
    });
  }

  const nextStartDate =
    existing.isFallback
      ? null
      : normalizedStartDate !== undefined
        ? normalizedStartDate
        : existing.startDate;
  const nextEndDate =
    existing.isFallback
      ? null
      : normalizedEndDate !== undefined
        ? normalizedEndDate
        : existing.endDate;

  if (nextStartDate && nextEndDate && nextEndDate <= nextStartDate) {
    throw new HeroServiceError(400, {
      error: "Validation failed.",
      fields: {
        endDate: "End date must be after start date.",
      },
    });
  }

  const hero = await updateHeroRecord(id, {
    ...(input.name !== undefined && { name: trimRequired(input.name, "name") }),
    ...(input.type !== undefined && {
      type: existing.isFallback ? "fallback" : nextType,
    }),
    ...(input.title !== undefined && { title: trimRequired(input.title, "title") }),
    ...(input.subtitle !== undefined && { subtitle: trimOptional(input.subtitle) }),
    ...(input.badgeText !== undefined && { badgeText: trimOptional(input.badgeText) }),
    ...(input.primaryCtaText !== undefined && {
      primaryCtaText: trimRequired(input.primaryCtaText, "primaryCtaText"),
    }),
    ...(input.primaryCtaLink !== undefined && {
      primaryCtaLink: trimRequired(input.primaryCtaLink, "primaryCtaLink"),
    }),
    ...(input.secondaryCtaText !== undefined && {
      secondaryCtaText: trimOptional(input.secondaryCtaText),
    }),
    ...(input.secondaryCtaLink !== undefined && {
      secondaryCtaLink: trimOptional(input.secondaryCtaLink),
    }),
    ...(input.imageUrl !== undefined && { imageUrl: trimOptional(input.imageUrl) }),
    ...(input.mediaUrl !== undefined && { mediaUrl: trimOptional(input.mediaUrl) }),
    ...(input.mediaType !== undefined && { mediaType: trimOptional(input.mediaType) }),
    ...(input.textAlign !== undefined && { textAlign: nextStyle.textAlign }),
    ...(input.contentWidth !== undefined && {
      contentWidth: nextStyle.contentWidth,
    }),
    ...(input.heroHeight !== undefined && { heroHeight: nextStyle.heroHeight }),
    ...(input.spacingPreset !== undefined && {
      spacingPreset: nextStyle.spacingPreset,
    }),
    ...(input.headingFont !== undefined && {
      headingFont: nextStyle.headingFont,
    }),
    ...(input.bodyFont !== undefined && { bodyFont: nextStyle.bodyFont }),
    ...(input.titleSize !== undefined && { titleSize: nextStyle.titleSize }),
    ...(input.subtitleSize !== undefined && {
      subtitleSize: nextStyle.subtitleSize,
    }),
    ...(input.titleWeight !== undefined && {
      titleWeight: nextStyle.titleWeight,
    }),
    ...(input.subtitleWeight !== undefined && {
      subtitleWeight: nextStyle.subtitleWeight,
    }),
    ...(input.mobileTitleSize !== undefined && {
      mobileTitleSize: nextStyle.mobileTitleSize,
    }),
    ...(input.mobileSubtitleSize !== undefined && {
      mobileSubtitleSize: nextStyle.mobileSubtitleSize,
    }),
    ...(input.titleColor !== undefined && { titleColor: nextStyle.titleColor }),
    ...(input.subtitleColor !== undefined && {
      subtitleColor: nextStyle.subtitleColor,
    }),
    ...(input.badgeTextColor !== undefined && {
      badgeTextColor: nextStyle.badgeTextColor,
    }),
    ...(input.badgeBgColor !== undefined && {
      badgeBgColor: nextStyle.badgeBgColor,
    }),
    ...(input.primaryCtaVariant !== undefined && {
      primaryCtaVariant: nextStyle.primaryCtaVariant,
    }),
    ...(input.secondaryCtaVariant !== undefined && {
      secondaryCtaVariant: nextStyle.secondaryCtaVariant,
    }),
    ...(input.primaryCtaColor !== undefined && {
      primaryCtaColor: nextStyle.primaryCtaColor,
    }),
    ...(input.secondaryCtaColor !== undefined && {
      secondaryCtaColor: nextStyle.secondaryCtaColor,
    }),
    ...(input.overlayColor !== undefined && {
      overlayColor: nextStyle.overlayColor,
    }),
    ...(input.overlayOpacity !== undefined && {
      overlayOpacity: nextStyle.overlayOpacity,
    }),
    ...(input.priority !== undefined && {
      priority: existing.isFallback ? 0 : input.priority,
    }),
    ...(input.weight !== undefined && {
      weight: existing.isFallback ? 1 : Math.max(1, input.weight),
    }),
    ...(input.isActive !== undefined && {
      isActive: existing.isFallback ? true : input.isActive,
    }),
    ...(normalizedStartDate !== undefined && {
      startDate: existing.isFallback ? null : normalizedStartDate,
    }),
    ...(normalizedEndDate !== undefined && {
      endDate: existing.isFallback ? null : normalizedEndDate,
    }),
    ...(input.experimentId !== undefined && {
      experimentId: existing.isFallback ? null : nextExperiment.experimentId,
    }),
    ...(input.variant !== undefined && {
      variant: existing.isFallback ? null : nextExperiment.variant,
    }),
    ...(input.abGroup !== undefined && {
      abGroup: existing.isFallback ? null : trimOptional(input.abGroup),
    }),
    ...(existing.isFallback && {
      type: "fallback",
      priority: 0,
      weight: 1,
      isActive: true,
      startDate: null,
      endDate: null,
      experimentId: null,
      variant: null,
      abGroup: null,
      isFallback: true,
    }),
  });

  await invalidateActiveHeroCache();

  return mapHeroRecord(hero);
}

export async function deleteHero(id: string) {
  const existing = await findHeroById(id);

  if (!existing) {
    throw new HeroServiceError(404, {
      error: "Hero not found.",
    });
  }

  if (existing.isFallback) {
    throw new HeroServiceError(400, {
      error: "The fallback hero cannot be deleted.",
    });
  }

  await deleteHeroRecord(id);
  await invalidateActiveHeroCache();
}

export async function getFallbackHero() {
  return mapHeroRecord(await findFallbackHero());
}

export async function upsertFallbackHero(
  input: Omit<
    HeroMutationInput,
    "type" | "priority" | "weight" | "isActive" | "startDate" | "endDate" | "abGroup"
  > & { name?: string },
) {
  const existing = await findFallbackHero();
  const style = normalizeHeroStyle(input);

  if (existing) {
    return updateHero(existing.id, {
      name: input.name ?? existing.name,
      title: input.title,
      subtitle: input.subtitle,
      badgeText: input.badgeText,
      primaryCtaText: input.primaryCtaText,
      primaryCtaLink: input.primaryCtaLink,
      secondaryCtaText: input.secondaryCtaText,
      secondaryCtaLink: input.secondaryCtaLink,
      imageUrl: input.imageUrl,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
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
      type: "fallback",
      priority: 0,
      weight: 1,
      isActive: true,
      startDate: null,
      endDate: null,
      experimentId: null,
      variant: null,
      abGroup: null,
      isFallback: true,
    });
  }

  const hero = await createHeroRecord({
    name: trimRequired(input.name ?? "Default Hero", "name"),
    type: "fallback",
    title: trimRequired(input.title, "title"),
    subtitle: trimOptional(input.subtitle),
    badgeText: trimOptional(input.badgeText),
    primaryCtaText: trimRequired(input.primaryCtaText, "primaryCtaText"),
    primaryCtaLink: trimRequired(input.primaryCtaLink, "primaryCtaLink"),
    secondaryCtaText: trimOptional(input.secondaryCtaText),
    secondaryCtaLink: trimOptional(input.secondaryCtaLink),
    imageUrl: trimOptional(input.imageUrl),
    mediaUrl: trimOptional(input.mediaUrl),
    mediaType: trimOptional(input.mediaType),
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
    priority: 0,
    weight: 1,
    isActive: true,
    startDate: null,
    endDate: null,
    experimentId: null,
    variant: null,
    abGroup: null,
    isFallback: true,
  });

  await invalidateActiveHeroCache();

  return mapHeroRecord(hero);
}

export async function hasEligibleCmsHero(now = new Date()) {
  const count = await countEligibleHomepageHeroes(now);
  return count > 0;
}

export async function trackHeroImpression(id: string) {
  try {
    return await incrementHeroImpression(id);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2025") {
      throw new HeroServiceError(404, {
        error: "Hero not found.",
      });
    }

    throw error;
  }
}

export async function trackHeroClick(id: string) {
  try {
    return await incrementHeroClick(id);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2025") {
      throw new HeroServiceError(404, {
        error: "Hero not found.",
      });
    }

    throw error;
  }
}

export async function getHeroAnalytics(id: string) {
  const hero = await getHeroById(id);

  if (!hero) {
    throw new HeroServiceError(404, {
      error: "Hero not found.",
    });
  }

  const variants = await listHeroVariantAnalytics([id]);

  return {
    impressions: hero.impressions,
    clicks: hero.clicks,
    ctr: hero.ctr,
    variants: variants.map((row) => ({
      experimentId: row.experimentId,
      variant: row.variant,
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: toCtr(row.impressions, row.clicks),
    })),
  };
}

export async function recordHeroImpressionEvent(input: HeroAnalyticsEventInput) {
  const hero = await findHeroById(input.heroId);

  if (!hero) {
    throw new HeroServiceError(404, {
      error: "Hero not found.",
    });
  }

  const experiment = validateExperimentFields(input.experimentId, input.variant);

  await Promise.all([
    incrementHeroImpression(input.heroId),
    createHeroImpression({
      heroId: input.heroId,
      experimentId: experiment.experimentId,
      variant: experiment.variant,
    }),
  ]);
}

export async function recordHeroClickEvent(input: HeroAnalyticsEventInput) {
  const hero = await findHeroById(input.heroId);

  if (!hero) {
    throw new HeroServiceError(404, {
      error: "Hero not found.",
    });
  }

  const experiment = validateExperimentFields(input.experimentId, input.variant);

  await Promise.all([
    incrementHeroClick(input.heroId),
    createHeroClick({
      heroId: input.heroId,
      experimentId: experiment.experimentId,
      variant: experiment.variant,
    }),
  ]);
}
