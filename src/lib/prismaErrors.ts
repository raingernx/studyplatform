import { Prisma } from "@prisma/client";

/**
 * Returns true when a Prisma error is caused by the underlying table not
 * existing in the database — i.e. the deployed schema is behind the Prisma
 * schema (pending migration).
 *
 * P2021 — model-based query on a missing table
 * P2010 — raw query failed because a Postgres relation does not exist
 *
 * Callers MUST re-throw everything else so unrelated database errors are
 * never silently swallowed.
 *
 * NOTE: PrismaClientInitializationError (connection refused, access denied,
 * wrong credentials) is intentionally NOT caught here. Those errors must
 * surface so misconfigured DATABASE_URL is immediately visible.
 */
export function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2021") return true;
  if (error.code === "P2010") {
    return error.message.includes("does not exist");
  }
  return false;
}

/**
 * Returns true only for transient Prisma infrastructure failures such as
 * connection-pool exhaustion, abruptly closed connections, or temporary
 * database reachability issues.
 *
 * Callers MUST still re-throw non-transient errors so logic/data bugs remain
 * visible and critical paths do not silently degrade.
 */
export function isTransientPrismaInfrastructureError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2024" || error.code === "P1017";
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("timed out fetching a new connection") ||
    message.includes("connection pool") ||
    message.includes("pool timeout") ||
    message.includes("server has closed the connection") ||
    message.includes("connection terminated") ||
    message.includes("connection closed") ||
    message.includes("can't reach database server") ||
    message.includes("cannot reach database server") ||
    message.includes("error in postgresql connection") ||
    message.includes("kind: closed")
  );
}
