import "server-only";

import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import { NextRequest as ServerNextRequest } from "next/server";

type AppUserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

export interface AuthTokenSnapshot {
  authenticated: boolean;
  userId: string | null;
  name: string | null;
  email: string | null;
  image: string | null;
  role: AppUserRole | null;
  subscriptionStatus: string | null;
}

function getStringClaim(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toSnapshot(token: JWT | null): AuthTokenSnapshot {
  const userId = getStringClaim(token?.id) ?? getStringClaim(token?.sub);

  return {
    authenticated: Boolean(userId),
    userId,
    name: getStringClaim(token?.name),
    email: getStringClaim(token?.email),
    image:
      getStringClaim(token?.picture) ??
      getStringClaim((token as { image?: unknown } | null)?.image),
    role: getStringClaim(token?.role) as AppUserRole | null,
    subscriptionStatus: getStringClaim(token?.subscriptionStatus),
  };
}

export async function getAuthTokenSnapshot(
  req: NextRequest,
): Promise<AuthTokenSnapshot> {
  const token = await getToken({ req });
  return toSnapshot(token);
}

export async function getServerAuthTokenSnapshot(): Promise<AuthTokenSnapshot> {
  const requestHeaders = new Headers(await headers());
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "dashboard.local";

  const req = new ServerNextRequest(`${protocol}://${host}/auth/token-snapshot`, {
    headers: requestHeaders,
  });

  return getAuthTokenSnapshot(req);
}
