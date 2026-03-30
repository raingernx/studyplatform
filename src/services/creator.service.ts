import type { CreatorStatus, UserRole, CreatorApplicationStatus } from "@prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import {
  CACHE_KEYS,
  CACHE_TAGS,
  CACHE_TTLS,
  getCreatorPublicCacheTag,
  rememberJson,
} from "@/lib/cache";
import { logPerformanceEvent } from "@/lib/performance/observability";
import { logActivity } from "@/lib/activity";
import { slugify } from "@/lib/utils";
import { findCreatorStatByCreatorId } from "@/repositories/analytics/analytics.repository";
import { getCreatorPayouts, sumCreatorPayouts } from "@/repositories/payouts/payout.repository";
import {
  createCreatorResourceRecord,
  enableCreatorAccessRecord,
  findCreatorAccessContext,
  findMostRecentCreatorDraft,
  findCreatorCategories,
  findCreatorDownloadSeries,
  findCreatorEarningsTotals,
  findCreatorProfileBySlug,
  findCreatorPublicProfileById,
  findCreatorProfileByUserId,
  findCreatorRecentDownloads,
  findCreatorRecentSales,
  findCreatorResourceById,
  findCreatorResourceBySlug,
  findCreatorResourceStatusSummary,
  findCreatorResourcesByUserId,
  getCreatorResourcePerformance,
  getCreatorStats,
  findCreatorRevenueSeries,
  findCreatorSales,
  findCreatorSlugOwner,
  findCreatorRecentVisibleReviews,
  updateCreatorProfileRecord,
  updateCreatorResourceRecord,
  updateCreatorResourceStatusRecord,
  getCreatorReviewOverview,
  getCreatorResourceReviewSummaries,
  type CreatorResourceFilters,
  getCreatorVisibleRatingDistribution,
  submitCreatorApplicationRecord,
  findCreatorApplicationRecord,
  findPendingCreatorApplications,
  findAllCreatorApplications,
  approveCreatorApplicationRecord,
  rejectCreatorApplicationRecord,
  type CreatorApplicationInput,
} from "@/repositories/creators/creator.repository";
import { findResourceBySlug } from "@/repositories/resources/resource.repository";

const previewUrlSchema = z.string().refine(
  (value) =>
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/"),
  {
    message:
      "Preview must be a URL or uploaded image path (e.g. https://… or /uploads/…).",
  },
);

const CreatorProfileSchema = z.object({
  creatorDisplayName: z
    .string()
    .trim()
    .max(120, "Display name must be at most 120 characters.")
    .optional()
    .nullable(),
  creatorSlug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(80, "Slug must be at most 80 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens.")
    .optional()
    .nullable()
    .or(z.literal("")),
  creatorBio: z
    .string()
    .trim()
    .max(600, "Bio must be at most 600 characters.")
    .optional()
    .nullable(),
  creatorBanner: z
    .union([z.string().url("Banner must be a valid URL."), z.literal(""), z.null(), z.undefined()])
    .optional(),
  creatorStatus: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE"),
  socialLinks: z
    .object({
      website: z
        .union([z.string().url("Website must be a valid URL."), z.literal(""), z.undefined()])
        .optional(),
      twitter: z
        .union([z.string().url("Twitter must be a valid URL."), z.literal(""), z.undefined()])
        .optional(),
      instagram: z
        .union([z.string().url("Instagram must be a valid URL."), z.literal(""), z.undefined()])
        .optional(),
      youtube: z
        .union([z.string().url("YouTube must be a valid URL."), z.literal(""), z.undefined()])
        .optional(),
      linkedin: z
        .union([z.string().url("LinkedIn must be a valid URL."), z.literal(""), z.undefined()])
        .optional(),
    })
    .optional(),
});

const CreatorResourceSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters."),
  slug: z.string().trim().max(80, "Slug must be at most 80 characters.").optional(),
  type: z.enum(["PDF", "DOCUMENT"]).default("PDF"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFree: z.boolean().default(false),
  price: z.number().int().min(0, "Price must be 0 or greater.").default(0),
  categoryId: z.string().cuid().nullable().optional(),
  fileUrl: z
    .union([z.string().url("File URL must be valid."), z.literal(""), z.null(), z.undefined()])
    .optional(),
  previewUrls: z.array(previewUrlSchema).default([]),
});

const CreatorResourceStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export class CreatorServiceError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super("Creator service error");
    this.status = status;
    this.payload = payload;
  }
}

export type CreatorAnalyticsRange = "7d" | "30d" | "90d" | "all";
export type CreatorResourceSort = "latest" | "downloads" | "revenue";

export interface CreatorAccessState {
  eligible: boolean;
  canCreate: boolean;
  role: UserRole | null;
  resourceCount: number;
  creatorEnabled: boolean;
  creatorStatus: CreatorStatus;
  applicationStatus: CreatorApplicationStatus;
}

export function canAccessCreatorWorkspace(
  access: Pick<CreatorAccessState, "eligible" | "role"> | null | undefined,
) {
  return Boolean(access && (access.eligible || access.role === "ADMIN"));
}

export interface CreatorMetrics {
  totalDownloads: number;
  totalSales: number;
  revenue: number;
  publishedCount: number;
  draftCount: number;
  downloadsLast30Days: number;
  topResources: TopResource[];
}

