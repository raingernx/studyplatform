import Xendit from "xendit-node";
import { env } from "@/env";

// Server-side Xendit client (secret key).
// Mirrors the pattern used in src/lib/stripe.ts.
export const xenditClient = env.xenditConfigured
  ? (() => {
      if (!env.XENDIT_SECRET_KEY) {
        throw new Error("Xendit configuration is incomplete.");
      }

      return new Xendit({
        secretKey: env.XENDIT_SECRET_KEY,
      });
    })()
  : null;

// ---------------------------------------------------------------------------
// Webhook callback token verification.
//
// Xendit secures incoming webhook calls with a static callback token that you
// set in the Xendit dashboard (Settings → Callbacks → Callback token).
// Set XENDIT_WEBHOOK_TOKEN in your .env to the same value.
//
// Usage in the webhook handler:
//   verifyXenditWebhook(req.headers.get("x-callback-token"))
// ---------------------------------------------------------------------------
export function verifyXenditWebhook(token: string | null): boolean {
  if (!token || !env.xenditConfigured) return false;
  return token === env.XENDIT_WEBHOOK_TOKEN;
}
