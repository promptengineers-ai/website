import { NextResponse } from "next/server";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const SLUG_RE = /^[a-z0-9-]+$/;

/** Validate a string is a valid MongoDB ObjectId hex string. */
export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && OBJECT_ID_RE.test(id);
}

/** Validate a slug (lowercase alphanumeric + hyphens). */
export function validateSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && SLUG_RE.test(slug);
}

/** Parse a date string, returning a Date or null if invalid. */
export function validateDate(dateStr: unknown): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Safely parse JSON from a Request body.
 * Returns the parsed body on success, or a 400 NextResponse on failure.
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  try {
    const data = await request.json();
    return { ok: true, data: data as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or malformed JSON body" },
        { status: 400 },
      ),
    };
  }
}
