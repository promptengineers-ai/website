import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import type { User } from "@/types";
import type { AuthUser } from "@/lib/jwt";

type AuthResult =
  | { ok: true; auth: { user: AuthUser }; user: User }
  | { ok: false; response: NextResponse };

/** Require authenticated user. Returns 401 if not authenticated. */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await getUserById(auth.user.id);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, auth, user };
}

/** Require admin user. Returns 401 if not authenticated, 403 if not admin. */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;

  if (!result.user.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