export interface TopResource {
  id: string;
  title: string;
  slug: string;
  downloadCount: number;
  salesCount: number;
  revenue: number;
}

export interface CreatorOverview {
  totals: {
    totalResources: number;
    publishedResources: number;
    totalDownloads: number;
    totalSales: number;
    grossRevenue: number;
    creatorShare: number;
    platformFees: number;
    freeResources: number;
    paidResources: number;
    downloadsLast30Days: number;
  };
  topResources: TopResource[];
  recentSales: {
    id: string;
    resourceTitle: string;
    resourceSlug: string;
    buyerName: string;
    buyerEmail: string | null;
    amount: number;
    creatorShare: number;
    status: string;
    createdAt: Date;
  }[];
  recentDownloads: {
    id: string;
    resourceTitle: string;
    resourceSlug: string;
    userId: string | null;
    createdAt: Date;
  }[];
}

export interface CreatorManagementResource {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFree: boolean;
  price: number;
  type: string;
  previewUrl: string | null;
  downloadCount: number;
  revenue: number;
  purchases: number;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string; slug: string } | null;
}

export interface CreatorProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  creatorDisplayName: string | null;
  creatorSlug: string | null;
  creatorBio: string | null;
  creatorBanner: string | null;
  creatorStatus: CreatorStatus;
  socialLinks: CreatorSocialLinks;
}

export interface CreatorDashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalResources: number;
}

export interface CreatorDashboardPerformanceItem {
  resourceId: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  isFree: boolean;
  createdAt: Date;
  updatedAt: Date;
  downloadCount: number;
  salesCount: number;
  revenue: number;
  averageRating: number | null;
  visibleReviewCount: number;
}

export interface CreatorBalance {
  totalEarnings: number;
  totalPayouts: number;
  availableBalance: number;
  payouts: {
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }[];
}

export interface CreatorResourceStatusSummary {
  draft: number;
  published: number;
  archived: number;
}

export interface DashboardRecentSale {
  id: string;
  resourceTitle: string;
  resourceSlug: string;
  buyerName: string;
  amount: number;
  creatorShare: number;
  createdAt: Date;
}

export interface CreatorSocialLinks {
  website?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
}

export interface CreatorAnalyticsData {
  range: CreatorAnalyticsRange;
  summary: {
    totalDownloads: number;
    totalSales: number;
    grossRevenue: number;
    creatorShare: number;
    publishedResources: number;
  };
  revenueSeries: { date: string; value: number }[];
  salesSeries: { date: string; value: number }[];
  downloadSeries: { date: string; value: number }[];
  topByRevenue: TopResource[];
  topByDownloads: TopResource[];
  topByPurchases: TopResource[];
  recentSales: {
    id: string;
    resourceTitle: string;
    resourceSlug: string;
    buyerName: string;
    buyerEmail: string | null;
    amount: number;
    creatorShare: number;
    status: string;
    createdAt: Date;
  }[];
  recentDownloads: {
    id: string;
    resourceTitle: string;
    resourceSlug: string;
    userId: string | null;
    createdAt: Date;
  }[];
}

export interface CreatorReviewAnalyticsData {
  overview: {
    averageRating: number | null;
    totalVisibleReviews: number;
    resourcesWithVisibleReviews: number;
  };
  distribution: {
    rating: number;
    count: number;
  }[];
  resources: {
    resourceId: string;
    title: string;
    slug: string;
    status: string;
    price: number;
    isFree: boolean;
    updatedAt: Date;
    averageRating: number | null;
    visibleReviewCount: number;
    lastReviewDate: Date | null;
  }[];
  recentReviews: {
    id: string;
    rating: number;
    body: string | null;
    createdAt: Date;
    reviewerName: string;
    reviewerEmail: string | null;
    resourceTitle: string;
    resourceSlug: string;
  }[];
}

function normalizePreviewUrls(urls: string[]) {
  return urls.filter((url) => url.trim() !== "");
}

function parseSocialLinks(value: unknown): CreatorSocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  const next: CreatorSocialLinks = {};

  for (const key of ["website", "twitter", "instagram", "youtube", "linkedin"] as const) {
    const candidate = source[key];
    if (typeof candidate === "string" && candidate.trim()) {
      next[key] = candidate.trim();
    }
  }

  return next;
}

function buildFieldErrors(error: z.ZodError) {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const rawPath = issue.path.join(".");
    const normalizedPath = rawPath.startsWith("socialLinks.")
      ? rawPath.replace("socialLinks.", "")
      : rawPath;

    if (normalizedPath && !(normalizedPath in fieldErrors)) {
      fieldErrors[normalizedPath] = issue.message;
    }
  }

  return { flattened, fieldErrors };
}

function creatorSlugBase(value: string) {
  return slugify(value).slice(0, 80);
}

function normalizeCreatorSlugInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      normalized: "",
      error: null as string | null,
    };
  }

  const normalized = creatorSlugBase(trimmed);

  if (!normalized) {
    return {
      normalized: trimmed,
      error: "Slug can only contain lowercase letters, numbers, and hyphens.",
    };
  }

  return {
    normalized,
    error: null as string | null,
  };
}

function normalizeCreatorProfileInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      normalized: input,
      fieldErrors: {} as Record<string, string>,
    };
  }

  const normalized = { ...(input as Record<string, unknown>) };
  const fieldErrors: Record<string, string> = {};

  if (typeof normalized.creatorSlug === "string") {
    const slugResult = normalizeCreatorSlugInput(normalized.creatorSlug);
    normalized.creatorSlug = slugResult.normalized;

    if (slugResult.error) {
      fieldErrors.creatorSlug = slugResult.error;
    }
  }

  return { normalized, fieldErrors };
}

function toPointDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeAverageRating(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.round(value * 10) / 10;
}

function startOfRange(range: CreatorAnalyticsRange) {
  const now = new Date();

  if (range === "all") {
    return undefined;
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function sortCreatorResources(
  resources: CreatorManagementResource[],
  sort: CreatorResourceSort,
) {
  return [...resources].sort((a, b) => {
    if (sort === "downloads") {
      return b.downloadCount - a.downloadCount || b.revenue - a.revenue;
    }

    if (sort === "revenue") {
      return b.revenue - a.revenue || b.downloadCount - a.downloadCount;
    }

    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

async function generateUniqueCreatorSlug(base: string, userId: string) {
  let candidate = creatorSlugBase(base);
  let attempt = 0;

  while (true) {
    const existing = await findCreatorSlugOwner(candidate);
    if (!existing || existing.id === userId) {
      return candidate;
    }

    attempt += 1;
    candidate = `${creatorSlugBase(base)}-${attempt}`;
  }
}

async function generateUniqueResourceSlug(base: string, userId: string, excludeId?: string) {
  let candidate = creatorSlugBase(base);
  let attempt = 0;

  while (true) {
    const [creatorOwned, existing] = await Promise.all([
      findCreatorResourceBySlug(userId, candidate),
      findResourceBySlug(candidate),
    ]);

    const creatorOwnedId = creatorOwned?.id;
    const existingId = existing?.id;

    if (
      (!creatorOwnedId || creatorOwnedId === excludeId) &&
      (!existingId || existingId === excludeId)
    ) {
      return candidate;
    }

    attempt += 1;
    candidate = `${creatorSlugBase(base)}-${attempt}`;
  }
}

async function requireCreatorAccess(userId: string) {
  const access = await getCreatorAccessState(userId);

  if (!canAccessCreatorWorkspace(access)) {
    throw new CreatorServiceError(403, {
      error: "Creator access is not enabled for this account.",
    });
  }

  return access;
}

function mapManagementResource(
  resource: Awaited<ReturnType<typeof findCreatorResourcesByUserId>>[number],
): CreatorManagementResource {
  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    status: resource.status,
    isFree: resource.isFree || resource.price === 0,
    price: resource.price,
    type: resource.type,
    previewUrl: resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null,
    downloadCount: resource.resourceStat?.downloads ?? resource.downloadCount,
    revenue: resource.resourceStat?.revenue ?? 0,
    purchases: resource.resourceStat?.purchases ?? resource._count.purchases,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    category: resource.category,
  };
}

function mapTopResource(resource: CreatorManagementResource): TopResource {
  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    downloadCount: resource.downloadCount,
    salesCount: resource.purchases,
    revenue: resource.revenue,
  };
}

const CREATOR_ACCESS_STATE_EMPTY: CreatorAccessState = {
  eligible: false,
  canCreate: false,
  role: null,
  resourceCount: 0,
  creatorEnabled: false,
  creatorStatus: "INACTIVE",
  applicationStatus: "NOT_APPLIED",
};

export const getCreatorAccessState = cache(async function getCreatorAccessState(
  userId: string,
): Promise<CreatorAccessState> {
  // Guard: never allow an empty/undefined userId to reach Prisma.
  // session.user.id can be undefined at runtime despite the TypeScript type.
  if (!userId) {
    return CREATOR_ACCESS_STATE_EMPTY;
  }

  // Cache the raw DB context for 30 seconds per user.
  // React's cache() above deduplicates within a single request; this
  // unstable_cache layer avoids a DB round-trip on every dashboard navigation.
  // TTL is short (30 s) so admin-driven status changes (approve/reject creator
  // application) take effect quickly.  Cache key is userId-scoped — no
  // cross-user data leakage is possible.
  const context = await unstable_cache(
    () => findCreatorAccessContext(userId),
    ["creator-access-context", userId],
    { revalidate: 30 },
  )();

  if (!context) {
    return CREATOR_ACCESS_STATE_EMPTY;
  }

  const resourceCount = context._count.resources;
  const creatorEnabled = context.creatorEnabled;
  const creatorStatus = context.creatorStatus;
  const applicationStatus = context.creatorApplicationStatus;
  const explicitEligible = creatorEnabled && creatorStatus === "ACTIVE";
  const legacyEligible =
    context.role === "INSTRUCTOR" || resourceCount > 0;
  const eligible = explicitEligible || legacyEligible;

  return {
    eligible,
    canCreate: eligible || context.role === "ADMIN",
    role: context.role,
    resourceCount,
    creatorEnabled,
    creatorStatus,
    applicationStatus,
  };
});

export async function isCreatorEligible(userId: string) {
  return (await getCreatorAccessState(userId)).eligible;
}

export async function getCreatorOverview(userId: string): Promise<CreatorOverview> {
  await requireCreatorAccess(userId);

  const [creatorStat, earnings, resourcesRaw, recentSalesRaw, recentDownloadsRaw] =
    await Promise.all([
      rememberJson(
        CACHE_KEYS.creatorStats(userId),
        CACHE_TTLS.stats,
        () => findCreatorStatByCreatorId(userId),
      ),
      findCreatorEarningsTotals(userId),
      findCreatorResourcesByUserId(userId),
      findCreatorRecentSales(userId, 8),
      findCreatorRecentDownloads(userId, 8),
    ]);

  const resources = resourcesRaw.map(mapManagementResource);
  const publishedResources = resources.filter((resource) => resource.status === "PUBLISHED");
  const freeResources = resources.filter((resource) => resource.isFree);
  const paidResources = resources.filter((resource) => !resource.isFree);
  const topResources = [...resources]
    .sort((a, b) => b.revenue - a.revenue || b.downloadCount - a.downloadCount)
    .slice(0, 5)
    .map(mapTopResource);

  return {
    totals: {
      totalResources: resources.length,
      publishedResources: publishedResources.length,
      totalDownloads: creatorStat?.totalDownloads ?? 0,
      totalSales: creatorStat?.totalSales ?? 0,
      grossRevenue: creatorStat?.totalRevenue ?? earnings.grossRevenue,
      creatorShare: earnings.creatorShare,
      platformFees: earnings.platformFees,
      freeResources: freeResources.length,
      paidResources: paidResources.length,
      downloadsLast30Days: creatorStat?.last30dDownloads ?? 0,
    },
    topResources,
    recentSales: recentSalesRaw.map((sale) => ({
      id: sale.id,
      resourceTitle: sale.resource.title,
      resourceSlug: sale.resource.slug,
      buyerName: sale.purchase.user.name ?? sale.purchase.user.email ?? "Anonymous buyer",
      buyerEmail: sale.purchase.user.email ?? null,
      amount: sale.amount,
      creatorShare: sale.creatorShare,
      status: sale.purchase.status,
      createdAt: sale.createdAt,
    })),
    recentDownloads: recentDownloadsRaw.map((download) => ({
      id: download.id,
      resourceTitle: download.resource.title,
      resourceSlug: download.resource.slug,
      userId: download.userId ?? null,
      createdAt: download.createdAt,
    })),
  };
}

export async function getCreatorResources(userId: string): Promise<CreatorManagementResource[]> {
  await requireCreatorAccess(userId);
  const resources = await findCreatorResourcesByUserId(userId);
  return sortCreatorResources(resources.map(mapManagementResource), "latest");
}

export async function getCreatorDashboardStats(
  userId: string,
): Promise<CreatorDashboardStats> {
  await requireCreatorAccess(userId);

  const stats = await getCreatorStats(userId);

  return {
    totalRevenue: stats.totalRevenue ?? 0,
    totalSales: stats.totalSales ?? 0,
    totalResources: stats.totalResources ?? 0,
  };
}

export async function getCreatorDashboardPerformance(
  userId: string,
): Promise<CreatorDashboardPerformanceItem[]> {
  await requireCreatorAccess(userId);

  const performance = await getCreatorResourcePerformance(userId);

  return performance.map((resource) => ({
    resourceId: resource.resourceId,
    title: resource.title,
    slug: resource.slug,
    status: resource.status,
    price: resource.price,
    isFree: resource.isFree,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    downloadCount: resource.downloadCount ?? 0,
    salesCount: resource.salesCount ?? 0,
    revenue: resource.revenue ?? 0,
    averageRating: normalizeAverageRating(resource.averageRating),
    visibleReviewCount: resource.visibleReviewCount ?? 0,
  }));
}

export async function getCreatorRecentSalesForDashboard(
  userId: string,
): Promise<DashboardRecentSale[]> {
  await requireCreatorAccess(userId);

  const raw = await findCreatorRecentSales(userId, 5);

  return raw
    .filter((sale) => sale.purchase.status === "COMPLETED")
    .map((sale) => ({
      id: sale.id,
      resourceTitle: sale.resource.title,
      resourceSlug: sale.resource.slug,
      buyerName:
        sale.purchase.user.name ??
        sale.purchase.user.email ??
        "New customer",
      amount: sale.amount,
      creatorShare: sale.creatorShare,
      createdAt: sale.createdAt,
    }));
}

export async function getCreatorBalance(userId: string): Promise<CreatorBalance> {
  await requireCreatorAccess(userId);

  const [stats, payouts, totalPayouts] = await Promise.all([
    getCreatorStats(userId),
    getCreatorPayouts(userId),
    sumCreatorPayouts(userId),
  ]);

  const totalEarnings = stats.totalRevenue ?? 0;
  const normalizedPayouts = totalPayouts ?? 0;

  return {
    totalEarnings,
    totalPayouts: normalizedPayouts,
    availableBalance: totalEarnings - normalizedPayouts,
    payouts: payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      createdAt: payout.createdAt,
    })),
  };
}

