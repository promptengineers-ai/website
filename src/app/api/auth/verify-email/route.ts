import { NextResponse } from "next/server";
import {
  getUserByVerificationToken,
  updateUserEmailVerified,
  clearVerificationToken,
} from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 },
      );
    }

    const user = await getUserByVerificationToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 },
      );
    }

    await updateUserEmailVerified(user._id, true);
    await clearVerificationToken(user._id);

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 },
    );
  }
}
