/**
 * Canonical activity logger.
 *
 * This is the single source of truth for all activity logging in the project.
 * `activityLogger.ts` has been removed — all callers import from this file.
 *
 * Supported call signatures (both are accepted — callers need not change):
 *
 *   // New canonical shape (preferred)
 *   logActivity({ userId, action, entity, entityId, metadata, ip, userAgent })
 *
 *   // Legacy shape used by admin routes
 *   logActivity({ userId, action, entityType, entityId, meta })
 *
 * The function normalises both shapes transparently.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface LogActivityOptions {
  userId?: string | null;
  action: string;
  /** Canonical field name (preferred). Falls back to `entityType`. */
  entity?: string | null;
  /** Legacy alias for `entity`. Accepted for backwards compatibility. */
  entityType?: string | null;
  entityId?: string | null;
  /** Canonical field name (preferred). Falls back to `meta`. */
  metadata?: Record<string, unknown> | null;
  /** Legacy alias for `metadata`. Accepted for backwards compatibility. */
  meta?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

// Keep the old name exported so any file that imported ActivityLogOptions
// from activityLogger and switched to activity.ts still compiles.
export type { LogActivityOptions as ActivityLogOptions };

function toActivityMetadata(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonObject | undefined {
  if (value == null) {
    return undefined;
  }

  return value as Prisma.InputJsonObject;
}

export async function logActivity({
  userId,
  action,
  entity,
  entityType,
  entityId,
  metadata,
  meta,
  ip,
  userAgent,
}: LogActivityOptions): Promise<void> {
  // Normalise: prefer the canonical name, fall back to the legacy alias
  const resolvedEntity = entity ?? entityType ?? undefined;
  const resolvedMetadata = toActivityMetadata(metadata ?? meta ?? undefined);

  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? undefined,
        action,
        entity: resolvedEntity,
        entityId: entityId ?? undefined,
        metadata: resolvedMetadata,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (err) {
    // Activity logging must never break primary flows.
    // eslint-disable-next-line no-console
    console.error("[ACTIVITY_LOG_ERROR]", err);
  }
}
