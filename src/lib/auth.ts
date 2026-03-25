import { cache } from "react";
import { getServerSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { isMissingTableError } from "./prismaErrors";

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

// ── Auth options ──────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  // @ts-expect-error – PrismaAdapter type mismatch between next-auth v4 and @auth/prisma-adapter v2
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [
    // ── OAuth ────────────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Email + Password ─────────────────────────────────────────────────────
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
  ],

  callbacks: {
    // Persist role + id in the JWT, keeping them in sync with the DB via
    // the in-memory role cache (max one DB call per user per 60 seconds).
    async jwt({ token, user }) {
      const now = Date.now();

      // On first sign-in `user` is populated — write to cache immediately.
      if (user) {
        token.id = user.id;
        token.role =
          (user.role as AppUserRole | undefined) ??
          (token.role as AppUserRole | undefined) ??
          "STUDENT";
        token.subscriptionStatus =
          user.subscriptionStatus ?? token.subscriptionStatus ?? undefined;
        token.roleRefreshedAt = now;
        setCachedRole(user.id!, token.role, token.subscriptionStatus ?? null);
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
            if (!isMissingTableError(error)) throw error;
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
        session.user.role = token.role ?? "STUDENT";
        session.user.subscriptionStatus = token.subscriptionStatus ?? undefined;
      }
      return session;
    },
  },
};

export const getCachedServerSession = cache(() => getServerSession(authOptions));
