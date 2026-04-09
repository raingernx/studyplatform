import { redirect } from "next/navigation";

import { getCachedServerSession } from "@/lib/auth";
import { getServerAuthTokenSnapshot } from "@/lib/auth/token-snapshot";
import { routes } from "@/lib/routes";

type CreatorProtectedUserContext = {
  userId: string;
  userName: string | null;
};

export async function getCreatorProtectedUserContext(
  nextPath: string,
): Promise<CreatorProtectedUserContext> {
  const tokenSnapshot = await getServerAuthTokenSnapshot();
  const session =
    !tokenSnapshot.authenticated || !tokenSnapshot.userId
      ? await getCachedServerSession()
      : null;

  const userId = tokenSnapshot.userId ?? session?.user?.id ?? null;

  if (!userId) {
    redirect(routes.loginWithNext(nextPath));
  }

  return {
    userId,
    userName: tokenSnapshot.name ?? session?.user?.name ?? null,
  };
}
