import { Prisma } from "@prisma/client";
import {
  SEARCH_MATCH_REASON_LABELS,
  SEARCH_RELEVANCE_WEIGHTS,
} from "@/config/search";
import { buildSearchQueryIntent } from "@/lib/search/query-intent";
import { prisma } from "@/lib/prisma";
import { LISTED_RESOURCE_WHERE, PUBLIC_RESOURCE_WHERE } from "@/lib/query/resourceFilters";
import { FIRST_PREVIEW_IMAGE_SELECT, RESOURCE_CARD_SELECT } from "@/lib/query/resourceSelect";

export interface FindPublicResourcesParams {
  page: number;
  pageSize: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  isFree?: boolean;
}

export interface CreateAdminResourceRecordInput {
  title: string;
  slug: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  categoryId: string | null;
  featured: boolean;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  license?: "PERSONAL_USE" | "COMMERCIAL_USE" | "EXTENDED_LICENSE" | null;
  visibility?: "PUBLIC" | "UNLISTED" | null;
  authorId: string;
  tagIds: string[];
  previewUrls: string[];
  previewUrl: string | null;
}

export interface BulkAdminResourceRecordInput extends CreateAdminResourceRecordInput {
  row: number;
}

export interface UpdateAdminResourceRecordInput {
  title?: string;
  description?: string;
  slug?: string;
  type?: "PDF" | "DOCUMENT";
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree: boolean;
  price: number;
  fileUrl?: string | null;
  categoryId?: string | null;
  featured?: boolean;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  license?: "PERSONAL_USE" | "COMMERCIAL_USE" | "EXTENDED_LICENSE" | null;
  visibility?: "PUBLIC" | "UNLISTED" | null;
  authorId?: string;
  previewUrl?: string | null;
  tagIds?: string[];
  previewUrls?: string[];
}

const ADMIN_RESOURCE_LIST_INCLUDE = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  _count: { select: { purchases: true } },
} as const;

const ADMIN_RESOURCE_PAGE_SELECT = {
  id: true,
  title: true,
  slug: true,
  previewUrl: true,
  isFree: true,
  price: true,
  status: true,
  createdAt: true,
  downloadCount: true,
  author: { select: { name: true, email: true } },
  category: { select: { id: true, name: true } },
} as const;

const OWNED_RESOURCE_CREATE_INCLUDE = {
  author: { select: { id: true, name: true } },
  category: true,
  tags: { include: { tag: true } },
} as const;

const CREATOR_DASHBOARD_RESOURCE_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  isFree: true,
  price: true,
  previewUrl: true,
  createdAt: true,
  updatedAt: true,
  previews: {
    take: 1,
    orderBy: { order: "asc" as const },
    select: { imageUrl: true },
  },
} as const;

const RESOURCE_DETAIL_SHELL_SELECT = {
  id: true,
  title: true,
  slug: true,
  type: true,
  status: true,
  featured: true,
  level: true,
  isFree: true,
  price: true,
  downloadCount: true,
  categoryId: true,
  fileUrl: true,
  fileKey: true,
  previewUrl: true,
  author: {
    select: {
      id: true,
      name: true,
      creatorSlug: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  previews: {
    take: 5,
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      imageUrl: true,
      order: true,
    },
  },
  resourceStat: {
    select: {
      downloads: true,
      purchases: true,
    },
  },
} as const;

const RESOURCE_DETAIL_METADATA_SELECT = {
  title: true,
  description: true,
} as const;

const RESOURCE_DETAIL_PURCHASE_META_SELECT = {
  mimeType: true,
  fileSize: true,
  updatedAt: true,
  resourceStat: {
    select: {
      last30dDownloads: true,
      last30dPurchases: true,
    },
  },
} as const;

const RESOURCE_DETAIL_BODY_CONTENT_SELECT = {
  description: true,
  fileName: true,
  fileSize: true,
  fileUrl: true,
  fileKey: true,
  type: true,
} as const;

const RESOURCE_DETAIL_FOOTER_CONTENT_SELECT = {
  author: {
    select: {
      id: true,
      name: true,
      image: true,
      creatorSlug: true,
    },
  },
  tags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

const SEARCH_RESOURCE_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  isFree: true,
  downloadCount: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { name: true } },
  ...FIRST_PREVIEW_IMAGE_SELECT,
  _count: { select: { purchases: true, reviews: true } },
} as const;

export interface RankedSearchResourceRow {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  featured: boolean;
  downloadCount: number;
  createdAt: Date;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  previewImageUrl: string | null;
  purchaseCount: number;
  reviewCount: number;
  matchReason: string | null;
  score: number;
  totalCount?: number;
}

export interface RankedSearchSuggestionRow {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  authorName: string | null;
  categoryName: string | null;
  previewImageUrl: string | null;
  matchReason: string | null;
}

export interface SearchRecoveryTaxonomyMatch {
  name: string;
  slug: string;
  resourceCount: number;
}

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, " ");
}

function buildOrSql(clauses: Prisma.Sql[]) {
  if (clauses.length === 0) {
    return Prisma.sql`FALSE`;
  }

  return Prisma.sql`(${Prisma.join(clauses, " OR ")})`;
}

function buildSumSql(clauses: Prisma.Sql[]) {
  if (clauses.length === 0) {
    return Prisma.sql`0`;
  }

  return Prisma.sql`(${Prisma.join(clauses, " + ")})`;
}

function buildContainsMatchSql(fieldSql: Prisma.Sql, variants: string[]) {
  return buildOrSql(
    variants.map((variant) => Prisma.sql`${fieldSql} ILIKE ${`%${variant}%`}`),
  );
}

function buildBaseTokenFieldMatchSql(variants: string[]) {
  return buildOrSql([
    buildContainsMatchSql(Prisma.sql`r."title"`, variants),
    buildContainsMatchSql(Prisma.sql`r."slug"`, variants),
    buildContainsMatchSql(Prisma.sql`r."description"`, variants),
    buildContainsMatchSql(Prisma.sql`COALESCE(c."name", '')`, variants),
    buildContainsMatchSql(Prisma.sql`COALESCE(c."slug", '')`, variants),
    buildContainsMatchSql(Prisma.sql`COALESCE(u."name", '')`, variants),
  ]);
}

function buildTagVariantExistsSql(variants: string[]) {
  return Prisma.sql`EXISTS (
    SELECT 1
    FROM "ResourceTag" rt_term
    INNER JOIN "Tag" t_term
      ON t_term."id" = rt_term."tagId"
    WHERE rt_term."resourceId" = r."id"
      AND ${buildOrSql([
        buildContainsMatchSql(Prisma.sql`t_term."name"`, variants),
        buildContainsMatchSql(Prisma.sql`t_term."slug"`, variants),
      ])}
  )`;
}

function buildTokenFieldMatchSql(variants: string[]) {
  return buildOrSql([
    buildBaseTokenFieldMatchSql(variants),
    buildTagVariantExistsSql(variants),
  ]);
}

function buildTagSearchExistsSql(params: {
  query: string;
  queryLower: string;
  prefixPattern: string;
  containsPattern: string;
  threshold: number;
}) {
  return Prisma.sql`EXISTS (
    SELECT 1
    FROM "ResourceTag" rt_filter
    INNER JOIN "Tag" t_filter
      ON t_filter."id" = rt_filter."tagId"
    WHERE rt_filter."resourceId" = r."id"
      AND (
        t_filter."name" ILIKE ${params.containsPattern}
        OR t_filter."slug" ILIKE ${params.containsPattern}
        OR lower(t_filter."name") = ${params.queryLower}
        OR lower(t_filter."slug") = ${params.queryLower}
        OR lower(t_filter."name") LIKE ${params.prefixPattern}
        OR lower(t_filter."slug") LIKE ${params.prefixPattern}
        OR GREATEST(
          similarity(t_filter."name", ${params.query}),
          similarity(t_filter."slug", ${params.query})
        ) >= ${params.threshold}
      )
  )`;
}

function getSearchSimilarityThreshold(query: string) {
  const length = normalizeSearchQuery(query).length;

  if (length <= 2) {
    return 0.08;
  }

  if (length <= 4) {
    return 0.16;
  }

  return 0.22;
}

