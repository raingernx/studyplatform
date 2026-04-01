/**
 * Phase 2 behavior-based recommendation service.
 *
 * Builds a weighted interest profile from the user's last 30 days of behavior:
 *   - Purchases    → weight 5  (strongest intent signal)
 *   - Bookmarks    → weight 3
 *   - Likes        → weight 2
 *   - Downloads    → weight 2
 *   - Views        → weight 1
 *
 * Each signal is multiplied by a recency decay factor:
 *   0–7 days   → 1.0×     8–14 days  → 0.7×     15–30 days → 0.4×
 *
 * Scoring formula (in-memory, after candidate fetch):
 *   score = trendingScore + (categoryWeight × 30) + (tagWeight × 15)
 *
 * Diversity pass: max 2 per category, max 2 per creator.
 *
 * Fallback chain:
 *   no userId              → global trending (caller's responsibility)
 *   hasBehavior = false    → Phase 1 (category-trending from purchase history)
 *   Phase 2 result < 5     → pad with Phase 1, then global trending
 */

import {
  findUserAnalyticsEventSignals,
} from "@/repositories/analytics/analytics.repository";
import {
  findRecentPurchasePreferenceSignalsByUser,
  findUserDownloadSignalsInWindow,
} from "@/repositories/purchases/purchase.repository";
import {
  findPhase2CandidateResources,
  findTopTrendingInCategoriesExcludingIds,
} from "@/repositories/resources/resource.repository";
import { unstable_cache } from "next/cache";
import {
  CACHE_KEYS,
  CACHE_TAGS,
  CACHE_TTLS,
  rememberJson,
  runSingleFlight,
} from "@/lib/cache";

// ── Constants ─────────────────────────────────────────────────────────────────

const BEHAVIOR_WINDOW_DAYS = 30;
const MAX_PER_CATEGORY     = 2;
const MAX_PER_AUTHOR       = 2;
const TOP_CATEGORIES_TAKE  = 3;
const TOP_TAGS_TAKE        = 5;
const CANDIDATE_POOL_SIZE  = 50;

const BASE_WEIGHTS = {
  RESOURCE_BOOKMARK: 3,
  RESOURCE_LIKE:     2,
  RESOURCE_VIEW:     1,
  DOWNLOAD:          2,
  PURCHASE:          5,
} as const;

// ── Recency decay ─────────────────────────────────────────────────────────────

function decayFactor(createdAt: Date, now: number): number {
  const ageDays = (now - createdAt.getTime()) / 86_400_000;
  if (ageDays <= 7)  return 1.0;
  if (ageDays <= 14) return 0.7;
  return 0.4; // 15–30 days
}

// ── User interest profile ─────────────────────────────────────────────────────

interface UserInterestProfile {
  /** True when the user has at least one behavior signal in the 30-day window. */
  hasBehavior:               boolean;
  topCategoryIds:            string[];
  topTagIds:                 string[];
  categoryWeights:           Map<string, number>;
  tagWeights:                Map<string, number>;
  /** Resources viewed 3+ times — hard-excluded from the candidate pool. */
  heavyViewedResourceIds:    Set<string>;
  /** Resources viewed 1–2 times — still shown but score penalised by 0.6×. */
  recentlyViewedResourceIds: Set<string>;
}