export async function getCreatorResourceStatusSummary(
  userId: string,
): Promise<CreatorResourceStatusSummary> {
  await requireCreatorAccess(userId);

  const summary = await findCreatorResourceStatusSummary(userId);

  return {
    draft: summary.draft ?? 0,
    published: summary.published ?? 0,
    archived: summary.archived ?? 0,
  };
}

export type CreatorResource = Awaited<ReturnType<typeof getCreatorResources>>[number];

export interface CreatorDraft {
  id: string;
  title: string;
  description: string;
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  updatedAt: Date;
  status: string;
}

/**
 * Returns the most recently updated DRAFT resource owned by this creator,
 * or null if none exist. Used to power the "continue editing" CTA.
 */
export async function getCreatorMostRecentDraft(userId: string): Promise<CreatorDraft | null> {
  await requireCreatorAccess(userId);
  return findMostRecentCreatorDraft(userId);
}

export async function getCreatorResourceManagementData(
  userId: string,
  input: CreatorResourceFilters & { sort?: CreatorResourceSort } = {},
) {
  const access = await requireCreatorAccess(userId);
  const [categories, resourcesRaw] = await Promise.all([
    findCreatorCategories(),
    findCreatorResourcesByUserId(userId, input),
  ]);

  const resources = sortCreatorResources(
    resourcesRaw.map(mapManagementResource),
    input.sort ?? "latest",
  );

  return {
    access,
    categories,
    resources,
  };
}