function getSearchOrderBySql(sort?: string) {
  switch (sort) {
    case "newest":
      return `"matchedTokenCount" DESC, "createdAt" DESC, "score" DESC, "trendingScore" DESC, "purchaseCount" DESC`;
    case "downloads":
    case "popular":
      return `"matchedTokenCount" DESC, "rankedDownloads" DESC, "purchaseCount" DESC, "score" DESC, "createdAt" DESC`;
    case "price_asc":
      return `"matchedTokenCount" DESC, "price" ASC, "score" DESC, "trendingScore" DESC, "createdAt" DESC`;
    case "price_desc":
      return `"matchedTokenCount" DESC, "price" DESC, "score" DESC, "trendingScore" DESC, "createdAt" DESC`;
    case "trending":
      return `"matchedTokenCount" DESC, "trendingScore" DESC, "purchaseCount" DESC, "rankedDownloads" DESC, "score" DESC, "createdAt" DESC`;
    case "recommended":
    case "relevance":
    default:
      return `"matchedTokenCount" DESC, "score" DESC, "trendingScore" DESC, "purchaseCount" DESC, "rankedDownloads" DESC, "createdAt" DESC`;
  }
}

function buildRankedSearchMatchedResourcesSql(params: {
  query: string;
  category?: string;
  sort?: string;
}) {
  const intent = buildSearchQueryIntent(params.query);
  const query = intent.normalizedQuery;
  const queryLower = intent.loweredQuery;
  const containsPattern = `%${query}%`;
  const prefixPattern = `${queryLower}%`;
  const threshold = getSearchSimilarityThreshold(query);
  const orderBy = getSearchOrderBySql(params.sort);
  const weights = SEARCH_RELEVANCE_WEIGHTS;
  const labels = SEARCH_MATCH_REASON_LABELS;
  const tagSearchExistsSql = buildTagSearchExistsSql({
    query,
    queryLower,
    prefixPattern,
    containsPattern,
    threshold,
  });
  const tokenMatchScoreSql =
    intent.tokenGroups.length > 0
      ? buildSumSql(
          intent.tokenGroups.map((variants) =>
            Prisma.sql`CASE WHEN ${buildTokenFieldMatchSql(variants)} THEN 1 ELSE 0 END`,
          ),
        )
      : Prisma.sql`0`;
  const tokenAnyMatchSql =
    intent.tokenGroups.length > 0
      ? buildOrSql(intent.tokenGroups.map((variants) => buildTokenFieldMatchSql(variants)))
      : Prisma.sql`FALSE`;
  const categoryFilter =
    params.category && params.category !== "all"
      ? Prisma.sql`AND c."slug" = ${params.category}`
      : Prisma.empty;

  return {
    orderBy,
    matchedResourcesSql: Prisma.sql`
      WITH candidate_resources AS (
        SELECT
          r."id",
          r."title",
          r."slug",
          r."price",
          r."isFree",
          r."featured",
          r."downloadCount",
          r."createdAt",
          c."id" AS "categoryId",
          c."name" AS "categoryName",
          c."slug" AS "categorySlug",
          u."name" AS "authorName",
          COALESCE(rs."trendingScore", 0)::double precision AS "trendingScore",
          COALESCE(rs."purchases", 0)::int AS "purchaseCount",
          COALESCE(rs."downloads", r."downloadCount", 0)::int AS "rankedDownloads",
          (r."description" ILIKE ${containsPattern}) AS "descriptionContains",
          (${tokenMatchScoreSql})::int AS "matchedTokenCount",
          (
            (${tokenMatchScoreSql})::double precision * ${weights.tokenMatch} +
            CASE WHEN lower(r."title") = ${queryLower} THEN ${weights.exactTitle} ELSE 0 END +
            CASE WHEN lower(r."slug") = ${queryLower} THEN ${weights.exactSlug} ELSE 0 END +
            CASE
              WHEN lower(COALESCE(c."name", '')) = ${queryLower}
                OR lower(COALESCE(c."slug", '')) = ${queryLower}
              THEN ${weights.exactCategory}
              ELSE 0
            END +
            CASE WHEN lower(COALESCE(u."name", '')) = ${queryLower} THEN ${weights.exactCreator} ELSE 0 END +
            CASE WHEN lower(r."title") LIKE ${prefixPattern} THEN ${weights.prefixTitle} ELSE 0 END +
            CASE WHEN lower(r."slug") LIKE ${prefixPattern} THEN ${weights.prefixSlug} ELSE 0 END +
            CASE
              WHEN lower(COALESCE(c."name", '')) LIKE ${prefixPattern}
                OR lower(COALESCE(c."slug", '')) LIKE ${prefixPattern}
              THEN ${weights.prefixCategory}
              ELSE 0
            END +
            CASE WHEN lower(COALESCE(u."name", '')) LIKE ${prefixPattern} THEN ${weights.prefixCreator} ELSE 0 END +
            CASE WHEN r."title" ILIKE ${containsPattern} THEN ${weights.containsTitle} ELSE 0 END +
            CASE WHEN r."slug" ILIKE ${containsPattern} THEN ${weights.containsSlug} ELSE 0 END +
            CASE
              WHEN COALESCE(c."name", '') ILIKE ${containsPattern}
                OR COALESCE(c."slug", '') ILIKE ${containsPattern}
              THEN ${weights.containsCategory}
              ELSE 0
            END +
            CASE WHEN COALESCE(u."name", '') ILIKE ${containsPattern} THEN ${weights.containsCreator} ELSE 0 END +
            CASE WHEN r."description" ILIKE ${containsPattern} THEN ${weights.containsDescription} ELSE 0 END +
            GREATEST(similarity(r."title", ${query}), similarity(r."slug", ${query}), 0) * ${weights.similarityTitleOrSlug} +
            GREATEST(
              similarity(COALESCE(c."name", ''), ${query}),
              similarity(COALESCE(c."slug", ''), ${query}),
              0
            ) * ${weights.similarityCategory} +
            GREATEST(similarity(COALESCE(u."name", ''), ${query}), 0) * ${weights.similarityCreator}
          )::double precision AS "baseScore"
        FROM "Resource" r
        LEFT JOIN "Category" c
          ON c."id" = r."categoryId"
        LEFT JOIN "User" u
          ON u."id" = r."authorId"
        LEFT JOIN "resource_stats" rs
          ON rs."resourceId" = r."id"
        WHERE r."status" = 'PUBLISHED'
          AND r."deletedAt" IS NULL
          AND (r."visibility" IS NULL OR r."visibility" = 'PUBLIC')
          ${categoryFilter}
          AND (
            r."title" ILIKE ${containsPattern}
            OR r."slug" ILIKE ${containsPattern}
            OR r."description" ILIKE ${containsPattern}
            OR COALESCE(c."name", '') ILIKE ${containsPattern}
            OR COALESCE(c."slug", '') ILIKE ${containsPattern}
            OR COALESCE(u."name", '') ILIKE ${containsPattern}
            OR ${tagSearchExistsSql}
            OR ${tokenAnyMatchSql}
            OR similarity(r."title", ${query}) >= ${threshold}
            OR similarity(r."slug", ${query}) >= ${threshold}
            OR GREATEST(
              similarity(COALESCE(c."name", ''), ${query}),
              similarity(COALESCE(c."slug", ''), ${query})
            ) >= ${threshold}
            OR similarity(COALESCE(u."name", ''), ${query}) >= ${threshold}
          )
      )
      SELECT
        cr."id",
        cr."title",
        cr."slug",
        cr."price",
        cr."isFree",
        cr."featured",
        cr."downloadCount",
        cr."createdAt",
        cr."categoryId",
        cr."categoryName",
        cr."categorySlug",
        cr."authorName",
        cr."purchaseCount",
        cr."rankedDownloads",
        cr."trendingScore",
        cr."matchedTokenCount",
        tag_metrics."bestTagName",
        (
          cr."baseScore" +
          CASE WHEN COALESCE(tag_metrics."tagExact", false) THEN ${weights.exactTag} ELSE 0 END +
          CASE WHEN COALESCE(tag_metrics."tagPrefix", false) THEN ${weights.prefixTag} ELSE 0 END +
          CASE WHEN COALESCE(tag_metrics."tagContains", false) THEN ${weights.containsTag} ELSE 0 END +
          GREATEST(tag_metrics."tagSimilarity", 0) * ${weights.similarityTag}
        )::double precision AS "score",
        CASE
          WHEN lower(cr."title") = ${queryLower} THEN ${labels.exactTitle}
          WHEN lower(cr."slug") = ${queryLower} THEN ${labels.exactKeyword}
          WHEN COALESCE(tag_metrics."tagExact", false) THEN CONCAT(${labels.tagPrefix}, COALESCE(tag_metrics."bestTagName", ${labels.fallbackMatch}))
          WHEN lower(COALESCE(cr."categoryName", '')) = ${queryLower}
            OR lower(COALESCE(cr."categorySlug", '')) = ${queryLower}
            THEN CONCAT(${labels.categoryPrefix}, COALESCE(cr."categoryName", ${labels.fallbackMatch}))
          WHEN lower(COALESCE(cr."authorName", '')) = ${queryLower} THEN CONCAT(${labels.creatorPrefix}, COALESCE(cr."authorName", ${labels.fallbackMatch}))
          WHEN lower(cr."title") LIKE ${prefixPattern} THEN ${labels.titleStartsWithSearch}
          WHEN COALESCE(tag_metrics."tagPrefix", false) THEN CONCAT(${labels.relatedTagPrefix}, COALESCE(tag_metrics."bestTagName", ${labels.fallbackMatch}))
          WHEN COALESCE(cr."categoryName", '') ILIKE ${containsPattern} THEN CONCAT(${labels.inPrefix}, cr."categoryName")
          WHEN COALESCE(cr."authorName", '') ILIKE ${containsPattern} THEN CONCAT(${labels.byPrefix}, cr."authorName")
          WHEN cr."descriptionContains" THEN ${labels.matchedDescription}
          ELSE ${labels.relatedResult}
        END AS "matchReason"
      FROM candidate_resources cr
      LEFT JOIN LATERAL (
        SELECT
          MAX(GREATEST(similarity(t."name", ${query}), similarity(t."slug", ${query})))::double precision AS "tagSimilarity",
          BOOL_OR(lower(t."name") = ${queryLower} OR lower(t."slug") = ${queryLower}) AS "tagExact",
          BOOL_OR(lower(t."name") LIKE ${prefixPattern} OR lower(t."slug") LIKE ${prefixPattern}) AS "tagPrefix",
          BOOL_OR(t."name" ILIKE ${containsPattern} OR t."slug" ILIKE ${containsPattern}) AS "tagContains",
          (
            ARRAY_AGG(
              t."name"
              ORDER BY GREATEST(similarity(t."name", ${query}), similarity(t."slug", ${query})) DESC NULLS LAST, t."name" ASC
            )
          )[1] AS "bestTagName"
        FROM "ResourceTag" rt
        INNER JOIN "Tag" t
          ON t."id" = rt."tagId"
        WHERE rt."resourceId" = cr."id"
      ) AS tag_metrics
        ON TRUE
    `,
  };
}

