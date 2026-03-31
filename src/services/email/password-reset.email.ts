import { env } from "@/env";
import { getResendClient } from "@/lib/resend";
import { routes } from "@/lib/routes";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPasswordResetHtml(input: {
  userName: string | null;
  resetUrl: string;
}): string {
  const greeting = input.userName ? `Hi ${esc(input.userName)},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;max-width:520px;width:100%;overflow:hidden;">
          <tr>
            <td style="background:#18181b;padding:18px 32px;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">KruCraft</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.5;">${greeting}</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                Reset your password
              </h1>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a request to reset your password. This link expires in 1 hour.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px;">
                <tr>
                  <td>
                    <a href="${input.resetUrl}" style="display:block;text-align:center;background:#18181b;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;">
                      Choose a new password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.7;">
                If you didn&rsquo;t request this, you can safely ignore this email.
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

export async function sendPasswordResetEmail(input: {
  email: string;
  userName: string | null;
  token: string;
}): Promise<void> {
  try {
    const resend = getResendClient();
    if (!resend) {
      return;
    }

    const resetUrl = `${env.appBaseUrl}${routes.resetPasswordConfirm}?token=${encodeURIComponent(input.token)}`;

    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM ?? "KruCraft <noreply@krucraft.com>",
      to: input.email,
      subject: "Reset your KruCraft password",
      html: buildPasswordResetHtml({
        userName: input.userName,
        resetUrl,
      }),
    });

    if (error) {
      console.error("[EMAIL] Password reset email rejected:", error);
    }
  } catch (error) {
    console.error("[EMAIL] Failed to send password reset email:", error);
  }
}
