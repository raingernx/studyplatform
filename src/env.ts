import "server-only";

import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    // Optional for app runtime. Prisma CLI commands that use `directUrl` still
    // need DIRECT_URL because `prisma/schema.prisma` declares it explicitly.
    DIRECT_URL: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
    VERCEL_URL: z.string().min(1).optional(),
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
    STRIPE_PRO_MONTHLY_PRICE_ID: z
      .string()
      .min(1, "STRIPE_PRO_MONTHLY_PRICE_ID is required"),
    STRIPE_PRO_ANNUAL_PRICE_ID: z
      .string()
      .min(1, "STRIPE_PRO_ANNUAL_PRICE_ID is required"),
    STRIPE_TEAM_MONTHLY_PRICE_ID: z
      .string()
      .min(1, "STRIPE_TEAM_MONTHLY_PRICE_ID is required"),
    STRIPE_TEAM_ANNUAL_PRICE_ID: z
      .string()
      .min(1, "STRIPE_TEAM_ANNUAL_PRICE_ID is required"),
    XENDIT_SECRET_KEY: z.string().min(1).optional(),
    XENDIT_WEBHOOK_TOKEN: z.string().min(1).optional(),
    R2_ENDPOINT: z.string().url().optional(),
    R2_BUCKET: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_PUBLIC_URL: z.string().url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    PERFORMANCE_WARM_SECRET: z.string().min(1).optional(),
    PERFORMANCE_DEBUG_LOGS: z.enum(["0", "1"]).optional(),
    PERFORMANCE_MONITORING: z.enum(["0", "1"]).optional(),
    PERFORMANCE_SLOW_QUERY_MS: z.string().regex(/^\d+$/).optional(),
  })
  .superRefine((value, ctx) => {
    const addGroupedIssue = (keys: string[], message: string) => {
      for (const key of keys) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message,
        });
      }
    };

    const hasGoogle = Boolean(value.GOOGLE_CLIENT_ID || value.GOOGLE_CLIENT_SECRET);
    if (hasGoogle && (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET)) {
      addGroupedIssue(
        ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
        "Google OAuth requires both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      );
    }

    const hasXendit = Boolean(value.XENDIT_SECRET_KEY || value.XENDIT_WEBHOOK_TOKEN);
    if (hasXendit && (!value.XENDIT_SECRET_KEY || !value.XENDIT_WEBHOOK_TOKEN)) {
      addGroupedIssue(
        ["XENDIT_SECRET_KEY", "XENDIT_WEBHOOK_TOKEN"],
        "Xendit requires both XENDIT_SECRET_KEY and XENDIT_WEBHOOK_TOKEN.",
      );
    }

    const r2Keys = [
      value.R2_ENDPOINT,
      value.R2_BUCKET,
      value.R2_ACCESS_KEY_ID,
      value.R2_SECRET_ACCESS_KEY,
    ];
    const hasSomeR2 = r2Keys.some(Boolean);
    const hasAllR2 = r2Keys.every(Boolean);
    if (hasSomeR2 && !hasAllR2) {
      addGroupedIssue(
        ["R2_ENDPOINT", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"],
        "R2 storage requires R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY together.",
      );
    }

    const hasUpstash = Boolean(value.UPSTASH_REDIS_REST_URL || value.UPSTASH_REDIS_REST_TOKEN);
    if (hasUpstash && (!value.UPSTASH_REDIS_REST_URL || !value.UPSTASH_REDIS_REST_TOKEN)) {
      addGroupedIssue(
        ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
        "Upstash rate limiting requires both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
  });

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => {
      const path = issue.path.join(".") || "env";
      return `${path}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${issues}`);
}

const data = parsedEnv.data;

export const env = {
  ...data,
  directUrlConfigured: Boolean(data.DIRECT_URL),
  googleOAuthConfigured: Boolean(data.GOOGLE_CLIENT_ID && data.GOOGLE_CLIENT_SECRET),
  xenditConfigured: Boolean(data.XENDIT_SECRET_KEY && data.XENDIT_WEBHOOK_TOKEN),
  r2Configured: Boolean(
    data.R2_ENDPOINT &&
      data.R2_BUCKET &&
      data.R2_ACCESS_KEY_ID &&
      data.R2_SECRET_ACCESS_KEY,
  ),
  upstashConfigured: Boolean(
    data.UPSTASH_REDIS_REST_URL && data.UPSTASH_REDIS_REST_TOKEN,
  ),
  appBaseUrl:
    data.NEXTAUTH_URL ??
    (data.VERCEL_URL ? `https://${data.VERCEL_URL}` : "http://localhost:3000"),
} as const;