function buildRankedSearchRowsQuery(params: {
  query: string;
  limit: number;
  offset: number;
  category?: string;
  sort?: string;
}) {
  const { matchedResourcesSql, orderBy } = buildRankedSearchMatchedResourcesSql(params);

  return Prisma.sql`
    WITH matched_resources AS (
      ${matchedResourcesSql}
    ),
    ranked_resources AS (
      SELECT
        matched_resources.*
      FROM matched_resources
      ORDER BY ${Prisma.raw(orderBy)}
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    )
    SELECT
      ranked_resources."id",
      ranked_resources."title",
      ranked_resources."slug",
      ranked_resources."price",
      ranked_resources."isFree",
      ranked_resources."featured",
      ranked_resources."downloadCount",
      ranked_resources."createdAt",
      ranked_resources."categoryId",
      ranked_resources."categoryName",
      ranked_resources."categorySlug",
      ranked_resources."authorName",
      ranked_resources."score",
      ranked_resources."matchReason",
      ranked_resources."purchaseCount",
      p."imageUrl" AS "previewImageUrl",
      COALESCE(rv."reviewCount", 0)::int AS "reviewCount"
    FROM ranked_resources
    LEFT JOIN LATERAL (
      SELECT "imageUrl"
      FROM "ResourcePreview"
      WHERE "resourceId" = ranked_resources."id"
      ORDER BY "order" ASC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS "reviewCount"
      FROM "Review"
      WHERE "resourceId" = ranked_resources."id"
        AND "isVisible" = TRUE
    ) rv ON TRUE
    ORDER BY ${Prisma.raw(orderBy)}
  `;
}

function buildRankedSearchSuggestionRowsQuery(params: {
  query: string;
  limit: number;
  category?: string;
}) {
  const { matchedResourcesSql, orderBy } = buildRankedSearchMatchedResourcesSql({
    ...params,
    sort: "relevance",
  });

  return Prisma.sql`
    WITH matched_resources AS (
      ${matchedResourcesSql}
    ),
    ranked_resources AS (
      SELECT
        matched_resources.*
      FROM matched_resources
      ORDER BY ${Prisma.raw(orderBy)}
      LIMIT ${params.limit}
    )
    SELECT
      ranked_resources."id",
      ranked_resources."title",
      ranked_resources."slug",
      ranked_resources."price",
      ranked_resources."isFree",
      ranked_resources."authorName",
      ranked_resources."categoryName",
      ranked_resources."matchReason",
      p."imageUrl" AS "previewImageUrl"
    FROM ranked_resources
    LEFT JOIN LATERAL (
      SELECT "imageUrl"
      FROM "ResourcePreview"
      WHERE "resourceId" = ranked_resources."id"
      ORDER BY "order" ASC
      LIMIT 1
    ) p ON TRUE
    ORDER BY ${Prisma.raw(orderBy)}
  `;
}

function buildRankedSearchRowsWithTotalQuery(params: {
  query: string;
  limit: number;
  offset: number;
  category?: string;
  sort?: string;
}) {
  const { matchedResourcesSql, orderBy } = buildRankedSearchMatchedResourcesSql(params);

  return Prisma.sql`
    WITH matched_resources AS (
      ${matchedResourcesSql}
    ),
    totals AS (
      SELECT COUNT(*)::int AS "totalCount"
      FROM matched_resources
    ),
    ranked_resources AS (
      SELECT
        matched_resources.*
      FROM matched_resources
      ORDER BY ${Prisma.raw(orderBy)}
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    )
    SELECT
      ranked_resources."id",
      ranked_resources."title",
      ranked_resources."slug",
      ranked_resources."price",
      ranked_resources."isFree",
      ranked_resources."featured",
      ranked_resources."downloadCount",
      ranked_resources."createdAt",
      ranked_resources."categoryId",
      ranked_resources."categoryName",
      ranked_resources."categorySlug",
      ranked_resources."authorName",
      ranked_resources."score",
      ranked_resources."matchReason",
      ranked_resources."purchaseCount",
      totals."totalCount",
      p."imageUrl" AS "previewImageUrl",
      COALESCE(rv."reviewCount", 0)::int AS "reviewCount"
    FROM ranked_resources
    CROSS JOIN totals
    LEFT JOIN LATERAL (
      SELECT "imageUrl"
      FROM "ResourcePreview"
      WHERE "resourceId" = ranked_resources."id"
      ORDER BY "order" ASC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS "reviewCount"
      FROM "Review"
      WHERE "resourceId" = ranked_resources."id"
        AND "isVisible" = TRUE
    ) rv ON TRUE
    ORDER BY ${Prisma.raw(orderBy)}
  `;
}

function buildRankedSearchTotalCountQuery(params: {
  query: string;
  category?: string;
  sort?: string;
}) {
  const { matchedResourcesSql } = buildRankedSearchMatchedResourcesSql(params);

  return Prisma.sql`
    WITH matched_resources AS (
      ${matchedResourcesSql}
    )
    SELECT COUNT(*)::int AS "totalCount"
    FROM matched_resources
  `;
}

export async function findPublicResources(params: FindPublicResourcesParams) {
  const { page, pageSize, categorySlug, tagSlug, search, isFree } = params;

  const categoryId = categorySlug
    ? (await findCategoryBySlug(categorySlug))?.id
    : undefined;

  if (categorySlug && !categoryId) {
    return { items: [], total: 0 };
  }

  const where = {
    ...LISTED_RESOURCE_WHERE,
    ...(categoryId && { categoryId }),
    ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
    ...(isFree !== undefined && { isFree }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      select: RESOURCE_CARD_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.resource.count({ where }),
  ]);

  return { items, total };
}

export async function findAdminActor(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
}

