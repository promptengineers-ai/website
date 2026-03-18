import { NextResponse } from "next/server";
import { getUserByEmail, setVerificationToken } from "@/lib/models/User";
import { validateEmail } from "@/lib/auth";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    // Generic response to prevent email enumeration
    const genericResponse = NextResponse.json(
      {
        message:
          "If an account with that email exists, a verification email has been sent.",
      },
      { status: 200 },
    );

    const user = await getUserByEmail(email);

    if (!user || user.emailVerified) {
      return genericResponse;
    }

    const { token, expiry } = generateVerificationToken();
    await setVerificationToken(user._id, token, expiry);

    try {
      await sendVerificationEmail(user.email, token, user.name);
    } catch (emailError) {
      console.error("Failed to resend verification email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 },
      );
    }

    return genericResponse;
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
