import { NextResponse } from "next/server";
import {
  createUser,
  getUserByEmail,
  setVerificationToken,
} from "@/lib/models/User";
import { createProfile } from "@/lib/models/Profile";
import { hashPassword, validateEmail, validatePassword } from "@/lib/auth";
import { initializeDatabase } from "@/lib/initDb";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email,
      passwordHash,
      name,
    });

    // Create default profile
    await createProfile({ userId: user._id });

    // Generate verification token and send email
    const { token, expiry } = generateVerificationToken();
    await setVerificationToken(user._id, token, expiry);

    try {
      await sendVerificationEmail(user.email, token, user.name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // User was created — they can resend verification later
    }

    return NextResponse.json(
      {
        message:
          "Account created. Please check your email to verify your address.",
        requiresVerification: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