export async function findAdminResources(authorId?: string, take = 500) {
  return prisma.resource.findMany({
    where: {
      deletedAt: null,
      ...(authorId ? { authorId } : {}),
    },
    include: ADMIN_RESOURCE_LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function findAdminResourcesPage(params: {
  where: Prisma.ResourceWhereInput;
  skip: number;
  take: number;
}) {
  return prisma.resource.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    orderBy: { createdAt: "desc" },
    select: ADMIN_RESOURCE_PAGE_SELECT,
  });
}

export async function findCreatorOwnedResources(authorId: string, take = 200) {
  return prisma.resource.findMany({
    where: {
      authorId,
      deletedAt: null,
    },
    select: CREATOR_DASHBOARD_RESOURCE_SELECT,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function findRecommendedResourcesExcludingIds(
  resourceIds: string[],
  take: number,
) {
  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_CARD_SELECT,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { resourceStat: { downloads: "desc" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function findNewResourcesInCategoryExcludingIds(
  categoryId: string,
  resourceIds: string[],
  take: number,
) {
  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId,
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_CARD_SELECT,
    orderBy: [
      { createdAt: "desc" },
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
    ],
    take,
  });
}

export async function findNewResourcesInCategoriesExcludingIds(
  categoryIds: string[],
  resourceIds: string[],
  take: number,
) {
  if (categoryIds.length === 0) {
    return [];
  }

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId: { in: categoryIds },
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_CARD_SELECT,
    orderBy: [
      { createdAt: "desc" },
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
    ],
    take,
  });
}

export async function findTopTrendingInCategoriesExcludingIds(
  categoryIds: string[],
  resourceIds: string[],
  take: number,
) {
  if (categoryIds.length === 0) return [];

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId: { in: categoryIds },
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_CARD_SELECT,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function findRecommendedResourcesByLevelsExcludingIds(
  levels: Array<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">,
  resourceIds: string[],
  take: number,
) {
  if (levels.length === 0) {
    return [];
  }

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      level: { in: levels },
      ...(resourceIds.length > 0 ? { id: { notIn: resourceIds } } : {}),
    },
    select: RESOURCE_CARD_SELECT,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { resourceStat: { purchases: "desc" } },
      { resourceStat: { downloads: "desc" } },
      { createdAt: "desc" },
    ],
    take,
  });
}

export async function findResourceById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
  });
}

export async function findResourcePublicCacheTargetById(id: string) {
  return prisma.resource.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      categoryId: true,
      category: {
        select: {
          slug: true,
        },
      },
      deletedAt: true,
      title: true,
      authorId: true,
      status: true,
    },
  });
}

export async function findResourceRouteDetailById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { purchases: true, reviews: true } },
    },
  });
}

export async function incrementResourceViewCount(resourceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function findResourceDuplicateSourceById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      isFree: true,
      price: true,
      fileUrl: true,
      categoryId: true,
      featured: true,
      previews: {
        orderBy: { order: "asc" as const },
        select: { imageUrl: true },
      },
      tags: {
        select: { tagId: true },
      },
    },
  });
}

export async function findResourceUploadTargetById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, slug: true, fileKey: true },
  });
}

export interface ReplaceResourceFileAndCreateVersionInput {
  resourceId: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdById: string | null;
}

export async function replaceResourceFileAndCreateVersion(
  input: ReplaceResourceFileAndCreateVersionInput,
) {
  return prisma.$transaction(async (tx) => {
    const updatedResource = await tx.resource.update({
      where: { id: input.resourceId },
      data: {
        fileKey: input.fileKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      },
      select: { id: true, fileKey: true, fileName: true, fileSize: true },
    });

    const lastVersion = await tx.resourceVersion.findFirst({
      where: { resourceId: input.resourceId },
      orderBy: { version: "desc" },
    });

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    await tx.resourceVersion.create({
      data: {
        resourceId: input.resourceId,
        version: nextVersion,
        fileKey: updatedResource.fileKey,
        fileName: updatedResource.fileName,
        fileSize: updatedResource.fileSize,
        mimeType: input.mimeType,
        // fileUrl is only used for external storage; local uploads rely on fileKey
        changelog:
          nextVersion === 1
            ? "Initial upload"
            : `File updated (v${nextVersion.toString()})`,
        createdById: input.createdById,
      },
    });

    return updatedResource;
  });
}

export interface UpdateResourceRouteRecordInput {
  title?: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFree?: boolean;
  price?: number;
  featured?: boolean;
  categoryId?: string | null;
  fileUrl?: string;
  previewUrl?: string | null;
  previewUrls?: string[];
}

export async function updateResourceRouteRecord(
  resourceId: string,
  input: UpdateResourceRouteRecordInput,
) {
  return prisma.$transaction(async (tx) => {
    const updatedResource = await tx.resource.update({
      where: { id: resourceId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.isFree !== undefined && { isFree: input.isFree }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.fileUrl !== undefined && { fileUrl: input.fileUrl }),
        ...(input.previewUrl !== undefined && { previewUrl: input.previewUrl }),
      },
    });

    if (input.previewUrls !== undefined) {
      await tx.resourcePreview.deleteMany({
        where: { resourceId },
      });

      if (input.previewUrls.length > 0) {
        await tx.resourcePreview.createMany({
          data: input.previewUrls.map((imageUrl, order) => ({
            resourceId,
            imageUrl,
            order,
          })),
        });
      }
    }

    return updatedResource;
  });
}

export interface RollbackResourceVersionInput {
  resourceId: string;
  versionId: string;
  createdById: string | null;
}

export async function rollbackResourceVersionRecord(
  input: RollbackResourceVersionInput,
) {
  return prisma.$transaction(async (tx) => {
    const targetVersion = await tx.resourceVersion.findFirst({
      where: {
        id: input.versionId,
        resourceId: input.resourceId,
      },
    });

    if (!targetVersion) {
      return null;
    }

    const lastVersion = await tx.resourceVersion.findFirst({
      where: { resourceId: input.resourceId },
      orderBy: { version: "desc" },
    });

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const newVersion = await tx.resourceVersion.create({
      data: {
        resourceId: input.resourceId,
        version: nextVersion,
        fileKey: targetVersion.fileKey,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        mimeType: targetVersion.mimeType,
        fileUrl: targetVersion.fileUrl,
        changelog: `Rollback to v${targetVersion.version}`,
        createdById: input.createdById,
      },
    });

    const updatedResource = await tx.resource.update({
      where: { id: input.resourceId },
      data: {
        fileKey: targetVersion.fileKey,
        fileName: targetVersion.fileName,
        fileSize: targetVersion.fileSize,
        mimeType: targetVersion.mimeType,
        fileUrl: targetVersion.fileUrl,
      },
    });

    return { newVersion, updatedResource };
  });
}

export async function deleteResourceRouteRecord(resourceId: string) {
  return prisma.resource.delete({
    where: { id: resourceId },
  });
}

/**
 * Minimal resource projection for post-purchase transactional email.
 * Fetches only the three fields the email template needs — avoids pulling
 * the full resource record (file keys, pricing, previews, etc.).
 */
export interface ResourceEmailContext {
  slug: string;
  title: string;
  authorName: string | null;
}

export async function findResourceEmailContext(
  resourceId: string,
): Promise<ResourceEmailContext | null> {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      slug: true,
      title: true,
      author: { select: { name: true } },
    },
  });

  if (!resource) return null;

  return {
    slug: resource.slug,
    title: resource.title,
    authorName: resource.author?.name ?? null,
  };
}

/**
 * Fetches a resource for download authorisation.
 *
 * Returns null (→ 404) for any of:
 *   - unknown resourceId
 *   - status !== PUBLISHED (DRAFT and ARCHIVED are not downloadable)
 *   - soft-deleted resources (deletedAt IS NOT NULL)
 *
 * Uses findFirst (not findUnique) so that the extra non-unique filters
 * (status, deletedAt) can be composed into the WHERE clause.  The result
 * is still deterministic because `id` is the primary key.
 */
export async function findDownloadableResourceById(id: string) {
  return prisma.resource.findFirst({
    where: { id, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      authorId: true,
      isFree: true,
      fileKey: true,
      fileUrl: true,
      fileName: true,
      mimeType: true,
    },
  });
}

export async function findResourceBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
  });
}

export async function setResourceStripePriceId(resourceId: string, stripePriceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { stripePriceId },
  });
}

export async function findCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export async function findCategoriesOrderedByName() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export function findAdminResourceFormTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export function findAdminTagsWithUsage() {
  return prisma.tag.findMany({
    orderBy: [
      { resources: { _count: "desc" } },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { resources: true } },
    },
  });
}

