import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth";

/**
 * Asserts that the current request has a valid authenticated session with a
 * non-empty userId, redirecting to /auth/login otherwise.
 *
 * Returns both the validated `userId` string and the full `session` object so
 * callers that need other session fields (role, name, subscriptionStatus, etc.)
 * do not need a second `getServerSession` call.
 *
 * @param nextPath - The path to pass as `?next=` in the login redirect URL.
 *
 * @example
 * // Only userId needed:
 * const { userId } = await requireSession("/dashboard/library");
 *
 * // Both userId and other session fields needed:
 * const { userId, session } = await requireSession("/dashboard");
 * const firstName = session.user.name?.split(" ")[0];
 */
export async function requireSession(nextPath: string) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect(`/auth/login?next=${nextPath}`);
  }
  // TypeScript narrows: redirect() returns `never`, so session is Session
  // (non-null) and session.user.id is a truthy string past this point.
  return { userId: session.user.id, session };
}