export async function getCreatorResourceFormData(userId: string) {
  const access = await requireCreatorAccess(userId);
  const categories = await findCreatorCategories();

  return {
    access,
    categories,
  };
}

export async function getCreatorMetrics(userId: string): Promise<CreatorMetrics> {
  const overview = await getCreatorOverview(userId);

  return {
    totalDownloads: overview.totals.totalDownloads,
    totalSales: overview.totals.totalSales,
    revenue: overview.totals.grossRevenue,
    publishedCount: overview.totals.publishedResources,
    draftCount: overview.totals.totalResources - overview.totals.publishedResources,
    downloadsLast30Days: overview.totals.downloadsLast30Days,
    topResources: overview.topResources,
  };
}

export async function getCreatorAnalytics(
  userId: string,
  range: CreatorAnalyticsRange = "30d",
): Promise<CreatorAnalyticsData> {
  await requireCreatorAccess(userId);

  const since = startOfRange(range);
  const [overview, revenueRows, downloadRows, resourcesRaw, recentSalesRaw, recentDownloadsRaw] =
    await Promise.all([
    getCreatorOverview(userId),
    findCreatorRevenueSeries(userId, since),
    findCreatorDownloadSeries(userId, since),
    findCreatorResourcesByUserId(userId),
    findCreatorRecentSales(userId, 6),
    findCreatorRecentDownloads(userId, 6),
  ]);

  const resources = resourcesRaw.map(mapManagementResource);

  return {
    range,
    summary: {
      totalDownloads: overview.totals.totalDownloads,
      totalSales: overview.totals.totalSales,
      grossRevenue: overview.totals.grossRevenue,
      creatorShare: overview.totals.creatorShare,
      publishedResources: overview.totals.publishedResources,
    },
    revenueSeries: revenueRows.map((row) => ({
      date: toPointDate(row.date),
      value: row.amount,
    })),
    salesSeries: revenueRows.map((row) => ({
      date: toPointDate(row.date),
      value: row.count,
    })),
    downloadSeries: downloadRows.map((row) => ({
      date: toPointDate(row.date),
      value: row.count,
    })),
    topByRevenue: [...resources]
      .sort((a, b) => b.revenue - a.revenue || b.downloadCount - a.downloadCount)
      .slice(0, 5)
      .map(mapTopResource),
    topByDownloads: [...resources]
      .sort((a, b) => b.downloadCount - a.downloadCount || b.revenue - a.revenue)
      .slice(0, 5)
      .map(mapTopResource),
    topByPurchases: [...resources]
      .sort((a, b) => b.purchases - a.purchases || b.revenue - a.revenue)
      .slice(0, 5)
      .map(mapTopResource),
    recentSales: recentSalesRaw.map((sale) => ({
      id: sale.id,
      resourceTitle: sale.resource.title,
      resourceSlug: sale.resource.slug,
      buyerName: sale.purchase.user.name ?? sale.purchase.user.email ?? "Anonymous buyer",
      buyerEmail: sale.purchase.user.email ?? null,
      amount: sale.amount,
      creatorShare: sale.creatorShare,
      status: sale.purchase.status,
      createdAt: sale.createdAt,
    })),
    recentDownloads: recentDownloadsRaw.map((download) => ({
      id: download.id,
      resourceTitle: download.resource.title,
      resourceSlug: download.resource.slug,
      userId: download.userId ?? null,
      createdAt: download.createdAt,
    })),
  };
}

export async function getCreatorReviewAnalytics(
  userId: string,
): Promise<CreatorReviewAnalyticsData> {
  await requireCreatorAccess(userId);

  const [overview, resources, recentReviews, distribution] = await Promise.all([
    getCreatorReviewOverview(userId),
    getCreatorResourceReviewSummaries(userId),
    findCreatorRecentVisibleReviews(userId, 8),
    getCreatorVisibleRatingDistribution(userId),
  ]);

  return {
    overview: {
      averageRating: normalizeAverageRating(overview.averageRating),
      totalVisibleReviews: overview.totalVisibleReviews ?? 0,
      resourcesWithVisibleReviews: overview.resourcesWithVisibleReviews ?? 0,
    },
    distribution: distribution.map((row) => ({
      rating: row.rating,
      count: row.count,
    })),
    resources: resources.map((resource) => ({
      resourceId: resource.resourceId,
      title: resource.title,
      slug: resource.slug,
      status: resource.status,
      price: resource.price,
      isFree: resource.isFree,
      updatedAt: resource.updatedAt,
      averageRating: normalizeAverageRating(resource.averageRating),
      visibleReviewCount: resource.visibleReviewCount ?? 0,
      lastReviewDate: resource.lastReviewDate ?? null,
    })),
    recentReviews: recentReviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body ?? null,
      createdAt: review.createdAt,
      reviewerName: review.user.name ?? review.user.email ?? "Anonymous buyer",
      reviewerEmail: review.user.email ?? null,
      resourceTitle: review.resource.title,
      resourceSlug: review.resource.slug,
    })),
  };
}