export function findTrashedAdminResources(params: { take: number }) {
  return prisma.resource.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
    take: params.take,
    include: {
      author: { select: { name: true, email: true } },
    },
  });
}

export function findAdminResourceTitleById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    select: { title: true },
  });
}

export function findAdminResourceEditById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { purchases: true, reviews: true } },
      tags: { select: { tagId: true } },
      previews: { select: { imageUrl: true }, orderBy: { order: "asc" } },
    },
  });
}

export function findAdminResourceVersionPageResource(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
    },
  });
}

const MAX_RESOURCE_VERSIONS_HISTORY = 200;

export function findResourceVersionsByResourceId(resourceId: string) {
  return prisma.resourceVersion.findMany({
    where: { resourceId },
    orderBy: { version: "desc" },
    take: MAX_RESOURCE_VERSIONS_HISTORY,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function findMarketplaceResourceCards(params: {
  where: Prisma.ResourceWhereInput;
  orderBy: Prisma.ResourceFindManyArgs["orderBy"];
  skip: number;
  take: number;
}) {
  return prisma.resource.findMany({
    where: params.where,
    select: RESOURCE_CARD_SELECT,
    orderBy: params.orderBy,
    skip: params.skip,
    take: params.take,
  });
}

export async function countMarketplaceResources(where: Prisma.ResourceWhereInput) {
  return prisma.resource.count({ where });
}

export async function findPublicResourceDetailShellBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_SHELL_SELECT,
  });
}

export async function findPublicResourceDetailMetadataBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_METADATA_SELECT,
  });
}

export async function findPublicResourceDetailBodyContentBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_BODY_CONTENT_SELECT,
  });
}

export async function findPublicResourceDetailFooterContentBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_FOOTER_CONTENT_SELECT,
  });
}

export async function findPublicResourceDetailPurchaseMetaBySlug(slug: string) {
  return prisma.resource.findUnique({
    where: { slug },
    select: RESOURCE_DETAIL_PURCHASE_META_SELECT,
  });
}

export async function findRelatedListedResources(
  categoryId: string,
  excludeId: string,
  take: number,
) {
  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      categoryId,
      id: { not: excludeId },
    },
    take,
    select: RESOURCE_CARD_SELECT,
  });
}

export async function findDiscoverFallbackResourceIds(
  limit: number,
  orderBy: Prisma.ResourceFindManyArgs["orderBy"],
  where?: Prisma.ResourceFindManyArgs["where"],
) {
  const rows = await prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      ...(where ?? {}),
    },
    select: { id: true },
    orderBy,
    take: limit,
  });

  return rows.map((row) => row.id);
}

export async function findDiscoverResourcesByIds(resourceIds: string[]) {
  if (resourceIds.length === 0) {
    return [];
  }

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      id: { in: resourceIds },
    },
    select: RESOURCE_CARD_SELECT,
  });
}

export async function findDiscoverCategoriesWithCounts() {
  return prisma.category.findMany({
    where: { resources: { some: LISTED_RESOURCE_WHERE } },
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function findSearchResources(params: {
  query: string;
  limit: number;
  category?: string;
}) {
  return prisma.$queryRaw<RankedSearchResourceRow[]>(
    buildRankedSearchRowsQuery({
      query: params.query,
      limit: params.limit,
      offset: 0,
      category: params.category,
      sort: "relevance",
    }),
  );
}

export async function findSearchSuggestionResources(params: {
  query: string;
  limit: number;
  category?: string;
}) {
  return prisma.$queryRaw<RankedSearchSuggestionRow[]>(
    buildRankedSearchSuggestionRowsQuery({
      query: params.query,
      limit: params.limit,
      category: params.category,
    }),
  );
}

export async function findSearchRecoveryCategories(params: {
  query: string;
  limit: number;
}) {
  const intent = buildSearchQueryIntent(params.query);
  const terms = Array.from(
    new Set([
      intent.normalizedQuery,
      ...intent.tokenGroups.flat(),
    ]),
  ).filter(Boolean);

  if (terms.length === 0) {
    return [] satisfies SearchRecoveryTaxonomyMatch[];
  }

  return prisma.category.findMany({
    where: {
      resources: {
        some: LISTED_RESOURCE_WHERE,
      },
      OR: terms.flatMap((term) => ([
        { name: { contains: term, mode: "insensitive" as const } },
        { slug: { contains: term, mode: "insensitive" as const } },
      ])),
    },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          resources: true,
        },
      },
    },
    take: params.limit,
    orderBy: [
      { resources: { _count: "desc" } },
      { name: "asc" },
    ],
  }).then((rows) =>
    rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      resourceCount: row._count.resources,
    })),
  );
}

export async function findSearchRecoveryTags(params: {
  query: string;
  limit: number;
}) {
  const intent = buildSearchQueryIntent(params.query);
  const terms = Array.from(
    new Set([
      intent.normalizedQuery,
      ...intent.tokenGroups.flat(),
    ]),
  ).filter(Boolean);

  if (terms.length === 0) {
    return [] satisfies SearchRecoveryTaxonomyMatch[];
  }

  return prisma.tag.findMany({
    where: {
      resources: {
        some: {
          resource: LISTED_RESOURCE_WHERE,
        },
      },
      OR: terms.flatMap((term) => ([
        { name: { contains: term, mode: "insensitive" as const } },
        { slug: { contains: term, mode: "insensitive" as const } },
      ])),
    },
    select: {
      name: true,
      slug: true,
      _count: {
        select: {
          resources: true,
        },
      },
    },
    take: params.limit,
    orderBy: [
      { resources: { _count: "desc" } },
      { name: "asc" },
    ],
  }).then((rows) =>
    rows.map((row) => ({
      name: row.name,
      slug: row.slug,
      resourceCount: row._count.resources,
    })),
  );
}

export async function findMarketplaceSearchResources(params: {
  query: string;
  page: number;
  pageSize: number;
  category?: string;
  sort?: string;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const rows = await prisma.$queryRaw<RankedSearchResourceRow[]>(
    buildRankedSearchRowsWithTotalQuery({
      query: params.query,
      limit: params.pageSize,
      offset,
      category: params.category,
      sort: params.sort,
    }),
  );

  let total = rows[0]?.totalCount ?? 0;

  if (rows.length === 0 && offset > 0) {
    const countRows = await prisma.$queryRaw<Array<{ totalCount: number }>>(
      buildRankedSearchTotalCountQuery({
        query: params.query,
        category: params.category,
        sort: params.sort,
      }),
    );
    total = countRows[0]?.totalCount ?? 0;
  }

  return { rows, total };
}

export async function findTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: { id: true },
  });
}

export function findTagById(tagId: string) {
  return prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true, name: true, slug: true },
  });
}

export function findTagByNameOrSlug(name: string, slug: string, excludeId?: string) {
  return prisma.tag.findFirst({
    where: excludeId
      ? {
          AND: [
            { id: { not: excludeId } },
            {
              OR: [
                { name: { equals: name, mode: "insensitive" } },
                { slug },
              ],
            },
          ],
        }
      : {
          OR: [
            { name: { equals: name, mode: "insensitive" } },
            { slug },
          ],
        },
  });
}

export function createTagRecord(input: { name: string; slug: string }) {
  return prisma.tag.create({
    data: {
      name: input.name,
      slug: input.slug,
    },
  });
}

export function updateTagRecord(input: { id: string; name: string; slug: string }) {
  return prisma.tag.update({
    where: { id: input.id },
    data: { name: input.name, slug: input.slug },
  });
}

export function deleteResourceTagJoins(tagId: string) {
  return prisma.resourceTag.deleteMany({
    where: { tagId },
  });
}

export function deleteTagRecord(tagId: string) {
  return prisma.tag.delete({
    where: { id: tagId },
  });
}

export function findResourceSlugById(resourceId: string) {
  return prisma.resource.findUnique({
    where: { id: resourceId },
    select: { slug: true },
  });
}

export function findHotResourceSlugs(limit: number) {
  return prisma.resource.findMany({
    where: LISTED_RESOURCE_WHERE,
    select: { slug: true },
    orderBy: { resourceStat: { downloads: "desc" } },
    take: limit,
  });
}

export function clearAdminResourceFileById(resourceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: {
      fileKey: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
    },
    select: { slug: true },
  });
}