async function buildUserInterestProfile(
  userId: string,
  since: Date,
): Promise<UserInterestProfile> {
  const now = Date.now();

  const [analyticsEvents, downloads, purchases] = await Promise.all([
    findUserAnalyticsEventSignals(userId, since),
    findUserDownloadSignalsInWindow(userId, since),
    findRecentPurchasePreferenceSignalsByUser(userId, 24),
  ]);

  const categoryWeights     = new Map<string, number>();
  const tagWeights          = new Map<string, number>();
  const viewCountByResource = new Map<string, number>();
  let   totalRawSignals     = 0;

  // ── Analytics events (VIEW, BOOKMARK, LIKE) ──
  for (const event of analyticsEvents) {
    if (!event.resource) continue;
    totalRawSignals += 1;

    const weight =
      (BASE_WEIGHTS[event.eventType as keyof typeof BASE_WEIGHTS] ?? 1) *
      decayFactor(event.createdAt, now);

    if (event.resource.category) {
      const { id } = event.resource.category;
      categoryWeights.set(id, (categoryWeights.get(id) ?? 0) + weight);
    }
    for (const { tag } of event.resource.tags) {
      tagWeights.set(tag.id, (tagWeights.get(tag.id) ?? 0) + weight);
    }

    if (event.eventType === "RESOURCE_VIEW") {
      viewCountByResource.set(
        event.resource.id,
        (viewCountByResource.get(event.resource.id) ?? 0) + 1,
      );
    }
  }

  // ── Download events ──
  for (const dl of downloads) {
    totalRawSignals += 1;
    const weight = BASE_WEIGHTS.DOWNLOAD * decayFactor(dl.createdAt, now);

    if (dl.resource.category) {
      const { id } = dl.resource.category;
      categoryWeights.set(id, (categoryWeights.get(id) ?? 0) + weight);
    }
    for (const { tag } of dl.resource.tags) {
      tagWeights.set(tag.id, (tagWeights.get(tag.id) ?? 0) + weight);
    }
  }

  // ── Purchases (category only — tags not in purchase select) ──
  const cutoff = since.getTime();
  for (const p of purchases) {
    if (p.createdAt.getTime() < cutoff) continue;
    totalRawSignals += 1;
    const weight = BASE_WEIGHTS.PURCHASE * decayFactor(p.createdAt, now);

    if (p.resource.category) {
      const { id } = p.resource.category;
      categoryWeights.set(id, (categoryWeights.get(id) ?? 0) + weight);
    }
  }

  const topCategoryIds = Array.from(categoryWeights.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_CATEGORIES_TAKE)
    .map(([id]) => id);

  const topTagIds = Array.from(tagWeights.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_TAGS_TAKE)
    .map(([id]) => id);

  const heavyViewedResourceIds = new Set(
    Array.from(viewCountByResource.entries())
      .filter(([, count]) => count >= 3)
      .map(([id]) => id),
  );

  // 1–2 views: still eligible candidates, but score is penalised (see scoreCandidate)
  const recentlyViewedResourceIds = new Set(
    Array.from(viewCountByResource.entries())
      .filter(([, count]) => count >= 1 && count < 3)
      .map(([id]) => id),
  );

  return {
    hasBehavior: totalRawSignals > 0,
    topCategoryIds,
    topTagIds,
    categoryWeights,
    tagWeights,
    heavyViewedResourceIds,
    recentlyViewedResourceIds,
  };
}

// ── Candidate type ────────────────────────────────────────────────────────────