export async function getCreatorSales(userId: string) {
  await requireCreatorAccess(userId);

  const [sales, earnings] = await Promise.all([
    findCreatorSales(userId),
    findCreatorEarningsTotals(userId),
  ]);

  return {
    totals: earnings,
    sales: sales.map((sale) => ({
      id: sale.id,
      resourceId: sale.resource.id,
      resourceTitle: sale.resource.title,
      resourceSlug: sale.resource.slug,
      buyerName: sale.purchase.user.name ?? sale.purchase.user.email ?? "Anonymous buyer",
      buyerEmail: sale.purchase.user.email ?? null,
      amount: sale.amount,
      creatorShare: sale.creatorShare,
      platformFee: sale.platformFee,
      status: sale.purchase.status,
      createdAt: sale.createdAt,
    })),
  };
}

export async function getCreatorProfile(userId: string): Promise<CreatorProfile | null> {
  const profile = await findCreatorProfileByUserId(userId);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    image: profile.image,
    creatorDisplayName: profile.creatorDisplayName,
    creatorSlug: profile.creatorSlug,
    creatorBio: profile.creatorBio,
    creatorBanner: profile.creatorBanner,
    creatorStatus: profile.creatorStatus,
    socialLinks: parseSocialLinks(profile.creatorSocialLinks),
  };
}

export async function activateCreatorAccess(userId: string) {
  await enableCreatorAccessRecord(userId);
  return getCreatorAccessState(userId);
}

// ── Creator Application Flow ──────────────────────────────────────────────────

export interface CreatorApplicationFormInput {
  creatorDisplayName: string;
  creatorSlug: string;
  creatorBio: string;
}

const CreatorApplicationSchema = z.object({
  creatorDisplayName: z.string().min(2, "Display name must be at least 2 characters.").max(64),
  creatorSlug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  creatorBio: z.string().max(500, "Bio must be 500 characters or fewer.").optional(),
});

export async function submitCreatorApplication(userId: string, input: unknown) {
  const state = await getCreatorAccessState(userId);

  if (state.applicationStatus === "PENDING") {
    throw new CreatorServiceError(409, { error: "Your application is already under review." });
  }
  if (state.applicationStatus === "APPROVED" || canAccessCreatorWorkspace(state)) {
    throw new CreatorServiceError(409, { error: "You already have creator access." });
  }

  const parsed = CreatorApplicationSchema.safeParse(input);
  if (!parsed.success) {
    const { flattened, fieldErrors } = buildFieldErrors(parsed.error);
    throw new CreatorServiceError(400, {
      error: "Validation failed.",
      fields: fieldErrors,
      errors: { fieldErrors: flattened.fieldErrors, formErrors: flattened.formErrors },
    });
  }

  const slug = parsed.data.creatorSlug;
  const existing = await findCreatorSlugOwner(slug);
  if (existing && existing.id !== userId) {
    throw new CreatorServiceError(409, {
      error: "That creator slug is already in use.",
      fields: { creatorSlug: "That creator slug is already in use." },
    });
  }

  await submitCreatorApplicationRecord(userId, {
    creatorDisplayName: parsed.data.creatorDisplayName.trim(),
    creatorSlug: slug,
    creatorBio: parsed.data.creatorBio?.trim() ?? "",
  });
}

export async function approveCreatorApplication(userId: string) {
  const record = await findCreatorApplicationRecord(userId);
  if (!record) throw new CreatorServiceError(404, { error: "No application found for this user." });
  if (record.creatorApplicationStatus !== "PENDING") {
    throw new CreatorServiceError(409, { error: "Application is not in PENDING state." });
  }
  await approveCreatorApplicationRecord(userId);
}

export async function rejectCreatorApplication(userId: string, reason: string) {
  const record = await findCreatorApplicationRecord(userId);
  if (!record) throw new CreatorServiceError(404, { error: "No application found for this user." });
  if (record.creatorApplicationStatus !== "PENDING") {
    throw new CreatorServiceError(409, { error: "Application is not in PENDING state." });
  }
  await rejectCreatorApplicationRecord(userId, reason);
}

export async function getPendingCreatorApplications() {
  return findPendingCreatorApplications();
}

export async function getAllCreatorApplications() {
  return findAllCreatorApplications();
}

