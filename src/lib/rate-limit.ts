/**
 * Rate limiting utility — KruCraft
 *
 * Uses @upstash/ratelimit backed by Upstash Redis.
 * Works in serverless (Vercel, Railway) and edge environments because it
 * uses HTTP to talk to Redis rather than a persistent TCP connection.
 *
 * Required environment variables (only needed in production):
 *   UPSTASH_REDIS_REST_URL      https://<id>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN    <token>
 *
 * If the env vars are absent (local dev) all calls return `{ success: true }`
 * so rate limiting is effectively disabled during development without any
 * code changes or mocking required.
 *
 * Usage inside a Next.js route handler:
 *
 *   import { checkRateLimit, LIMITS } from "@/lib/rate-limit";
 *
 *   const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
 *   const { success, limit, remaining, reset } =
 *     await checkRateLimit(LIMITS.download, ip);
 *
 *   if (!success) {
 *     return NextResponse.json(
 *       { error: "Too many requests. Please try again shortly." },
 *       {
 *         status: 429,
 *         headers: {
 *           "X-RateLimit-Limit":     String(limit),
 *           "X-RateLimit-Remaining": String(remaining),
 *           "X-RateLimit-Reset":     String(reset),
 *           "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
 *         },
 *       }
 *     );
 *   }
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  /** Configured request limit for this window. */
  limit: number;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Unix timestamp (ms) when the current window resets. */
  reset: number;
}

// ── Limiter factory ───────────────────────────────────────────────────────────

/**
 * Build a sliding-window rate limiter.
 * Returns a no-op limiter when Upstash env vars are not configured.
 */
function makeLimiter(requests: number, windowSeconds: number) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Dev fallback — always allow, never throw.
    return null;
  }

  const redis = new Redis({ url, token });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
    analytics: false,
    prefix: "krucraft:rl",
  });
}

// ── Named limiters ────────────────────────────────────────────────────────────
//
// Each limiter is instantiated once at module load time (singleton per
// process).  In serverless the module may be re-initialised between cold
// starts, but that is acceptable.

export const LIMITS = {
  /** File downloads: 10 per minute per IP. */
  download: makeLimiter(10, 60),

  /** File uploads: 20 per minute per IP (admin only, but still limited). */
  upload: makeLimiter(20, 60),

  /** Checkout initiation: 5 per minute per IP to prevent cart-stuffing. */
  checkout: makeLimiter(5, 60),

  /** Review writes: 5 per minute per IP to prevent spam edits/submissions. */
  reviewWrite: makeLimiter(5, 60),

  /** Hero analytics: 30 per minute per IP to reduce impression/click spam. */
  heroAnalytics: makeLimiter(30, 60),
} as const;

// ── Public helper ─────────────────────────────────────────────────────────────

/**
 * Check whether `identifier` (typically an IP address) has exceeded the rate
 * limit for `limiter`.
 *
 * Always resolves — never throws.  If Upstash is unavailable or the limiter
 * is null (dev mode) the call succeeds with max remaining capacity.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // Dev mode or limiter not configured — allow all requests.
    return { success: true, limit: Infinity, remaining: Infinity, reset: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success:   result.success,
      limit:     result.limit,
      remaining: result.remaining,
      reset:     result.reset,
    };
  } catch (err) {
    // If Redis is unreachable, fail open (allow the request) and log.
    // This prevents a Redis outage from taking down the whole application.
    console.error("[rate-limit] Redis error — failing open:", err);
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
}

// ── IP extraction helper ──────────────────────────────────────────────────────

/**
 * Extract the best available client IP from a Next.js Request object.
 *
 * Cloudflare sets CF-Connecting-IP; load balancers typically set
 * X-Forwarded-For.  Falls back to "unknown" so the limiter can still
 * apply a shared bucket rather than failing.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
