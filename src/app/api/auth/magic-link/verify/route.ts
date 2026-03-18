import { NextResponse } from "next/server";
import { hashMagicLinkToken } from "@/lib/magic-link";
import {
  getMagicLinkTokenByHash,
  markMagicLinkTokenUsed,
} from "@/lib/models/MagicLinkToken";
import {
  getUserByEmail,
  createUserForMagicLink,
  updateUserEmailVerified,
} from "@/lib/models/User";
import { createProfile } from "@/lib/models/Profile";
import {
  signAuthToken,
  setAuthCookie,
  AUTH_COOKIE_NAME,
  JWT_MAX_AGE_SECONDS,
} from "@/lib/jwt";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token || !email) {
    return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
  }

  try {
    const tokenHash = hashMagicLinkToken(token);
    const tokenDoc = await getMagicLinkTokenByHash(tokenHash);

    // Validate token
    if (!tokenDoc) {
      return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
    }

    if (tokenDoc.usedAt) {
      return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
    }

    if (new Date() > new Date(tokenDoc.expiresAt)) {
      return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
    }

    if (tokenDoc.email !== email.toLowerCase().trim()) {
      return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
    }

    // Mark token as used
    await markMagicLinkTokenUsed(tokenHash);

    const normalizedEmail = email.toLowerCase().trim();
    let user = await getUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      // Auto-register: name defaults to email prefix
      const name = normalizedEmail.split("@")[0];
      user = await createUserForMagicLink({ email: normalizedEmail, name });
      await createProfile({ userId: user._id });
      isNewUser = true;
    }

    // Mark email as verified
    if (!user.emailVerified) {
      await updateUserEmailVerified(user._id, true);
    }

    // Sign JWT and set cookie
    const jwtToken = signAuthToken({
      id: user._id,
      email: user.email,
      name: user.name,
    });

    const redirectUrl = isNewUser
      ? `${baseUrl}/profile/edit`
      : `${baseUrl}/profile`;

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: jwtToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: JWT_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Magic link verify error:", error);
    return NextResponse.redirect(`${baseUrl}/login?error=magic-link-expired`);
  }
}
