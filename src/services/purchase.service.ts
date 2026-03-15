/**
 * Purchase Service
 *
 * Centralises all Prisma queries that read or check Purchase rows so that
 * individual page components and API routes stay free of raw DB logic.
 */

import { prisma } from "@/lib/prisma";

// ── Ownership checks ──────────────────────────────────────────────────────────

/**
 * Returns true when the given user has a COMPLETED purchase for resourceId.
 * Used by the download route and resource detail page.
 */
export async function hasPurchased(userId: string, resourceId: string): Promise<boolean> {
  const purchase = await prisma.purchase.findFirst({
    where: { userId, resourceId, status: "COMPLETED" },
    select: { id: true },
  });
  return purchase !== null;
}

/**
 * Returns the set of resourceIds the user has COMPLETED purchases for.
 * Used by listing pages to mark owned cards.
 */
export async function getOwnedResourceIds(userId: string): Promise<Set<string>> {
  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    select: { resourceId: true },
  });
  return new Set(purchases.map((p) => p.resourceId));
}

/**
 * Returns the owned resourceIds from a specific subset (e.g. related resources).
 * More efficient than getOwnedResourceIds when only a small set needs checking.
 */
export async function getOwnedIdsFromSet(
  userId: string,
  resourceIds: string[]
): Promise<string[]> {
  if (resourceIds.length === 0) return [];
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      resourceId: { in: resourceIds },
      status: "COMPLETED",
    },
    select: { resourceId: true },
  });
  return purchases.map((p) => p.resourceId);
}

// ── Checkout helpers ──────────────────────────────────────────────────────────

/**
 * Returns the existing Purchase row for a user+resource pair, or null.
 * Used by checkout routes for idempotency / duplicate-purchase guards.
 */
export async function getExistingPurchase(userId: string, resourceId: string) {
  return prisma.purchase.findFirst({
    where: { userId, resourceId },
  });
}

// ── User purchase history ─────────────────────────────────────────────────────

/** Standard include for purchase history lists (library, downloads, purchases page). */
const PURCHASE_WITH_RESOURCE_INCLUDE = {
  resource: {
    select: {
      id:            true,
      title:         true,
      slug:          true,
      description:   true,
      previewUrl:    true,
      isFree:        true,
      price:         true,
      mimeType:      true,
      fileKey:       true,
      fileUrl:       true,
      downloadCount: true,
      author:        { select: { id: true, name: true } },
      category:      { select: { id: true, name: true, slug: true } },
      previews:      { orderBy: { order: "asc" as const }, select: { imageUrl: true } },
    },
  },
} as const;

/**
 * Returns all COMPLETED purchases for a user, ordered newest first.
 * Covers dashboard, library, and downloads pages.
 */
export async function getUserPurchases(userId: string) {
  return prisma.purchase.findMany({
    where: { userId, status: "COMPLETED" },
    include: PURCHASE_WITH_RESOURCE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns all purchases (any status) for a user, ordered newest first.
 * Used by the purchases history page which shows PENDING / FAILED records too.
 */
export async function getUserPurchaseHistory(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    include: PURCHASE_WITH_RESOURCE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}
