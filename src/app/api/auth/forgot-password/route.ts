import { NextResponse } from "next/server";
import { getUserByEmail, setPasswordResetToken } from "@/lib/models/User";
import { validateEmail } from "@/lib/auth";
import {
  generatePasswordResetToken,
  sendPasswordResetEmail,
} from "@/lib/email";

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
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 },
    );

    const user = await getUserByEmail(email);

    if (!user) {
      return genericResponse;
    }

    const { token, expiry } = generatePasswordResetToken();
    await setPasswordResetToken(user._id, token, expiry);

    try {
      await sendPasswordResetEmail(user.email, token, user.name);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again." },
        { status: 500 },
      );
    }

    return genericResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
