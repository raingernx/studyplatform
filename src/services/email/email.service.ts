/**
 * Post-purchase confirmation email service.
 *
 * This email is NOT a receipt.  It is an activation surface — sent immediately
 * after a purchase is webhook-confirmed to recover users who left their browser
 * session before downloading.
 *
 * Architecture:
 *   - Called from Stripe and Xendit webhook services (fire-and-forget)
 *   - Resolves user email and resource context via repositories
 *   - Never throws — email failures must NEVER affect webhook reliability
 *   - Sends exactly once per completed purchase (inherited from webhook idempotency)
 */

import { getResendClient } from "@/lib/resend";
import { routes } from "@/lib/routes";
import { env } from "@/env";
import { findCheckoutUserById } from "@/repositories/users/user.repository";
import { findResourceEmailContext } from "@/repositories/resources/resource.repository";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendPurchaseConfirmationEmailInput {
  /** The userId stored on the completed Purchase row. */
  userId: string;
  /** The resourceId stored on the completed Purchase row. */
  resourceId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal HTML entity escaping for values interpolated into the template. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Template ──────────────────────────────────────────────────────────────────

interface TemplateInput {
  userName: string | null;
  resourceTitle: string;
  authorName: string | null;
  /** Direct download — /api/download/:resourceId. Works when session is active. */
  downloadUrl: string;
  /** Resource page with ?payment=success — activates PendingPurchasePoller. */
  resourceUrl: string;
}

function buildConfirmationEmailHtml(input: TemplateInput): string {
  const greeting = input.userName ? `Hi ${esc(input.userName)},` : "Hi there,";
  const byLine = input.authorName
    ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">by ${esc(input.authorName)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Your download is ready</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;max-width:520px;width:100%;overflow:hidden;">

          <!-- ── Header ───────────────────────────────────────────────────── -->
          <tr>
            <td style="background:#18181b;padding:18px 32px;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">KruCraft</p>
            </td>
          </tr>

          <!-- ── Body ─────────────────────────────────────────────────────── -->
          <tr>
            <td style="padding:32px;">

              <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.5;">${greeting}</p>

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;letter-spacing:-0.02em;">
                You&rsquo;re all set &mdash; download your resource
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                Your payment was confirmed. Your file is ready whenever you are.
              </p>

              <!-- Resource card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0;font-size:16px;font-weight:700;color:#111827;line-height:1.4;">${esc(input.resourceTitle)}</p>
                    ${byLine}
                  </td>
                </tr>
              </table>

              <!-- Primary CTA: direct download -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:14px;">
                <tr>
                  <td>
                    <a href="${input.downloadUrl}"
                       style="display:block;text-align:center;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;letter-spacing:-0.01em;">
                      Download now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Secondary CTA: resource page -->
              <p style="margin:0 0 28px;text-align:center;font-size:13px;color:#9ca3af;">
                Or <a href="${input.resourceUrl}" style="color:#6b7280;text-decoration:underline;">open the resource page</a> to view details
              </p>

              <!-- Trust line -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top:1px solid #f3f4f6;padding-top:24px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;letter-spacing:0.01em;">
                      &#10003;&nbsp;Instant access&nbsp;&nbsp;&middot;&nbsp;&nbsp;&#10003;&nbsp;Yours forever&nbsp;&nbsp;&middot;&nbsp;&nbsp;&#10003;&nbsp;No subscription
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ───────────────────────────────────────────────────── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;line-height:1.7;">
                You received this because you completed a purchase on KruCraft.<br />
                If you didn&rsquo;t make this purchase,
                <a href="mailto:support@krucraft.com" style="color:#9ca3af;text-decoration:underline;">contact support</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Resolves buyer email and resource details, then sends the post-purchase
 * confirmation email via Resend.
 *
 * Design invariants:
 *   - NEVER throws — all errors are swallowed and logged.
 *   - Returns Promise<void> — callers use `void …` (fire-and-forget).
 *   - Both DB lookups run in parallel to minimise added latency.
 *   - If RESEND_API_KEY is missing the send fails silently; webhook is unaffected.
 */
export async function sendPurchaseConfirmationEmail(
  input: SendPurchaseConfirmationEmailInput,
): Promise<void> {
  try {
    // Guard: skip silently when Resend is not configured (e.g. local dev).
    // This must be the very first check so that missing config never reaches
    // the send call and never breaks the caller's purchase completion flow.
    const resend = getResendClient();
    if (!resend) {
      console.warn(
        "[EMAIL] RESEND_API_KEY is not configured — skipping purchase confirmation email.",
        "Set RESEND_API_KEY (and optionally EMAIL_FROM) in .env to enable sending.",
      );
      return;
    }

    const appUrl = env.appBaseUrl.replace(/\/$/, "");

    // Resolve user email and resource context in parallel — neither query
    // blocks the other and both are required before the email can be built.
    const [user, resource] = await Promise.all([
      findCheckoutUserById(input.userId),
      findResourceEmailContext(input.resourceId),
    ]);

    if (!user?.email) {
      console.warn("[EMAIL] No user email found — skipping purchase confirmation.", {
        userId: input.userId,
        resourceId: input.resourceId,
      });
      return;
    }

    if (!resource) {
      console.warn("[EMAIL] Resource not found — skipping purchase confirmation.", {
        userId: input.userId,
        resourceId: input.resourceId,
      });
      return;
    }

    const downloadUrl = `${appUrl}/api/download/${input.resourceId}`;
    const resourceUrl = `${appUrl}${routes.resourcePaymentSuccess(resource.slug)}`;
    const from = env.EMAIL_FROM ?? "KruCraft <noreply@krucraft.com>";

    const { error } = await resend.emails.send({
      from,
      to: user.email,
      subject: `Your purchase is confirmed — download "${resource.title}" now`,
      html: buildConfirmationEmailHtml({
        userName: user.name ?? null,
        resourceTitle: resource.title,
        authorName: resource.authorName,
        downloadUrl,
        resourceUrl,
      }),
    });

    if (error) {
      console.error("[EMAIL] Resend rejected the send request:", error);
    }
  } catch (err) {
    // Catches network errors, Resend outages, unexpected runtime errors.
    // Must never propagate — this function is called fire-and-forget from
    // webhook handlers where any thrown error would break purchase confirmation.
    console.error("[EMAIL] Unexpected error sending purchase confirmation:", err);
  }
}
