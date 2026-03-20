import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface HeroVariantAnalyticsRow {
  heroId: string;
  experimentId: string | null;
  variant: string | null;
  impressions: number;
  clicks: number;
}

export async function findActiveHero(now: Date) {
  const heroes = await listEligibleHomepageHeroes(now);
  return heroes[0] ?? null;
}

export async function findFallbackHero() {
  return prisma.hero.findFirst({
    where: { isFallback: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function findLegacyHomepageHero() {
  return prisma.homepageHero.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

export type HeroListFilter = "all" | "active" | "scheduled" | "expired";

function buildEligibleCampaignWhere(now: Date) {
  return {
    isFallback: false,
    isActive: true,
    AND: [
      {
        OR: [{ startDate: null }, { startDate: { lte: now } }],
      },
      {
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    ],
  };
}

function buildHeroFilterWhere(filter: HeroListFilter, now: Date) {
  if (filter === "active") {
    return {
      OR: [
        { isFallback: true, isActive: true },
        buildEligibleCampaignWhere(now),
      ],
    };
  }

  if (filter === "scheduled") {
    return {
      isFallback: false,
      isActive: true,
      startDate: { gt: now },
    };
  }

  if (filter === "expired") {
    return {
      isFallback: false,
      endDate: { lt: now },
    };
  }

  return undefined;
}

export async function listEligibleHomepageHeroes(now: Date) {
  return prisma.hero.findMany({
    where: buildEligibleCampaignWhere(now),
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
}

export async function countEligibleHomepageHeroes(now: Date) {
  return prisma.hero.count({
    where: buildEligibleCampaignWhere(now),
  });
}

export async function listHeroes(filter: HeroListFilter = "all", now = new Date()) {
  return prisma.hero.findMany({
    where: buildHeroFilterWhere(filter, now),
    orderBy: [
      { isFallback: "desc" },
      { priority: "asc" },
      { createdAt: "asc" },
    ],
  });
}

export async function findHeroById(id: string) {
  return prisma.hero.findUnique({
    where: { id },
  });
}

export interface UpsertHeroRecordInput {
  name?: string;
  type?: string;
  title?: string;
  subtitle?: string | null;
  badgeText?: string | null;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string | null;
  secondaryCtaLink?: string | null;
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
  priority?: number;
  weight?: number;
  isActive?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  experimentId?: string | null;
  variant?: string | null;
  abGroup?: string | null;
  isFallback?: boolean;
}

function toHeroCreateData(data: Required<UpsertHeroRecordInput>): Prisma.HeroCreateInput {
  return {
    name: data.name,
    type: data.type,
    title: data.title,
    subtitle: data.subtitle,
    badgeText: data.badgeText,
    primaryCtaText: data.primaryCtaText,
    primaryCtaLink: data.primaryCtaLink,
    secondaryCtaText: data.secondaryCtaText,
    secondaryCtaLink: data.secondaryCtaLink,
    imageUrl: data.imageUrl,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType,
    textAlign: data.textAlign,
    contentWidth: data.contentWidth,
    heroHeight: data.heroHeight,
    spacingPreset: data.spacingPreset,
    headingFont: data.headingFont,
    bodyFont: data.bodyFont,
    titleSize: data.titleSize,
    subtitleSize: data.subtitleSize,
    titleWeight: data.titleWeight,
    subtitleWeight: data.subtitleWeight,
    mobileTitleSize: data.mobileTitleSize,
    mobileSubtitleSize: data.mobileSubtitleSize,
    titleColor: data.titleColor,
    subtitleColor: data.subtitleColor,
    badgeTextColor: data.badgeTextColor,
    badgeBgColor: data.badgeBgColor,
    primaryCtaVariant: data.primaryCtaVariant,
    secondaryCtaVariant: data.secondaryCtaVariant,
    primaryCtaColor: data.primaryCtaColor,
    secondaryCtaColor: data.secondaryCtaColor,
    overlayColor: data.overlayColor,
    overlayOpacity: data.overlayOpacity,
    priority: data.priority,
    weight: data.weight,
    isActive: data.isActive,
    startDate: data.startDate,
    endDate: data.endDate,
    experimentId: data.experimentId,
    variant: data.variant,
    abGroup: data.abGroup,
    isFallback: data.isFallback,
  };
}

function toHeroUpdateData(data: UpsertHeroRecordInput): Prisma.HeroUpdateInput {
  const nextData: Prisma.HeroUpdateInput = {};

  if (data.name !== undefined) nextData.name = data.name;
  if (data.type !== undefined) nextData.type = data.type;
  if (data.title !== undefined) nextData.title = data.title;
  if (data.subtitle !== undefined) nextData.subtitle = data.subtitle;
  if (data.badgeText !== undefined) nextData.badgeText = data.badgeText;
  if (data.primaryCtaText !== undefined) nextData.primaryCtaText = data.primaryCtaText;
  if (data.primaryCtaLink !== undefined) nextData.primaryCtaLink = data.primaryCtaLink;
  if (data.secondaryCtaText !== undefined) nextData.secondaryCtaText = data.secondaryCtaText;
  if (data.secondaryCtaLink !== undefined) nextData.secondaryCtaLink = data.secondaryCtaLink;
  if (data.imageUrl !== undefined) nextData.imageUrl = data.imageUrl;
  if (data.mediaUrl !== undefined) nextData.mediaUrl = data.mediaUrl;
  if (data.mediaType !== undefined) nextData.mediaType = data.mediaType;
  if (data.textAlign !== undefined) nextData.textAlign = data.textAlign;
  if (data.contentWidth !== undefined) nextData.contentWidth = data.contentWidth;
  if (data.heroHeight !== undefined) nextData.heroHeight = data.heroHeight;
  if (data.spacingPreset !== undefined) nextData.spacingPreset = data.spacingPreset;
  if (data.headingFont !== undefined) nextData.headingFont = data.headingFont;
  if (data.bodyFont !== undefined) nextData.bodyFont = data.bodyFont;
  if (data.titleSize !== undefined) nextData.titleSize = data.titleSize;
  if (data.subtitleSize !== undefined) nextData.subtitleSize = data.subtitleSize;
  if (data.titleWeight !== undefined) nextData.titleWeight = data.titleWeight;
  if (data.subtitleWeight !== undefined) nextData.subtitleWeight = data.subtitleWeight;
  if (data.mobileTitleSize !== undefined) nextData.mobileTitleSize = data.mobileTitleSize;
  if (data.mobileSubtitleSize !== undefined) nextData.mobileSubtitleSize = data.mobileSubtitleSize;
  if (data.titleColor !== undefined) nextData.titleColor = data.titleColor;
  if (data.subtitleColor !== undefined) nextData.subtitleColor = data.subtitleColor;
  if (data.badgeTextColor !== undefined) nextData.badgeTextColor = data.badgeTextColor;
  if (data.badgeBgColor !== undefined) nextData.badgeBgColor = data.badgeBgColor;
  if (data.primaryCtaVariant !== undefined) nextData.primaryCtaVariant = data.primaryCtaVariant;
  if (data.secondaryCtaVariant !== undefined) nextData.secondaryCtaVariant = data.secondaryCtaVariant;
  if (data.primaryCtaColor !== undefined) nextData.primaryCtaColor = data.primaryCtaColor;
  if (data.secondaryCtaColor !== undefined) nextData.secondaryCtaColor = data.secondaryCtaColor;
  if (data.overlayColor !== undefined) nextData.overlayColor = data.overlayColor;
  if (data.overlayOpacity !== undefined) nextData.overlayOpacity = data.overlayOpacity;
  if (data.priority !== undefined) nextData.priority = data.priority;
  if (data.weight !== undefined) nextData.weight = data.weight;
  if (data.isActive !== undefined) nextData.isActive = data.isActive;
  if (data.startDate !== undefined) nextData.startDate = data.startDate;
  if (data.endDate !== undefined) nextData.endDate = data.endDate;
  if (data.experimentId !== undefined) nextData.experimentId = data.experimentId;
  if (data.variant !== undefined) nextData.variant = data.variant;
  if (data.abGroup !== undefined) nextData.abGroup = data.abGroup;
  if (data.isFallback !== undefined) nextData.isFallback = data.isFallback;

  return nextData;
}

export async function createHeroRecord(data: Required<UpsertHeroRecordInput>) {
  return prisma.hero.create({
    data: toHeroCreateData(data),
  });
}

export async function updateHeroRecord(id: string, data: UpsertHeroRecordInput) {
  return prisma.hero.update({
    where: { id },
    data: toHeroUpdateData(data),
  });
}

export async function deleteHeroRecord(id: string) {
  return prisma.hero.delete({
    where: { id },
  });
}

export async function incrementHeroImpression(id: string) {
  return prisma.hero.update({
    where: { id },
    data: {
      impressions: {
        increment: 1,
      },
    },
    select: {
      impressions: true,
      clicks: true,
    },
  });
}

export async function incrementHeroClick(id: string) {
  return prisma.hero.update({
    where: { id },
    data: {
      clicks: {
        increment: 1,
      },
    },
    select: {
      impressions: true,
      clicks: true,
    },
  });
}

export async function createHeroImpression(input: {
  heroId: string;
  experimentId?: string | null;
  variant?: string | null;
}) {
  return prisma.heroImpression.create({
    data: {
      heroId: input.heroId,
      experimentId: input.experimentId ?? null,
      variant: input.variant ?? null,
    },
    select: {
      id: true,
    },
  });
}

export async function createHeroClick(input: {
  heroId: string;
  experimentId?: string | null;
  variant?: string | null;
}) {
  return prisma.heroClick.create({
    data: {
      heroId: input.heroId,
      experimentId: input.experimentId ?? null,
      variant: input.variant ?? null,
    },
    select: {
      id: true,
    },
  });
}

export async function listHeroVariantAnalytics(heroIds: string[]) {
  if (heroIds.length === 0) {
    return [] as HeroVariantAnalyticsRow[];
  }

  const [impressionRows, clickRows] = await Promise.all([
    prisma.heroImpression.groupBy({
      by: ["heroId", "experimentId", "variant"],
      where: {
        heroId: { in: heroIds },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.heroClick.groupBy({
      by: ["heroId", "experimentId", "variant"],
      where: {
        heroId: { in: heroIds },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const rows = new Map<string, HeroVariantAnalyticsRow>();

  for (const row of impressionRows) {
    const key = `${row.heroId}:${row.experimentId ?? ""}:${row.variant ?? ""}`;
    rows.set(key, {
      heroId: row.heroId,
      experimentId: row.experimentId,
      variant: row.variant,
      impressions: row._count._all,
      clicks: 0,
    });
  }

  for (const row of clickRows) {
    const key = `${row.heroId}:${row.experimentId ?? ""}:${row.variant ?? ""}`;
    const existing = rows.get(key);
    if (existing) {
      existing.clicks = row._count._all;
      continue;
    }

    rows.set(key, {
      heroId: row.heroId,
      experimentId: row.experimentId,
      variant: row.variant,
      impressions: 0,
      clicks: row._count._all,
    });
  }

  return Array.from(rows.values()).sort((left, right) => {
    if (left.heroId !== right.heroId) {
      return left.heroId.localeCompare(right.heroId);
    }
    if ((left.experimentId ?? "") !== (right.experimentId ?? "")) {
      return (left.experimentId ?? "").localeCompare(right.experimentId ?? "");
    }
    return (left.variant ?? "").localeCompare(right.variant ?? "");
  });
}
