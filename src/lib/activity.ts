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

const SYNTHETIC_ACTIVITY_USER_AGENTS = [
  /^KruCraft-Warmup\/1\.0/i,
  /^k6\//i,
] as const;
const ANONYMOUS_RESOURCE_VIEW_LOG_COOLDOWN_MS = 60_000;

let anonymousResourceViewLogCooldownUntil = 0;

function toActivityMetadata(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonObject | undefined {
  if (value == null) {
    return undefined;
  }

  return value as Prisma.InputJsonObject;
}

export function isSyntheticActivityUserAgent(userAgent?: string | null) {
  if (!userAgent) {
    return false;
  }

  return SYNTHETIC_ACTIVITY_USER_AGENTS.some((pattern) => pattern.test(userAgent));
}

function isAnonymousResourceViewActivity(
  userId: string | null | undefined,
  action: string,
  entity: string | null | undefined,
) {
  return !userId && action === "RESOURCE_VIEW" && entity === "Resource";
}

function isActivityLogDatabaseError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Can't reach database server") ||
    message.includes("Error in PostgreSQL connection") ||
    message.includes("kind: Closed")
  );
}

function getActivityErrorSummary(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
    };
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: String(error),
  };
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
  const isAnonymousResourceView = isAnonymousResourceViewActivity(
    userId,
    action,
    resolvedEntity,
  );

  if (isSyntheticActivityUserAgent(userAgent)) {
    return;
  }

  if (
    isAnonymousResourceView &&
    anonymousResourceViewLogCooldownUntil > Date.now()
  ) {
    return;
  }

  try {
    await prisma.activityLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity: resolvedEntity,
        entityId: entityId ?? undefined,
        metadata: resolvedMetadata,
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (err) {
    // If the userId FK is stale (user deleted after the session was issued),
    // retry once as an anonymous log so the event data is still preserved.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003" &&
      typeof err.meta?.field_name === "string" &&
      err.meta.field_name.includes("userId")
    ) {
      console.warn("[ACTIVITY_LOG] userId FK miss — retrying as anonymous log");
      try {
        await prisma.activityLog.create({
          data: {
            userId: null,
            action,
            entity: resolvedEntity,
            entityId: entityId ?? undefined,
            metadata: resolvedMetadata,
            ip: ip ?? undefined,
            userAgent: userAgent ?? undefined,
          },
        });
      } catch {
        // Swallow — activity logging must never break primary flows.
      }
      return;
    }

    const errorSummary = {
      action,
      entity: resolvedEntity ?? null,
      entityId: entityId ?? null,
      userIdPresent: Boolean(userId),
      ...getActivityErrorSummary(err),
    };

    if (isActivityLogDatabaseError(err)) {
      if (isAnonymousResourceView) {
        anonymousResourceViewLogCooldownUntil =
          Date.now() + ANONYMOUS_RESOURCE_VIEW_LOG_COOLDOWN_MS;
        console.info("[ACTIVITY_LOG_INFO]", {
          ...errorSummary,
          cooldownMs: ANONYMOUS_RESOURCE_VIEW_LOG_COOLDOWN_MS,
          suppressedAnonymousResourceView: true,
        });
        return;
      }

      console.warn("[ACTIVITY_LOG_WARN]", errorSummary);
      return;
    }

    console.error("[ACTIVITY_LOG_ERROR]", errorSummary);
  }
}
