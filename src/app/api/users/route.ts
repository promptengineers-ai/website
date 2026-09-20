import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { clearAuthCookie } from "@/lib/jwt";
import { deleteUserAccount } from "@/lib/models/User";

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    await deleteUserAccount(authResult.user._id);
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }

  const response = NextResponse.json(
    { message: "Account deleted" },
    { status: 200 },
  );
  clearAuthCookie(response);
  return response;
}
