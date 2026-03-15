import { cookies, headers } from "next/headers";
import { cache } from "react";
import { getCachedEligibleHomepageHeroes } from "@/lib/cache/heroCache";
import { findFallbackHero, findLegacyHomepageHero } from "@/repositories/heroes/hero.repository";

export interface HomepageHeroSelectionContext {
  userId?: string | null;
}

export interface ResolvedHomepageHeroConfig {
  heroId?: string | null;
  source?: "cms" | "fallback";
  experimentId?: string | null;
  variant?: string | null;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
}

type HeroCandidate = Awaited<ReturnType<typeof getCachedEligibleHomepageHeroes>>[number];

const HERO_AB_COOKIE_NAME = "hero_ab_seed";
const HERO_EXPERIMENT_COOKIE_PREFIX = "hero_exp_";

function normalizeOptionalString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toResolvedConfig(
  hero:
    | {
        id?: string;
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
      }
    | null,
  source?: "cms" | "fallback",
): ResolvedHomepageHeroConfig | null {
  if (!hero) {
    return null;
  }

  return {
    heroId: hero.id ?? null,
    source,
    experimentId: hero.experimentId ?? null,
    variant: hero.variant ?? null,
    title: hero.title,
    subtitle: hero.subtitle ?? "",
    primaryCtaText: hero.primaryCtaText ?? "",
    primaryCtaLink: hero.primaryCtaLink ?? "",
    secondaryCtaText: normalizeOptionalString(hero.secondaryCtaText),
    secondaryCtaLink: normalizeOptionalString(hero.secondaryCtaLink),
    badgeText: normalizeOptionalString(hero.badgeText),
    imageUrl: normalizeOptionalString(hero.imageUrl),
    mediaUrl: normalizeOptionalString(hero.mediaUrl),
    mediaType: normalizeOptionalString(hero.mediaType),
  };
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

async function getSelectionSeed(context: HomepageHeroSelectionContext) {
  if (context.userId) {
    return `user:${context.userId}`;
  }

  const cookieStore = await cookies();
  const cookieSeed = cookieStore.get(HERO_AB_COOKIE_NAME)?.value?.trim();
  if (cookieSeed) {
    return `cookie:${cookieSeed}`;
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "";
  const language = headerStore.get("accept-language") ?? "";
  return `anon:${userAgent}:${language}`;
}

function chooseAbGroup(candidates: HeroCandidate[], seed: string) {
  const groups = Array.from(
    new Set(
      candidates.map((candidate) => normalizeOptionalString(candidate.abGroup) ?? "__default__"),
    ),
  ).sort();

  if (groups.length <= 1) {
    return groups[0] ?? "__default__";
  }

  const index = hashString(`ab:${seed}`) % groups.length;
  return groups[index];
}

function chooseWeightedHero(candidates: HeroCandidate[], seed: string) {
  if (candidates.length === 1) {
    return candidates[0];
  }

  const totalWeight = candidates.reduce(
    (sum, candidate) => sum + Math.max(1, candidate.weight ?? 1),
    0,
  );

  const pick = hashString(`weight:${seed}`) % totalWeight;
  let cursor = 0;

  for (const candidate of candidates) {
    cursor += Math.max(1, candidate.weight ?? 1);
    if (pick < cursor) {
      return candidate;
    }
  }

  return candidates[0];
}

function normalizeExperimentId(candidate: HeroCandidate) {
  return normalizeOptionalString(candidate.experimentId);
}

function normalizeVariant(candidate: HeroCandidate) {
  return normalizeOptionalString(candidate.variant);
}

async function getExperimentVariant(
  experimentId: string,
  variants: string[],
  seed: string,
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore
    .get(`${HERO_EXPERIMENT_COOKIE_PREFIX}${experimentId}`)
    ?.value?.trim();

  if (cookieValue && variants.includes(cookieValue)) {
    return cookieValue;
  }

  const index = hashString(`experiment:${experimentId}:${seed}`) % variants.length;
  return variants[index];
}

async function applyExperimentAssignments(candidates: HeroCandidate[], seed: string) {
  const groups = new Map<string, HeroCandidate[]>();
  const passthrough: HeroCandidate[] = [];

  for (const candidate of candidates) {
    const experimentId = normalizeExperimentId(candidate);
    const variant = normalizeVariant(candidate);

    if (!experimentId || !variant) {
      passthrough.push(candidate);
      continue;
    }

    const group = groups.get(experimentId);
    if (group) {
      group.push(candidate);
    } else {
      groups.set(experimentId, [candidate]);
    }
  }

  const resolved = [...passthrough];

  for (const [experimentId, group] of groups.entries()) {
    const variants = Array.from(
      new Set(group.map((candidate) => normalizeVariant(candidate)).filter(Boolean)),
    ).sort() as string[];

    if (variants.length <= 1) {
      resolved.push(...group);
      continue;
    }

    const selectedVariant = await getExperimentVariant(experimentId, variants, seed);
    resolved.push(
      ...group.filter((candidate) => normalizeVariant(candidate) === selectedVariant),
    );
  }

  return resolved;
}

const resolveHomepageHeroCached = cache(
  async (userId?: string | null): Promise<ResolvedHomepageHeroConfig | null> => {
    const eligibleHeroes = await getCachedEligibleHomepageHeroes();

    if (eligibleHeroes.length > 0) {
      const topPriority = eligibleHeroes[0].priority;
      const priorityBucket = eligibleHeroes.filter(
        (candidate) => candidate.priority === topPriority,
      );

      const seed = await getSelectionSeed({ userId });
      const experimentCandidates = await applyExperimentAssignments(priorityBucket, seed);
      const selectedGroup = chooseAbGroup(experimentCandidates, seed);
      const abCandidates = experimentCandidates.filter(
        (candidate) =>
          (normalizeOptionalString(candidate.abGroup) ?? "__default__") === selectedGroup,
      );
      const selectedHero = chooseWeightedHero(abCandidates, seed);

      return toResolvedConfig(selectedHero, "cms");
    }

    const fallbackHero = await findFallbackHero();
    if (fallbackHero) {
      return toResolvedConfig(fallbackHero, "fallback");
    }

    const legacyFallbackHero = await findLegacyHomepageHero();
    return toResolvedConfig(legacyFallbackHero, "fallback");
  },
);

export async function resolveHomepageHero(
  context: HomepageHeroSelectionContext = {},
): Promise<ResolvedHomepageHeroConfig | null> {
  return resolveHomepageHeroCached(context.userId ?? null);
}