export async function updateCreatorProfile(userId: string, input: unknown) {
  await requireCreatorAccess(userId);

  const { normalized, fieldErrors: normalizedFieldErrors } =
    normalizeCreatorProfileInput(input);
  const parsed = CreatorProfileSchema.safeParse(normalized);

  if (!parsed.success || Object.keys(normalizedFieldErrors).length > 0) {
    const { flattened, fieldErrors } = parsed.success
      ? { flattened: null, fieldErrors: {} as Record<string, string> }
      : buildFieldErrors(parsed.error);

    const mergedFieldErrors = {
      ...fieldErrors,
      ...normalizedFieldErrors,
    };

    throw new CreatorServiceError(400, {
      error: "Validation failed.",
      fields: mergedFieldErrors,
      errors: {
        fieldErrors: flattened?.fieldErrors ?? {},
        formErrors: flattened?.formErrors ?? [],
      },
    });
  }

  const displayName = parsed.data.creatorDisplayName?.trim() || null;
  const desiredSlug =
    parsed.data.creatorSlug && parsed.data.creatorSlug !== ""
      ? parsed.data.creatorSlug
      : displayName
        ? await generateUniqueCreatorSlug(displayName, userId)
        : null;

  if (desiredSlug) {
    const existing = await findCreatorSlugOwner(desiredSlug);
    if (existing && existing.id !== userId) {
      throw new CreatorServiceError(409, {
        error: "That creator slug is already in use.",
        fields: { creatorSlug: "That creator slug is already in use." },
      });
    }
  }

  const socialLinks = parsed.data.socialLinks ?? {};

  return updateCreatorProfileRecord(userId, {
    creatorDisplayName: displayName,
    creatorSlug: desiredSlug,
    creatorBio: parsed.data.creatorBio?.trim() || null,
    creatorBanner:
      typeof parsed.data.creatorBanner === "string" && parsed.data.creatorBanner.trim()
        ? parsed.data.creatorBanner.trim()
        : null,
    creatorStatus: parsed.data.creatorStatus,
    creatorSocialLinks: socialLinks,
  });
}

export async function getCreatorPublicProfile(slug: string) {
  return unstable_cache(
    async function _getCreatorPublicProfile() {
      logPerformanceEvent("cache_execute:getCreatorPublicProfile");
      const creator =
        (await findCreatorProfileBySlug(slug)) ??
        (await findCreatorPublicProfileById(slug));

      if (!creator) {
        return null;
      }

      const creatorStat = await findCreatorStatByCreatorId(creator.id);
      const statusBadge =
        creatorStat &&
        (creatorStat.last7dRevenue > 0 ||
          creatorStat.last30dDownloads > 0 ||
          creatorStat.totalSales > 0)
          ? creatorStat.last7dRevenue > 0 &&
              (creatorStat.last30dDownloads >= 100 ||
                creatorStat.totalSales >= 25)
            ? {
                label: "Top creator",
                description:
                  "Leading recent creator performance across revenue and learner demand.",
              }
            : creatorStat.last30dDownloads >= 50 || creatorStat.totalSales >= 10
              ? {
                  label: "Rising creator",
                  description:
                    "Building momentum quickly with strong recent learner activity.",
                }
              : null
          : null;

      return {
        id: creator.id,
        displayName: creator.creatorDisplayName ?? creator.name ?? "Creator",
        image: creator.image,
        banner: creator.creatorBanner,
        bio: creator.creatorBio,
        slug: creator.creatorSlug,
        status: creator.creatorStatus,
        socialLinks: parseSocialLinks(creator.creatorSocialLinks),
        resourceCount: creator._count.resources,
        statusBadge,
        momentum: creatorStat
          ? {
              totalSales: creatorStat.totalSales,
              last30dDownloads: creatorStat.last30dDownloads,
              last7dRevenue: creatorStat.last7dRevenue,
            }
          : null,
        resources: creator.resources.map((resource) => ({
          ...resource,
          previewUrl: resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null,
        })),
      };
    },
    ["creator-public-profile", slug],
    {
      revalidate: CACHE_TTLS.publicPage,
      tags: [CACHE_TAGS.creatorPublic, getCreatorPublicCacheTag(slug)],
    },
  )();
}

export async function getCreatorResourceForEdit(userId: string, resourceId: string) {
  await requireCreatorAccess(userId);

  const resource = await findCreatorResourceById(userId, resourceId);
  if (!resource) {
    return null;
  }

  return {
    ...resource,
    previewUrls: resource.previews.map((preview) => preview.imageUrl),
  };
}

export async function getCreatorResourcePublicCacheTarget(
  userId: string,
  resourceId: string,
) {
  await requireCreatorAccess(userId);

  const resource = await findCreatorResourceById(userId, resourceId);
  if (!resource) {
    return null;
  }

  return {
    id: resource.id,
    slug: resource.slug,
    categoryId: resource.categoryId,
    categorySlug: resource.category?.slug ?? null,
  };
}