type Phase2Candidate = {
  id:            string;
  title:         string;
  slug:          string;
  price:         number;
  isFree:        boolean;
  featured:      boolean;
  downloadCount: number;
  createdAt:     Date;
  previewUrl:    string | null;
  author:        { id: string; name: string | null; image: string | null };
  category:      { id: string; name: string; slug: string } | null;
  previews:      { imageUrl: string }[];
  tags:          { tag: { id: string; slug: string } }[];
  resourceStat:  { trendingScore: number } | null;
};

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreCandidate(resource: Phase2Candidate, profile: UserInterestProfile): number {
  const trendingScore  = resource.resourceStat?.trendingScore ?? 0;
  const categoryWeight = resource.category
    ? (profile.categoryWeights.get(resource.category.id) ?? 0)
    : 0;
  const tagWeight = resource.tags.reduce(
    (sum, { tag }) => sum + (profile.tagWeights.get(tag.id) ?? 0),
    0,
  );
  let score = trendingScore + categoryWeight * 30 + tagWeight * 15;

  // Anti-repeat: soft penalty for resources the user has viewed 1–2 times.
  // They stay eligible but sink below fresh candidates in ranking.
  if (profile.recentlyViewedResourceIds.has(resource.id)) {
    score *= 0.6;
  }

  return score;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePreview<
  T extends { id: string; previewUrl?: string | null; previews?: { imageUrl: string }[] },
>(resource: T): T & { previewUrl: string | null } {
  return {
    ...resource,
    previewUrl: resource.previewUrl ?? resource.previews?.[0]?.imageUrl ?? null,
  };
}

/**
 * Returns a short human-readable reason for why this resource was recommended.
 * Used as the card's socialProofLabel so it surfaces in the existing UI.
 */
function buildReason(
  categoryId: string | null | undefined,
  profile: UserInterestProfile,
): string {
  if (categoryId && profile.categoryWeights.has(categoryId)) {
    return "Based on your recent activity";
  }
  return "Popular in topics you explore";
}

function withReason<T extends { id: string; category?: { id: string } | null }>(
  resource: T,
  profile: UserInterestProfile,
): T & { reason: string; socialProofLabel: string } {
  const reason = buildReason(resource.category?.id, profile);
  return { ...resource, reason, socialProofLabel: reason };
}

// ── Phase 1 (control arm) ─────────────────────────────────────────────────────

/**
 * Phase 1 recommendations: top-trending in the user's purchase-history
 * categories, padded with global trending when the category pool is small.
 *
 * Exported as the control arm for the Phase 1 vs Phase 2 A/B experiment.
 * Intentionally contains no behavior-profile logic so the two arms are clean.
 */
export async function getPhase1Recommendations(
  topCategoryIds: string[],
  ownedIds: Set<string>,
  globalFallback: { id: string; previewUrl?: string | null; previews?: { imageUrl: string }[] }[],
  limit = 5,
) {
  const ownedArr = Array.from(ownedIds);

  if (topCategoryIds.length > 0) {
    const rows = await findTopTrendingInCategoriesExcludingIds(
      topCategoryIds,
      ownedArr,
      limit * 2,
    );
    const normalized = rows
      .filter((r) => !ownedIds.has(r.id))
      .map(normalizePreview)
      .slice(0, limit);

    if (normalized.length >= limit) {
      return normalized.map((r) => ({ ...r, socialProofLabel: "Popular in your topics" }));
    }

    const seenIds = new Set(normalized.map((r) => r.id));
    const extra   = globalFallback
      .filter((r) => !ownedIds.has(r.id) && !seenIds.has(r.id))
      .map(normalizePreview);

    return [...normalized, ...extra]
      .slice(0, limit)
      .map((r) => ({ ...r, socialProofLabel: "Popular in your topics" }));
  }

  return globalFallback
    .filter((r) => !ownedIds.has(r.id))
    .slice(0, limit)
    .map((r) => ({ ...normalizePreview(r), socialProofLabel: "Popular right now" }));
}

// ── Cached profile loader ─────────────────────────────────────────────────────
//
// Maps and Sets are not JSON-serializable, so we round-trip through a flat
// representation: Maps → array of [key, value] tuples; Sets → string arrays.
// The TTL matches CACHE_TTLS.stats (5 min).  rememberJson is a no-op when
// Redis is not configured, so environments without Upstash work identically.

interface SerializedUserInterestProfile {
  hasBehavior:               boolean;
  topCategoryIds:            string[];
  topTagIds:                 string[];
  categoryWeights:           [string, number][];
  tagWeights:                [string, number][];
  heavyViewedResourceIds:    string[];
  recentlyViewedResourceIds: string[];
}

async function getCachedUserInterestProfile(
  userId: string,
  since: Date,
): Promise<UserInterestProfile> {
  const cacheKey = `${CACHE_KEYS.behaviorProfile(userId)}:${since.toISOString()}`;
  const serialized = await rememberJson<SerializedUserInterestProfile>(
    cacheKey,
    CACHE_TTLS.stats,
    () =>
      runSingleFlight(cacheKey, async () => {
        const p = await buildUserInterestProfile(userId, since);
        return {
          hasBehavior:               p.hasBehavior,
          topCategoryIds:            p.topCategoryIds,
          topTagIds:                 p.topTagIds,
          categoryWeights:           Array.from(p.categoryWeights.entries()),
          tagWeights:                Array.from(p.tagWeights.entries()),
          heavyViewedResourceIds:    Array.from(p.heavyViewedResourceIds),
          recentlyViewedResourceIds: Array.from(p.recentlyViewedResourceIds),
        };
      }),
  );

  return {
    hasBehavior:               serialized.hasBehavior,
    topCategoryIds:            serialized.topCategoryIds,
    topTagIds:                 serialized.topTagIds,
    categoryWeights:           new Map(serialized.categoryWeights),
    tagWeights:                new Map(serialized.tagWeights),
    heavyViewedResourceIds:    new Set(serialized.heavyViewedResourceIds),
    recentlyViewedResourceIds: new Set(serialized.recentlyViewedResourceIds),
  };
}

// ── Cached candidate pool ─────────────────────────────────────────────────────
//
// Fetches the Phase 2 candidate pool (up to CANDIDATE_POOL_SIZE + buffer)
// WITHOUT per-user owned/heavyViewed exclusion, so the result can be cached
// and shared across all users whose top-category and top-tag profiles match.
//
// Owned and heavy-viewed exclusion is applied in memory inside
// getBehaviorBasedRecommendations after the cache hit.  Fetching a slightly
// larger pool (CANDIDATE_POOL_SIZE + 20) ensures the in-memory filter still
// leaves enough candidates to fill the diversity pass.
//
// Cache key: ["phase2-candidate-pool", topCategoryIds, topTagIds, limit]
// TTL: 120 s (CACHE_TTLS.publicPage), invalidated by the "discover" tag.
//
// Phase2Candidate.createdAt comes back as an ISO string after JSON round-trip;
// it is not used in scoring or diversity, so the string form is harmless.

const getCachedPhase2CandidatePool = unstable_cache(
  async function _getCachedPhase2CandidatePool(
    topCategoryIds: string[],
    topTagIds: string[],
    limit: number,
  ): Promise<Phase2Candidate[]> {
    const categoryKey = topCategoryIds.length > 0 ? topCategoryIds.join(",") : "none";
    const tagKey = topTagIds.length > 0 ? topTagIds.join(",") : "none";
    const cacheKey = `phase2_candidate_pool:${categoryKey}:${tagKey}:${limit}`;

    return rememberJson<Phase2Candidate[]>(
      cacheKey,
      CACHE_TTLS.publicPage,
      () =>
        runSingleFlight(cacheKey, () =>
          findPhase2CandidateResources(
            topCategoryIds,
            topTagIds,
            [],
            limit,
          ) as Promise<Phase2Candidate[]>,
        ),
    );
  },
  ["phase2-candidate-pool"],
  { revalidate: CACHE_TTLS.publicPage, tags: [CACHE_TAGS.discover] },
);

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a personalised "Recommended for you" list for the given user.
 *
 * Fallback chain:
 *  1. hasBehavior = false → Phase 1 (top-trending in purchase-history categories)
 *  2. Phase 2 pool < limit → pad with Phase 1 (no duplicates), then global
 *  3. topCategoryIds is empty → global fallback only
 *
 * @param userId          Authenticated user id
 * @param ownedIds        Resource ids the user already owns (always excluded)
 * @param topCategoryIds  Top purchase-history category ids (from UserLearningProfile)
 * @param globalFallback  Pre-filtered global trending list (last-resort fallback)
 * @param limit           Items to return (default 5)
 */
export async function getBehaviorBasedRecommendations(
  userId: string,
  ownedIds: Set<string>,
  topCategoryIds: string[],
  globalFallback: { id: string; previewUrl?: string | null; previews?: { imageUrl: string }[] }[],
  limit = 5,
) {
  const since    = new Date(Date.now() - BEHAVIOR_WINDOW_DAYS * 86_400_000);
  const ownedArr = Array.from(ownedIds);

  // ── Phase 1 helper: category-trending padded with global ─────────────────
  async function getPhase1(exclude: Set<string> = new Set()): Promise<ReturnType<typeof normalizePreview>[]> {
    if (topCategoryIds.length > 0) {
      const rows = await findTopTrendingInCategoriesExcludingIds(
        topCategoryIds,
        ownedArr,
        limit * 2,
      );
      const normalized = rows
        .filter((r) => !exclude.has(r.id))
        .map(normalizePreview)
        .slice(0, limit);
      if (normalized.length >= limit) return normalized;

      const seenIds = new Set([...exclude, ...normalized.map((r) => r.id)]);
      const extra   = globalFallback
        .filter((r) => !ownedIds.has(r.id) && !seenIds.has(r.id))
        .map(normalizePreview);
      return [...normalized, ...extra].slice(0, limit);
    }

    return globalFallback
      .filter((r) => !ownedIds.has(r.id) && !exclude.has(r.id))
      .slice(0, limit)
      .map(normalizePreview);
  }

  // ── Build user interest profile (Redis-cached, 5 min TTL) ────────────────
  const profile = await getCachedUserInterestProfile(userId, since);

  // No behavior in last 30 days → Phase 1
  if (
    !profile.hasBehavior ||
    (profile.topCategoryIds.length === 0 && profile.topTagIds.length === 0)
  ) {
    return (await getPhase1()).map((r) => withReason(r, profile));
  }

  // ── Fetch Phase 2 candidates (shared cached pool, filter in memory) ─────
  // getCachedPhase2CandidatePool omits per-user exclusions so results can be
  // shared across users with the same category/tag profile.  We apply owned
  // and heavy-viewed exclusion here in memory after the cache hit.
  const poolRaw = await getCachedPhase2CandidatePool(
    profile.topCategoryIds,
    profile.topTagIds,
    CANDIDATE_POOL_SIZE + 20,
  );

  const candidates = poolRaw.filter(
    (r) => !ownedIds.has(r.id) && !profile.heavyViewedResourceIds.has(r.id),
  );

  // ── Score + rank ─────────────────────────────────────────────────────────
  const scored = candidates
    .map((r) => ({ r, score: scoreCandidate(r, profile) }))
    .sort((a, b) => b.score - a.score);

  // ── Diversity pass ───────────────────────────────────────────────────────
  const categoryCounts = new Map<string, number>();
  const authorCounts   = new Map<string, number>();
  const diversified: Phase2Candidate[] = [];

  for (const { r } of scored) {
    if (diversified.length >= limit) break;

    const catId    = r.category?.id;
    const authorId = r.author.id;
    const catUsed  = catId ? (categoryCounts.get(catId) ?? 0) : 0;
    const authUsed = authorCounts.get(authorId) ?? 0;

    if (catId && catUsed >= MAX_PER_CATEGORY) continue;
    if (authUsed >= MAX_PER_AUTHOR) continue;

    diversified.push(r);
    if (catId) categoryCounts.set(catId, catUsed + 1);
    authorCounts.set(authorId, authUsed + 1);
  }

  // ── Pad with Phase 1 if Phase 2 returned fewer than limit ────────────────
  if (diversified.length < limit) {
    const seenIds  = new Set(diversified.map((r) => r.id));
    const phase1   = await getPhase1(seenIds);
    const combined = [
      ...diversified.map((r) => withReason(normalizePreview(r), profile)),
      ...phase1.filter((r) => !seenIds.has(r.id)).map((r) => withReason(r, profile)),
    ].slice(0, limit);
    return combined;
  }

  return diversified.map((r) => withReason(normalizePreview(r), profile));
}
