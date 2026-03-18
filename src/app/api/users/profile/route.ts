import { NextResponse } from "next/server";
import {
  getProfileByUserId,
  createProfile,
  updateProfile,
} from "@/lib/models/Profile";
import { validateUrl } from "@/lib/auth";
import {
  clearAuthCookie,
  getAuthFromCookies,
  refreshAuthToken,
  setAuthCookie,
  shouldRefreshToken,
  signAuthToken,
} from "@/lib/jwt";
import { updateUserName } from "@/lib/models/User";

export async function GET() {
  try {
    const auth = getAuthFromCookies();

    if (!auth?.user?.id) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const profile = await getProfileByUserId(auth.user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const response = NextResponse.json({ profile }, { status: 200 });

    if (shouldRefreshToken(auth.payload)) {
      const refreshed = refreshAuthToken(auth.payload);
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuthFromCookies();

    if (!auth?.user?.id) {
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      clearAuthCookie(response);
      return response;
    }

    const body = await request.json();
    const { name, links, background, seeking, isPublic, avatarUrl } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 },
        );
      }
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Name must not exceed 100 characters" },
          { status: 400 },
        );
      }
    }

    // Validate URLs if provided
    if (links) {
      const urlFields = [
        "linkedin",
        "github",
        "twitter",
        "portfolio",
        "meetup",
        "other",
      ];
      for (const field of urlFields) {
        if (links[field] && !validateUrl(links[field])) {
          return NextResponse.json(
            { error: `Invalid URL format for ${field}` },
            { status: 400 },
          );
        }
      }
    }

    // Validate background length
    if (background && background.length > 5000) {
      return NextResponse.json(
        { error: "Background text must not exceed 5000 characters" },
        { status: 400 },
      );
    }

    // Validate seeking value(s)
    const validSeekingValues = ["work", "hiring", "networking", "other"];
    if (seeking) {
      const seekingArray = Array.isArray(seeking) ? seeking : [seeking];
      const allValid = seekingArray.every((value: string) =>
        validSeekingValues.includes(value),
      );
      if (!allValid) {
        return NextResponse.json(
          { error: "Invalid seeking value" },
          { status: 400 },
        );
      }
    }

    // Check if profile exists
    const existingProfile = await getProfileByUserId(auth.user.id);

    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await updateProfile(auth.user.id, {
        links,
        background,
        seeking,
        isPublic,
        avatarUrl,
      });
    } else {
      // Create new profile
      profile = await createProfile({
        userId: auth.user.id,
        links,
        background,
        seeking,
        isPublic,
        avatarUrl,
      });
    }

    // Update user name if provided
    let newToken: string | null = null;
    if (name !== undefined) {
      const trimmedName = name.trim();
      await updateUserName(auth.user.id, trimmedName);
      newToken = signAuthToken({
        id: auth.user.id,
        email: auth.user.email,
        name: trimmedName,
      });
    }

    const response = NextResponse.json(
      { message: "Profile saved successfully", profile },
      { status: 200 },
    );

    if (newToken) {
      setAuthCookie(response, newToken);
    } else if (shouldRefreshToken(auth.payload)) {
      const refreshed = refreshAuthToken(auth.payload);
      setAuthCookie(response, refreshed);
    }

    return response;
  } catch (error) {
    console.error("Save profile error:", error);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}