export function findAdminResourceVersionDownload(resourceId: string, versionId: string) {
  return prisma.resourceVersion.findFirst({
    where: {
      id: versionId,
      resourceId,
    },
  });
}

export async function createAdminResourceRecord(input: CreateAdminResourceRecordInput) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: input.status,
      isFree: input.isFree,
      price: input.price,
      fileUrl: input.fileUrl,
      stripePriceId: input.stripePriceId ?? null,
      stripeProductId: input.stripeProductId ?? null,
      categoryId: input.categoryId,
      featured: input.featured,
      level: input.level ?? null,
      license: input.license ?? null,
      visibility: input.visibility ?? null,
      previewUrl: input.previewUrl,
      authorId: input.authorId,
      tags: {
        create: input.tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      },
      previews: {
        create: input.previewUrls.map((imageUrl, order) => ({
          imageUrl,
          order,
        })),
      },
    },
  });
}

export interface CreateDuplicatedAdminResourceInput {
  title: string;
  slug: string;
  description: string;
  type: "PDF" | "DOCUMENT";
  isFree: boolean;
  price: number;
  fileUrl: string | null;
  categoryId: string | null;
  featured: boolean;
  previewUrl: string | null;
  authorId: string;
  tagIds: string[];
  previewUrls: string[];
}

export async function createDuplicatedAdminResource(
  input: CreateDuplicatedAdminResourceInput,
) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: "DRAFT",
      isFree: input.isFree,
      price: input.price,
      fileUrl: input.fileUrl,
      categoryId: input.categoryId,
      featured: input.featured,
      previewUrl: input.previewUrl,
      authorId: input.authorId,
      tags:
        input.tagIds.length > 0
          ? {
              create: input.tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      previews:
        input.previewUrls.length > 0
          ? {
              create: input.previewUrls.map((imageUrl, order) => ({
                imageUrl,
                order,
              })),
            }
          : undefined,
    },
  });
}

export async function createOwnedResourceRecord(input: CreateAdminResourceRecordInput) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      type: input.type,
      status: input.status,
      isFree: input.isFree,
      price: input.price,
      fileUrl: input.fileUrl,
      stripePriceId: input.stripePriceId ?? null,
      stripeProductId: input.stripeProductId ?? null,
      categoryId: input.categoryId,
      featured: input.featured,
      level: input.level ?? null,
      license: input.license ?? null,
      visibility: input.visibility ?? null,
      previewUrl: input.previewUrl,
      authorId: input.authorId,
      tags: input.tagIds.length
        ? {
            create: input.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          }
        : undefined,
      previews: input.previewUrls.length
        ? {
            create: input.previewUrls.map((imageUrl, order) => ({
              imageUrl,
              order,
            })),
          }
        : undefined,
    },
    include: OWNED_RESOURCE_CREATE_INCLUDE,
  });
}

export async function deleteStaleDraftResources(cutoff: Date) {
  return prisma.resource.deleteMany({
    where: {
      title: {
        in: ["", "Untitled draft", "AI resource draft"],
      },
      description: "",
      fileUrl: null,
      fileKey: null,
      previewUrl: null,
      categoryId: null,
      isFree: true,
      price: 0,
      status: "DRAFT",
      createdAt: {
        lt: cutoff,
      },
      OR: [
        {
          aiDraft: {
            is: null,
          },
        },
        {
          aiDraft: {
            is: {
              updatedAt: {
                lt: cutoff,
              },
            },
          },
        },
      ],
    },
  });
}

export async function createDraftResourceRecord(input: {
  title: string;
  slug: string;
  authorId: string;
}) {
  return prisma.resource.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: "",
      type: "PDF",
      status: "DRAFT",
      isFree: true,
      price: 0,
      fileUrl: null,
      categoryId: null,
      featured: false,
      authorId: input.authorId,
    },
    select: {
      id: true,
    },
  });
}

export async function createAdminResourcesBulk(items: BulkAdminResourceRecordInput[]) {
  const created: { row: number; title: string; id: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const resource = await tx.resource.create({
        data: {
          title: item.title,
          slug: item.slug,
          description: item.description,
          type: item.type,
          status: item.status,
          isFree: item.isFree,
          price: item.price,
          fileUrl: item.fileUrl,
          categoryId: item.categoryId,
          featured: item.featured,
          previewUrl: item.previewUrl,
          authorId: item.authorId,
          tags: {
            create: item.tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
          previews: {
            create: item.previewUrls.map((imageUrl, order) => ({
              imageUrl,
              order,
            })),
          },
        },
      });

      created.push({ row: item.row, title: item.title, id: resource.id });
    }
  });

  return created;
}

export async function updateAdminResourceRecord(
  resourceId: string,
  input: UpdateAdminResourceRecordInput,
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.resource.update({
      where: { id: resourceId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.status !== undefined && { status: input.status }),
        isFree: input.isFree,
        price: input.price,
        ...(input.fileUrl !== undefined && { fileUrl: input.fileUrl }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.level !== undefined && { level: input.level }),
        ...(input.license !== undefined && { license: input.license }),
        ...(input.visibility !== undefined && { visibility: input.visibility }),
        ...(input.authorId !== undefined && { authorId: input.authorId }),
        ...(input.previewUrl !== undefined && { previewUrl: input.previewUrl }),
      },
    });

    if (input.tagIds !== undefined) {
      await tx.resourceTag.deleteMany({ where: { resourceId } });

      const uniqueTagIds = Array.from(new Set(input.tagIds));
      if (uniqueTagIds.length > 0) {
        await tx.resourceTag.createMany({
          data: uniqueTagIds.map((tagId) => ({
            resourceId,
            tagId,
          })),
        });
      }
    }

    if (input.previewUrls !== undefined) {
      await tx.resourcePreview.deleteMany({ where: { resourceId } });

      if (input.previewUrls.length > 0) {
        await tx.resourcePreview.createMany({
          data: input.previewUrls.map((imageUrl, order) => ({
            resourceId,
            imageUrl,
            order,
          })),
        });
      }
    }

    return updated;
  });
}

export async function softDeleteAdminResource(resourceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { deletedAt: new Date() },
  });
}

export async function restoreAdminResource(resourceId: string) {
  return prisma.resource.update({
    where: { id: resourceId },
    data: { deletedAt: null },
  });
}

export async function permanentlyDeleteAdminResource(resourceId: string) {
  return prisma.$transaction([
    prisma.review.deleteMany({ where: { resourceId } }),
    prisma.purchase.deleteMany({ where: { resourceId } }),
    prisma.resource.delete({ where: { id: resourceId } }),
  ]);
}

export async function softDeleteAdminResources(resourceIds: string[]) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { deletedAt: new Date() },
  });
}

export async function moveAdminResourcesToCategory(
  resourceIds: string[],
  categoryId: string,
) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { categoryId },
  });
}

export async function updateAdminResourceStatuses(
  resourceIds: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
) {
  return prisma.resource.updateMany({
    where: { id: { in: resourceIds } },
    data: { status },
  });
}

// ── Phase 2 recommendation candidates ────────────────────────────────────────

const PHASE2_CANDIDATE_SELECT = {
  id: true,
  title: true,
  slug: true,
  price: true,
  isFree: true,
  featured: true,
  downloadCount: true,
  createdAt: true,
  previewUrl: true,
  author: { select: { id: true, name: true, image: true } },
  category: { select: { id: true, name: true, slug: true } },
  previews: {
    take: 1,
    orderBy: { order: "asc" as const },
    select: { imageUrl: true },
  },
  tags: { select: { tag: { select: { id: true, slug: true } } } },
  resourceStat: { select: { trendingScore: true } },
} as const;

/**
 * Fetches candidate resources for Phase 2 personalized recommendations.
 * Matches resources in any of the given categories OR with any of the given tags.
 * Excludes provided IDs (owned + high-view-count resources).
 * Returns up to `limit` results pre-sorted by trendingScore descending.
 */
// ── Activation-weighted marketplace ranking ───────────────────────────────────

/**
 * Flat row returned by the activation-ranked raw SQL query.
 * Must be transformed by `toActivationRankedCardShape` in the service layer
 * before being piped through `withPreview` and `attachResourceTrustSignals`.
 */
export interface FindActivationRankedResourcesRow {
  id: string;
  title: string;
  slug: string;
  price: number;
  isFree: boolean;
  featured: boolean;
  downloadCount: number;
  createdAt: Date;
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  previewImageUrl: string | null;
  totalCount: number;
}

