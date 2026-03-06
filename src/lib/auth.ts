import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

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
    // Persist role + id in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error – role added in authorize()
        token.role = user.role;
      }

      // Keep subscription status in sync on every token refresh
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, subscriptionStatus: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.subscriptionStatus = dbUser.subscriptionStatus;
        }
      }

      return token;
    },

    // Expose role + id on the session object so the client can read them
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-expect-error – custom field
        session.user.role = token.role;
        // @ts-expect-error – custom field
        session.user.subscriptionStatus = token.subscriptionStatus;
      }
      return session;
    },
  },
};
