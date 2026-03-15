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

export async function createHeroRecord(data: Required<UpsertHeroRecordInput>) {
  return prisma.hero.create({
    data,
  });
}

export async function updateHeroRecord(id: string, data: UpsertHeroRecordInput) {
  return prisma.hero.update({
    where: { id },
    data,
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
