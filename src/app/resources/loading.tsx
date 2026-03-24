import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { isMissingTableError } from "@/lib/prismaErrors";
import { getHeroConfig } from "@/services/discover.service";
import { ResourcesLoadingState } from "./ResourcesLoadingState";

function hasSessionTokenCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return cookieStore.getAll().some(({ name }) =>
    name === "next-auth.session-token" ||
    name === "__Secure-next-auth.session-token" ||
    name === "authjs.session-token" ||
    name === "__Secure-authjs.session-token",
  );
}

export default async function Loading() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    cookieStore = null;
  }

  let session: Session | null = null;
  if (cookieStore && hasSessionTokenCookie(cookieStore)) {
    try {
      session = await getServerSession(authOptions);
    } catch (error) {
      if (!isMissingTableError(error)) {
        throw error;
      }
    }
  }

  let heroConfig: Awaited<ReturnType<typeof getHeroConfig>> = null;
  try {
    heroConfig = await getHeroConfig({ userId: session?.user?.id });
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  return <ResourcesLoadingState heroConfig={heroConfig} />;
}
