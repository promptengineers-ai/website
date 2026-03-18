import { Resend } from "resend";
import crypto from "crypto";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export function generateVerificationToken(): {
  token: string;
  expiry: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  return { token, expiry };
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const { error } = await getResend().emails.send({
    from: `Prompt Engineers AI <${fromEmail}>`,
    to,
    subject: "Verify your email - Prompt Engineers AI",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111;">Welcome to Prompt Engineers AI, ${name}!</h2>
        <p style="color: #333; line-height: 1.6;">Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">Verify Email Address</a>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">This link expires in ${TOKEN_EXPIRY_HOURS} hours.</p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">If you did not create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${verifyUrl}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export function generatePasswordResetToken(): {
  token: string;
  expiry: Date;
} {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(
    Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );
  return { token, expiry };
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  name: string,
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const { error } = await getResend().emails.send({
    from: `Prompt Engineers AI <${fromEmail}>`,
    to,
    subject: "Reset your password - Prompt Engineers AI",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111;">Password Reset Request</h2>
        <p style="color: #333; line-height: 1.6;">Hi ${name}, we received a request to reset your password. Click the button below to choose a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">This link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour.</p>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br/>${resetUrl}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