export async function createCreatorResource(userId: string, input: unknown) {
  const access = await requireCreatorAccess(userId);

  if (!access.canCreate) {
    throw new CreatorServiceError(403, {
      error: "This account can manage creator resources, but it cannot create new resources.",
    });
  }

  const parsed = CreatorResourceSchema.safeParse(input);

  if (!parsed.success) {
    const { flattened, fieldErrors } = buildFieldErrors(parsed.error);
    throw new CreatorServiceError(400, {
      error: "Validation failed.",
      fields: fieldErrors,
      errors: {
        fieldErrors: flattened.fieldErrors,
        formErrors: flattened.formErrors,
      },
    });
  }

  const previewUrls = normalizePreviewUrls(parsed.data.previewUrls);
  const [slug, existingSummary] = await Promise.all([
    generateUniqueResourceSlug(
      parsed.data.slug?.trim() || parsed.data.title,
      userId,
    ),
    findCreatorResourceStatusSummary(userId),
  ]);

  const isFirstResource =
    (existingSummary.draft ?? 0) +
      (existingSummary.published ?? 0) +
      (existingSummary.archived ?? 0) ===
    0;

  const resource = await createCreatorResourceRecord({
    userId,
    title: parsed.data.title.trim(),
    slug,
    description: parsed.data.description.trim(),
    type: parsed.data.type,
    status: parsed.data.status,
    isFree: parsed.data.isFree || parsed.data.price === 0,
    price: parsed.data.isFree ? 0 : parsed.data.price,
    categoryId: parsed.data.categoryId ?? null,
    fileUrl:
      typeof parsed.data.fileUrl === "string" && parsed.data.fileUrl.trim()
        ? parsed.data.fileUrl.trim()
        : null,
    previewUrl: previewUrls[0] ?? null,
    previewUrls,
  });

  if (isFirstResource) {
    void logActivity({
      userId,
      action: "creator_first_resource_draft_created",
      entity: "resource",
      entityId: resource.id,
      metadata: { status: resource.status, title: resource.title },
    });
  }

  return resource;
}

export async function updateCreatorResource(userId: string, resourceId: string, input: unknown) {
  await requireCreatorAccess(userId);

  const existing = await findCreatorResourceById(userId, resourceId);
  if (!existing) {
    throw new CreatorServiceError(404, {
      error: "Resource not found.",
    });
  }

  const parsed = CreatorResourceSchema.safeParse(input);

  if (!parsed.success) {
    const { flattened, fieldErrors } = buildFieldErrors(parsed.error);
    throw new CreatorServiceError(400, {
      error: "Validation failed.",
      fields: fieldErrors,
      errors: {
        fieldErrors: flattened.fieldErrors,
        formErrors: flattened.formErrors,
      },
    });
  }

  const previewUrls = normalizePreviewUrls(parsed.data.previewUrls);
  const slug = await generateUniqueResourceSlug(
    parsed.data.slug?.trim() || parsed.data.title,
    userId,
    resourceId,
  );

  const updated = await updateCreatorResourceRecord(userId, resourceId, {
    title: parsed.data.title.trim(),
    slug,
    description: parsed.data.description.trim(),
    type: parsed.data.type,
    status: parsed.data.status,
    isFree: parsed.data.isFree || parsed.data.price === 0,
    price: parsed.data.isFree ? 0 : parsed.data.price,
    categoryId: parsed.data.categoryId ?? null,
    fileUrl:
      typeof parsed.data.fileUrl === "string" && parsed.data.fileUrl.trim()
        ? parsed.data.fileUrl.trim()
        : null,
    previewUrl: previewUrls[0] ?? null,
    previewUrls,
  });

  if (!updated) {
    throw new CreatorServiceError(404, {
      error: "Resource not found.",
    });
  }

  return updated;
}

async function ensureCreatorResourcePublishable(userId: string, resourceId: string) {
  const resource = await findCreatorResourceById(userId, resourceId);

  if (!resource) {
    throw new CreatorServiceError(404, {
      error: "Resource not found.",
    });
  }

  const missingFields: string[] = [];

  if (!resource.title.trim() || resource.title.trim().length < 3) {
    missingFields.push("title");
  }

  if (!resource.description.trim() || resource.description.trim().length < 10) {
    missingFields.push("description");
  }

  if (!resource.slug.trim()) {
    missingFields.push("slug");
  }

  if (!resource.fileUrl?.trim()) {
    missingFields.push("file");
  }

  if (missingFields.length > 0) {
    throw new CreatorServiceError(400, {
      error: "Complete the required fields before publishing this resource.",
      fields: missingFields,
    });
  }

  return resource;
}

async function applyCreatorResourceStatus(userId: string, resourceId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const result = await updateCreatorResourceStatusRecord(userId, resourceId, status);

  if (result.count === 0) {
    throw new CreatorServiceError(404, {
      error: "Resource not found.",
    });
  }

  return { success: true };
}

export async function publishCreatorResource(userId: string, resourceId: string) {
  await requireCreatorAccess(userId);
  await ensureCreatorResourcePublishable(userId, resourceId);

  const summaryBefore = await findCreatorResourceStatusSummary(userId);
  const isFirstPublish = (summaryBefore.published ?? 0) === 0;

  const result = await applyCreatorResourceStatus(userId, resourceId, "PUBLISHED");

  if (isFirstPublish) {
    void logActivity({
      userId,
      action: "creator_first_resource_published",
      entity: "resource",
      entityId: resourceId,
    });
  }

  return result;
}

export async function unpublishCreatorResource(userId: string, resourceId: string) {
  await requireCreatorAccess(userId);
  return applyCreatorResourceStatus(userId, resourceId, "DRAFT");
}

export async function archiveCreatorResource(userId: string, resourceId: string) {
  await requireCreatorAccess(userId);
  return applyCreatorResourceStatus(userId, resourceId, "ARCHIVED");
}

export async function updateCreatorResourceStatus(userId: string, resourceId: string, input: unknown) {
  const parsed = CreatorResourceStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new CreatorServiceError(400, {
      error: "Validation failed.",
    });
  }

  switch (parsed.data.status) {
    case "PUBLISHED":
      return publishCreatorResource(userId, resourceId);
    case "ARCHIVED":
      return archiveCreatorResource(userId, resourceId);
    default:
      return unpublishCreatorResource(userId, resourceId);
  }
}