export interface FindActivationRankedResourcesParams {
  categoryId?: string;
  tagSlug?: string;
  search?: string;
  isFree?: boolean;
  featured?: boolean;
  page: number;
  pageSize: number;
}

/**
 * Fetches marketplace resources ordered by an activation-weighted score:
 *
 *   score = ln(purchases + 1) × 0.6
 *         + ((firstPaidDownloads + 3) / (purchases + 6)) × 0.3   ← Laplace-smoothed activation rate
 *         + recencyBoost × 0.1                                    ← 1.0 if last FIRST_PAID_DOWNLOAD < 7 days ago, then 7/daysSince, floor 0.05; 0.05 if no activations
 *
 * Returns flat rows that must be transformed by `toActivationRankedCardShape`
 * in the service layer before being passed to `withPreview` and
 * `attachResourceTrustSignals`.
 */
export async function findActivationRankedResources(
  params: FindActivationRankedResourcesParams,
): Promise<{ rows: FindActivationRankedResourcesRow[]; total: number }> {
  const { page, pageSize, categoryId, tagSlug, search, isFree, featured } = params;
  const skip = (page - 1) * pageSize;

  const conditions: Prisma.Sql[] = [];

  if (categoryId) {
    conditions.push(Prisma.sql`AND r."categoryId" = ${categoryId}`);
  }

  if (tagSlug) {
    conditions.push(Prisma.sql`AND EXISTS (
        SELECT 1 FROM "ResourceTag" rt
        INNER JOIN "Tag" t ON t."id" = rt."tagId"
        WHERE rt."resourceId" = r."id"
          AND t."slug" = ${tagSlug}
      )`);
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      Prisma.sql`AND (r."title" ILIKE ${pattern} OR r."description" ILIKE ${pattern})`,
    );
  }

  if (isFree !== undefined) {
    conditions.push(Prisma.sql`AND r."isFree" = ${isFree}`);
  }

  if (featured) {
    conditions.push(Prisma.sql`AND r."featured" = TRUE`);
  }

  const extraWhere =
    conditions.length > 0 ? Prisma.join(conditions, "\n        ") : Prisma.empty;

  const rows = await prisma.$queryRaw<FindActivationRankedResourcesRow[]>(Prisma.sql`
      WITH base_resources AS (
        SELECT
          r."id",
          r."title",
          r."slug",
          r."price",
          r."isFree",
          r."featured",
          r."downloadCount",
          r."createdAt",
          r."authorId",
          r."categoryId"
        FROM "Resource" r
        WHERE r."status"    = 'PUBLISHED'
          AND r."deletedAt" IS NULL
          AND (r."visibility" IS NULL OR r."visibility" = 'PUBLIC')
          ${extraWhere}
      ),
      first_paid_downloads AS (
        SELECT
          al."entityId"     AS "resourceId",
          COUNT(*)::int     AS "fpd_count",
          MAX(al."createdAt") AS "last_activation_at"
        FROM "ActivityLog" al
        INNER JOIN base_resources br ON br."id" = al."entityId"
        WHERE al."action" = 'FIRST_PAID_DOWNLOAD'
          AND al."entity" = 'Resource'
        GROUP BY al."entityId"
      ),
      totals AS (
        SELECT COUNT(*)::int AS "totalCount"
        FROM base_resources
      ),
      ranked AS (
        SELECT
          br."id",
          br."title",
          br."slug",
          br."price",
          br."isFree",
          br."featured",
          br."downloadCount",
          br."createdAt",
          br."authorId",
          br."categoryId",
          (
            LN(COALESCE(rs."purchases", 0) + 1) * 0.6
            + ((COALESCE(fpd."fpd_count", 0)::float + 3.0) / (COALESCE(rs."purchases", 0)::float + 6.0)) * 0.3
            + GREATEST(0.05, CASE
                WHEN fpd."last_activation_at" IS NOT NULL
                  AND EXTRACT(EPOCH FROM (NOW() - fpd."last_activation_at")) / 86400.0 < 7.0
                  THEN 1.0
                WHEN fpd."last_activation_at" IS NOT NULL
                  THEN 7.0 / (EXTRACT(EPOCH FROM (NOW() - fpd."last_activation_at")) / 86400.0)
                ELSE 0.05
              END) * 0.1
          ) AS "score"
        FROM base_resources br
        LEFT JOIN "resource_stats" rs ON rs."resourceId" = br."id"
        LEFT JOIN first_paid_downloads fpd ON fpd."resourceId" = br."id"
        ORDER BY "score" DESC NULLS LAST
        LIMIT  ${pageSize}
        OFFSET ${skip}
      )
      SELECT
        rnk."id",
        rnk."title",
        rnk."slug",
        rnk."price",
        rnk."isFree",
        rnk."featured",
        rnk."downloadCount",
        rnk."createdAt",
        u."name"     AS "authorName",
        c."id"       AS "categoryId",
        c."name"     AS "categoryName",
        c."slug"     AS "categorySlug",
        p."imageUrl" AS "previewImageUrl",
        totals."totalCount"
      FROM ranked rnk
      CROSS JOIN totals
      LEFT JOIN "User" u ON u."id" = rnk."authorId"
      LEFT JOIN "Category" c ON c."id" = rnk."categoryId"
      LEFT JOIN LATERAL (
        SELECT "imageUrl"
        FROM   "ResourcePreview"
        WHERE  "resourceId" = rnk."id"
        ORDER BY "order" ASC
        LIMIT  1
      ) p ON TRUE
      ORDER BY rnk."score" DESC NULLS LAST
    `);

  let total = rows[0]?.totalCount ?? 0;

  if (rows.length === 0 && skip > 0) {
    const countRows = await prisma.$queryRaw<[{ count: number }]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Resource" r
      WHERE r."status"    = 'PUBLISHED'
        AND r."deletedAt" IS NULL
        AND (r."visibility" IS NULL OR r."visibility" = 'PUBLIC')
        ${extraWhere}
    `);

    total = countRows[0]?.count ?? 0;
  }

  return { rows, total };
}

export async function findActivationRankedResourceCards(
  params: FindActivationRankedResourcesParams,
): Promise<FindActivationRankedResourcesRow[]> {
  const { page, pageSize, categoryId, tagSlug, search, isFree, featured } = params;
  const skip = (page - 1) * pageSize;

  const conditions: Prisma.Sql[] = [];

  if (categoryId) {
    conditions.push(Prisma.sql`AND r."categoryId" = ${categoryId}`);
  }

  if (tagSlug) {
    conditions.push(Prisma.sql`AND EXISTS (
        SELECT 1 FROM "ResourceTag" rt
        INNER JOIN "Tag" t ON t."id" = rt."tagId"
        WHERE rt."resourceId" = r."id"
          AND t."slug" = ${tagSlug}
      )`);
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      Prisma.sql`AND (r."title" ILIKE ${pattern} OR r."description" ILIKE ${pattern})`,
    );
  }

  if (isFree !== undefined) {
    conditions.push(Prisma.sql`AND r."isFree" = ${isFree}`);
  }

  if (featured) {
    conditions.push(Prisma.sql`AND r."featured" = TRUE`);
  }

  const extraWhere =
    conditions.length > 0 ? Prisma.join(conditions, "\n        ") : Prisma.empty;

  return prisma.$queryRaw<FindActivationRankedResourcesRow[]>(Prisma.sql`
      WITH base_resources AS (
        SELECT
          r."id",
          r."title",
          r."slug",
          r."price",
          r."isFree",
          r."featured",
          r."downloadCount",
          r."createdAt",
          r."authorId",
          r."categoryId"
        FROM "Resource" r
        WHERE r."status"    = 'PUBLISHED'
          AND r."deletedAt" IS NULL
          AND (r."visibility" IS NULL OR r."visibility" = 'PUBLIC')
          ${extraWhere}
      ),
      first_paid_downloads AS (
        SELECT
          al."entityId" AS "resourceId",
          COUNT(*)::int AS "fpd_count",
          MAX(al."createdAt") AS "last_activation_at"
        FROM "ActivityLog" al
        INNER JOIN base_resources br ON br."id" = al."entityId"
        WHERE al."action" = 'FIRST_PAID_DOWNLOAD'
          AND al."entity" = 'Resource'
        GROUP BY al."entityId"
      ),
      ranked AS (
        SELECT
          br."id",
          br."title",
          br."slug",
          br."price",
          br."isFree",
          br."featured",
          br."downloadCount",
          br."createdAt",
          br."authorId",
          br."categoryId",
          (
            LN(COALESCE(rs."purchases", 0) + 1) * 0.6
            + ((COALESCE(fpd."fpd_count", 0)::float + 3.0) / (COALESCE(rs."purchases", 0)::float + 6.0)) * 0.3
            + GREATEST(0.05, CASE
                WHEN fpd."last_activation_at" IS NOT NULL
                  AND EXTRACT(EPOCH FROM (NOW() - fpd."last_activation_at")) / 86400.0 < 7.0
                  THEN 1.0
                WHEN fpd."last_activation_at" IS NOT NULL
                  THEN 7.0 / (EXTRACT(EPOCH FROM (NOW() - fpd."last_activation_at")) / 86400.0)
                ELSE 0.05
              END) * 0.1
          ) AS "score"
        FROM base_resources br
        LEFT JOIN "resource_stats" rs ON rs."resourceId" = br."id"
        LEFT JOIN first_paid_downloads fpd ON fpd."resourceId" = br."id"
        ORDER BY "score" DESC NULLS LAST
        LIMIT  ${pageSize}
        OFFSET ${skip}
      )
      SELECT
        rnk."id",
        rnk."title",
        rnk."slug",
        rnk."price",
        rnk."isFree",
        rnk."featured",
        rnk."downloadCount",
        rnk."createdAt",
        u."name"     AS "authorName",
        c."id"       AS "categoryId",
        c."name"     AS "categoryName",
        c."slug"     AS "categorySlug",
        p."imageUrl" AS "previewImageUrl"
      FROM ranked rnk
      LEFT JOIN "User" u ON u."id" = rnk."authorId"
      LEFT JOIN "Category" c ON c."id" = rnk."categoryId"
      LEFT JOIN LATERAL (
        SELECT "imageUrl"
        FROM   "ResourcePreview"
        WHERE  "resourceId" = rnk."id"
        ORDER BY "order" ASC
        LIMIT  1
      ) p ON TRUE
      ORDER BY rnk."score" DESC NULLS LAST
    `);
}

// ── Ranking debug / observability ─────────────────────────────────────────────

/**
 * Full score-breakdown row for the admin ranking debug view.
 * Contains every intermediate value used in the composite score so that
 * each resource's rank position is fully explainable from a single row.
 *
 * This type is intentionally separate from `FindActivationRankedResourcesRow`
 * — production queries never carry these extra columns.
 */
export interface RankingDebugRow {
  id: string;
  title: string;
  slug: string;
  categoryName: string | null;
  categorySlug: string | null;
  /** Pre-aggregated purchase count from `resource_stats`. */
  purchases: number;
  /** Count of FIRST_PAID_DOWNLOAD ActivityLog events for this resource. */
  fpdCount: number;
  /**
   * Laplace-smoothed activation rate: (fpdCount + 3) / (purchases + 6).
   * A resource with zero data gets 0.500 (neutral), not 0 or 1.
   */
  adjActivationRate: number;
  /**
   * Recency component (0.05–1).
   * 1.0 when the last FIRST_PAID_DOWNLOAD was < 7 days ago.
   * Decays as 7 / daysSince for older activations, floored at 0.05.
   * 0.05 when the resource has no activations at all.
   */
  recencyBoost: number;
  /**
   * Final composite score used to order the "recommended" sort:
   *   ln(purchases + 1) × 0.6
   *   + adjActivationRate × 0.3
   *   + recencyBoost × 0.1
   */
  score: number;
}

export interface FindRankingDebugRowsParams {
  categoryId?: string;
  search?: string;
  isFree?: boolean;
  /** Maximum rows to return. Defaults to 50 for the debug view. */
  limit?: number;
}

/**
 * Returns resources ranked by the activation-weighted score, with every
 * intermediate score component exposed as a named column.
 *
 * Used exclusively by the admin ranking debug page.
 * Never called from production marketplace paths.
 */
export async function findRankingDebugRows(
  params: FindRankingDebugRowsParams,
): Promise<RankingDebugRow[]> {
  const { categoryId, search, isFree, limit = 50 } = params;

  const conditions: Prisma.Sql[] = [];

  if (categoryId) {
    conditions.push(Prisma.sql`AND r."categoryId" = ${categoryId}`);
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      Prisma.sql`AND (r."title" ILIKE ${pattern} OR r."description" ILIKE ${pattern})`,
    );
  }

  if (isFree !== undefined) {
    conditions.push(Prisma.sql`AND r."isFree" = ${isFree}`);
  }

  const extraWhere =
    conditions.length > 0 ? Prisma.join(conditions, "\n        ") : Prisma.empty;

  return prisma.$queryRaw<RankingDebugRow[]>(Prisma.sql`
    SELECT
      r."id",
      r."title",
      r."slug",
      c."name"  AS "categoryName",
      c."slug"  AS "categorySlug",

      -- Raw signal counts
      COALESCE(rs."purchases", 0)::int          AS "purchases",
      COALESCE(fpd.fpd_count,  0)::int          AS "fpdCount",

      -- Laplace-smoothed activation rate: (fpd + 3) / (purchases + 6)
      ROUND(
        ((COALESCE(fpd.fpd_count, 0)::numeric + 3.0)
          / (COALESCE(rs."purchases", 0)::numeric + 6.0))::numeric,
        4
      )::float AS "adjActivationRate",

      -- Recency boost: 1.0 if last activation < 7 days ago, then 7/daysSince, floor 0.05
      ROUND(
        GREATEST(0.05, CASE
          WHEN fpd.last_activation_at IS NOT NULL
            AND EXTRACT(EPOCH FROM (NOW() - fpd.last_activation_at)) / 86400.0 < 7.0
            THEN 1.0
          WHEN fpd.last_activation_at IS NOT NULL
            THEN 7.0 / (EXTRACT(EPOCH FROM (NOW() - fpd.last_activation_at)) / 86400.0)
          ELSE 0.05
        END)::numeric,
        4
      )::float AS "recencyBoost",

      -- Final composite score
      ROUND(
        (
          LN(COALESCE(rs."purchases", 0)::numeric + 1) * 0.6
          + ((COALESCE(fpd.fpd_count, 0)::numeric + 3.0)
              / (COALESCE(rs."purchases", 0)::numeric + 6.0)) * 0.3
          + GREATEST(0.05, CASE
              WHEN fpd.last_activation_at IS NOT NULL
                AND EXTRACT(EPOCH FROM (NOW() - fpd.last_activation_at)) / 86400.0 < 7.0
                THEN 1.0
              WHEN fpd.last_activation_at IS NOT NULL
                THEN 7.0 / (EXTRACT(EPOCH FROM (NOW() - fpd.last_activation_at)) / 86400.0)
              ELSE 0.05
            END) * 0.1
        )::numeric,
        4
      )::float AS "score"

    FROM "Resource" r
    LEFT JOIN "Category" c ON c."id" = r."categoryId"
    LEFT JOIN "resource_stats" rs ON rs."resourceId" = r."id"
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int    AS fpd_count,
        MAX("createdAt") AS last_activation_at
      FROM   "ActivityLog"
      WHERE  "action"   = 'FIRST_PAID_DOWNLOAD'
        AND  "entity"   = 'Resource'
        AND  "entityId" = r."id"
    ) fpd ON TRUE

    WHERE r."status"    = 'PUBLISHED'
      AND r."deletedAt" IS NULL
      AND (r."visibility" IS NULL OR r."visibility" = 'PUBLIC')
      ${extraWhere}

    ORDER BY "score" DESC NULLS LAST
    LIMIT ${limit}
  `);
}

export async function findPhase2CandidateResources(
  categoryIds: string[],
  tagIds: string[],
  excludeIds: string[],
  limit: number,
) {
  if (categoryIds.length === 0 && tagIds.length === 0) return [];

  return prisma.resource.findMany({
    where: {
      ...LISTED_RESOURCE_WHERE,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      OR: [
        ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
        ...(tagIds.length > 0
          ? [{ tags: { some: { tagId: { in: tagIds } } } }]
          : []),
      ],
    },
    select: PHASE2_CANDIDATE_SELECT,
    orderBy: [
      { resourceStat: { trendingScore: "desc" } },
      { createdAt: "desc" },
    ],
    take: limit,
  });
}
