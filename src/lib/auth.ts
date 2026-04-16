import { cache } from "react";
import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { env } from "@/env";
import { prisma } from "./prisma";
import {
  isMissingTableError,
  isTransientPrismaInfrastructureError,
} from "./prismaErrors";
import { routes } from "./routes";

// ── JWT role cache ────────────────────────────────────────────────────────────
//
// The JWT callback previously hit the database on every single request to
// keep `role` and `subscriptionStatus` in sync.  At any meaningful traffic
// level this is the single biggest source of unnecessary DB load.
//
// This module-level Map caches the two fields for 60 seconds per user.
// A role change (e.g. STUDENT → ADMIN) takes effect within one minute,
// which is acceptable for this use case.
//
// NOTE: This cache is per-process.  In a multi-instance (serverless) deployment
// each instance maintains its own cache — the worst case is one extra DB call
// per instance per TTL window, not one per request.

const JWT_ROLE_CACHE_TTL_MS = 60_000; // 60 seconds

type AppUserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT";

interface RoleCacheEntry {
  role: AppUserRole;
  subscriptionStatus: string | null;
  cachedAt: number; // Date.now() timestamp
}

const roleCache = new Map<string, RoleCacheEntry>();

/**
 * Return the cached role/subscriptionStatus for `userId` if the entry exists
 * and has not yet expired.  Returns `null` on cache miss so the caller can
 * fall through to a fresh DB query.
 */
function getCachedRole(userId: string): Omit<RoleCacheEntry, "cachedAt"> | null {
  const entry = roleCache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > JWT_ROLE_CACHE_TTL_MS) {
    roleCache.delete(userId);
    return null;
  }
  return { role: entry.role, subscriptionStatus: entry.subscriptionStatus };
}

/** Write or refresh a role cache entry for `userId`. */
function setCachedRole(
  userId: string,
  role: AppUserRole,
  subscriptionStatus: string | null
): void {
  roleCache.set(userId, { role, subscriptionStatus, cachedAt: Date.now() });
}

function backoffTokenRoleRefresh(
  token: Record<string, unknown>,
  userId: string,
  now: number,
) {
  const fallbackRole =
    typeof token.role === "string"
      ? (token.role as AppUserRole)
      : "STUDENT";
  const fallbackSubscriptionStatus =
    typeof token.subscriptionStatus === "string"
      ? token.subscriptionStatus
      : null;

  token.role = fallbackRole;
  token.subscriptionStatus = fallbackSubscriptionStatus ?? undefined;
  token.roleRefreshedAt = now;
  setCachedRole(userId, fallbackRole, fallbackSubscriptionStatus);
}

function getOAuthProfileImage(
  profile: unknown,
  fallbackImage: string | null | undefined,
): string | null {
  if (profile && typeof profile === "object") {
    const picture =
      "picture" in profile && typeof profile.picture === "string"
        ? profile.picture.trim()
        : "image" in profile && typeof profile.image === "string"
          ? profile.image.trim()
          : "";

    if (picture.length > 0) {
      return picture;
    }
  }

  const fallback = fallbackImage?.trim();
  return fallback && fallback.length > 0 ? fallback : null;
}

// ── Auth options ──────────────────────────────────────────────────────────────

