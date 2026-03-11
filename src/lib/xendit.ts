import Xendit from "xendit-node";

// Server-side Xendit client (secret key).
// Mirrors the pattern used in src/lib/stripe.ts.
export const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
});

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
  if (!token) return false;
  return token === process.env.XENDIT_WEBHOOK_TOKEN;
}
