import "server-only";
import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances in development (hot reload)
declare global {
  var prisma: PrismaClient | undefined;
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

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
