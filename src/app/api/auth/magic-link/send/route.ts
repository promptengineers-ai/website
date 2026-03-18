import { NextResponse } from "next/server";
import { validateEmail } from "@/lib/auth";
import { generateMagicLinkToken, hashMagicLinkToken } from "@/lib/magic-link";
import {
  countRecentTokensForEmail,
  deleteTokensForEmail,
  createMagicLinkToken,
} from "@/lib/models/MagicLinkToken";
import { sendMagicLinkEmail } from "@/lib/email";

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const MAX_TOKENS_PER_WINDOW = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: max 3 tokens per email per 15 minutes
    const since = new Date(Date.now() - MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);
    const recentCount = await countRecentTokensForEmail(normalizedEmail, since);

    if (recentCount >= MAX_TOKENS_PER_WINDOW) {
      // Return generic success to prevent enumeration
      return NextResponse.json({
        message:
          "If an account exists for this email, a magic link has been sent.",
      });
    }

    // Clean up old tokens for this email
    await deleteTokensForEmail(normalizedEmail);

    // Generate and store token
    const rawToken = generateMagicLinkToken();
    const tokenHash = hashMagicLinkToken(rawToken);
    const expiresAt = new Date(
      Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000,
    );

    await createMagicLinkToken({
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    });

    // Build magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email
    await sendMagicLinkEmail({
      to: normalizedEmail,
      magicLinkUrl,
      expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
    });

    return NextResponse.json({
      message:
        "If an account exists for this email, a magic link has been sent.",
    });
  } catch (error) {
    console.error("Magic link send error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 },
    );
  }
}
