import "server-only";
import { PrismaClient } from "@prisma/client";
import {
  isPerformanceMonitoringEnabled,
  recordPrismaQuery,
} from "@/lib/performance/observability";

// Prevent multiple Prisma instances in development (hot reload)
declare global {
  var prisma: PrismaClient | undefined;
  var prismaPerformanceMiddlewareAttached: boolean | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    // "query" removed — per-query stdout logging is too noisy for normal dev use.
    // "error" removed — Prisma emits error log events before our catch blocks run,
    //   causing duplicate output for expected errors (e.g. P2003 FK misses).
    //   Application-level catch blocks surface unexpected errors via console.error.
    // "warn" kept — Prisma-level connection, schema, and deprecation warnings remain visible.
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
  });

if (isPerformanceMonitoringEnabled() && !global.prismaPerformanceMiddlewareAttached) {
  prisma.$use(async (params, next) => {
    const startedAt = Date.now();

    try {
      return await next(params);
    } finally {
      recordPrismaQuery({
        model: params.model,
        action: params.action,
        durationMs: Date.now() - startedAt,
      });
    }
  });

  global.prismaPerformanceMiddlewareAttached = true;
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
