import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendMagicLinkEmail({
  to,
  magicLinkUrl,
  expiresInMinutes,
}: {
  to: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td align="center" style="padding-bottom:32px;font-size:48px;">
              &#129302;
            </td>
          </tr>
          <tr>
            <td style="background-color:#111;border:1px solid #333;border-radius:8px;padding:32px;">
              <h1 style="color:#fff;font-size:24px;margin:0 0 16px;">Sign in to Prompt Engineers AI</h1>
              <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Click the button below to sign in. This link expires in ${expiresInMinutes} minutes.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${magicLinkUrl}" style="display:inline-block;background-color:#2563eb;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
                      Sign In
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:24px 0 0;">
                If you didn&rsquo;t request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="color:#4b5563;font-size:12px;margin:0;">Prompt Engineers AI &mdash; Dallas/Plano, TX</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Sign in to Prompt Engineers AI",
    html,
  });
}
