import type { CreatorStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { CACHE_KEYS, CACHE_TTLS, rememberJson } from "@/lib/cache";
import { slugify } from "@/lib/utils";
import { findCreatorStatByCreatorId } from "@/repositories/analytics/analytics.repository";
import {
  createCreatorResourceRecord,
  enableCreatorAccessRecord,
  findCreatorAccessContext,
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
  findCreatorResourcesByUserId,
  findCreatorRevenueSeries,
  findCreatorSales,
  findCreatorSlugOwner,
  updateCreatorProfileRecord,
  updateCreatorResourceRecord,
  updateCreatorResourceStatusRecord,
  type CreatorResourceFilters,
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

  if (!access.eligible) {
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

export async function getCreatorAccessState(userId: string): Promise<CreatorAccessState> {
  const context = await findCreatorAccessContext(userId);

  if (!context) {
    return {
      eligible: false,
      canCreate: false,
      role: null,
      resourceCount: 0,
      creatorEnabled: false,
      creatorStatus: "INACTIVE",
    };
  }

  const resourceCount = context._count.resources;
  const creatorEnabled = context.creatorEnabled;
  const creatorStatus = context.creatorStatus;
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
  };
}

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

export type CreatorResource = Awaited<ReturnType<typeof getCreatorResources>>[number];

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
  const creator = (await findCreatorProfileBySlug(slug)) ?? (await findCreatorPublicProfileById(slug));

  if (!creator) {
    return null;
  }

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
    resources: creator.resources.map((resource) => ({
      ...resource,
      previewUrl: resource.previewUrl ?? resource.previews[0]?.imageUrl ?? null,
    })),
  };
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
  const slug = await generateUniqueResourceSlug(
    parsed.data.slug?.trim() || parsed.data.title,
    userId,
  );

  return createCreatorResourceRecord({
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

export async function updateCreatorResourceStatus(userId: string, resourceId: string, input: unknown) {
  await requireCreatorAccess(userId);

  const parsed = CreatorResourceStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new CreatorServiceError(400, {
      error: "Validation failed.",
    });
  }

  const result = await updateCreatorResourceStatusRecord(userId, resourceId, parsed.data.status);

  if (result.count === 0) {
    throw new CreatorServiceError(404, {
      error: "Resource not found.",
    });
  }

  return { success: true };
}
