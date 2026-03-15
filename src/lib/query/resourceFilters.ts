/**
 * Shared Prisma `where` fragments for Resource queries.
 *
 * Using a single constant prevents the "listed" definition from drifting
 * across the seven+ call-sites that query published resources.
 *
 * What "listed" means:
 *   - status = PUBLISHED  (drafts and archived resources are hidden)
 *   - deletedAt = null    (soft-deleted resources are hidden)
 *
 * Note: the `visibility` field (PUBLIC | UNLISTED) is intentionally omitted
 * from this base filter.  Unlisted resources are still accessible by direct
 * URL; they are only excluded from specific listing queries where indicated.
 */
export const LISTED_RESOURCE_WHERE = {
  status: "PUBLISHED" as const,
  deletedAt: null,
} satisfies import("@prisma/client").Prisma.ResourceWhereInput;

/**
 * Extends LISTED_RESOURCE_WHERE to also exclude UNLISTED resources.
 * Use this for public-facing browse/search endpoints where unlisted
 * resources should not appear in results.
 */
export const PUBLIC_RESOURCE_WHERE = {
  ...LISTED_RESOURCE_WHERE,
  OR: [{ visibility: null }, { visibility: "PUBLIC" as const }],
} satisfies import("@prisma/client").Prisma.ResourceWhereInput;