const providers = [
  ...(env.googleOAuthConfigured
    ? [
        (() => {
          const clientId = env.GOOGLE_CLIENT_ID;
          const clientSecret = env.GOOGLE_CLIENT_SECRET;

          if (!clientId || !clientSecret) {
            throw new Error("Google OAuth configuration is incomplete.");
          }

          return GoogleProvider({
            clientId,
            clientSecret,
          });
        })(),
      ]
    : []),
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required.");
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.hashedPassword) {
        throw new Error("No account found with that email.");
      }

      const passwordMatch = await bcrypt.compare(
        credentials.password,
        user.hashedPassword
      );

      if (!passwordMatch) {
        throw new Error("Incorrect password.");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

export const authOptions: NextAuthOptions = {
  // @ts-expect-error – PrismaAdapter type mismatch between next-auth v4 and @auth/prisma-adapter v2
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: routes.login,
    error: routes.login,
  },
  providers,

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.id) {
        return true;
      }

      const providerImage = getOAuthProfileImage(
        profile,
        typeof user.image === "string" ? user.image : null,
      );

      if (!providerImage) {
        return true;
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { image: true, providerImage: true },
        });

        const shouldTrackProviderAsCurrentImage =
          !existingUser?.image || existingUser.image === existingUser.providerImage;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            providerImage,
            ...(shouldTrackProviderAsCurrentImage ? { image: providerImage } : {}),
          },
        });

        if (shouldTrackProviderAsCurrentImage) {
          user.image = providerImage;
        }
      } catch (error) {
        if (!isMissingTableError(error)) {
          console.error("[AUTH] Failed to sync provider avatar:", error);
        }
      }

      return true;
    },

    // Persist role + id in the JWT, keeping them in sync with the DB via
    // the in-memory role cache (max one DB call per user per 60 seconds).
    async jwt({ token, user, trigger, session }) {
      const now = Date.now();

      // On first sign-in `user` is populated — write to cache immediately.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.role =
          (user.role as AppUserRole | undefined) ??
          (token.role as AppUserRole | undefined) ??
          "STUDENT";
        token.subscriptionStatus =
          user.subscriptionStatus ?? token.subscriptionStatus ?? undefined;
        token.roleRefreshedAt = now;
        setCachedRole(user.id!, token.role, token.subscriptionStatus ?? null);
      }

      if (trigger === "update" && session && typeof session === "object") {
        const nextName =
          "name" in session && typeof session.name === "string" ? session.name : token.name;
        const nextEmail =
          "email" in session && typeof session.email === "string" ? session.email : token.email;
        const nextImage =
          "image" in session
            ? typeof session.image === "string"
              ? session.image
              : null
            : token.picture ?? null;

        token.name = nextName;
        token.email = nextEmail;
        token.picture = nextImage;
      }

      // On every subsequent token refresh check the cache first.
      if (token.id) {
        const userId = token.id as string;
        const hasFreshTokenRole =
          typeof token.role === "string" &&
          typeof token.roleRefreshedAt === "number" &&
          now - token.roleRefreshedAt < JWT_ROLE_CACHE_TTL_MS;

        if (hasFreshTokenRole) {
          setCachedRole(
            userId,
            token.role as AppUserRole,
            token.subscriptionStatus ?? null,
          );
          return token;
        }

        const cached = getCachedRole(userId);

        if (cached) {
          // Cache hit — no DB round trip needed.
          token.role = cached.role;
          token.subscriptionStatus = cached.subscriptionStatus ?? undefined;
          token.roleRefreshedAt = now;
        } else {
          // Cache miss — query the DB and refresh the cache.
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { role: true, subscriptionStatus: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.subscriptionStatus = dbUser.subscriptionStatus ?? undefined;
              token.roleRefreshedAt = now;
              setCachedRole(userId, dbUser.role, dbUser.subscriptionStatus);
            }
          } catch (error) {
            if (isTransientPrismaInfrastructureError(error)) {
              backoffTokenRoleRefresh(token, userId, now);
            } else if (!isMissingTableError(error)) {
              throw error;
            }
            // User table missing (local dev schema drift) — keep existing token values.
          }
        }
      }

      return token;
    },

    // Expose role + id on the session object so the client can read them.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.image =
          typeof token.picture === "string" || token.picture === null
            ? token.picture
            : session.user.image;
        session.user.role = token.role ?? "STUDENT";
        session.user.subscriptionStatus = token.subscriptionStatus ?? undefined;
      }
      return session;
    },
  },
};

export const getCachedServerSession = cache(() => getServerSession(authOptions));
