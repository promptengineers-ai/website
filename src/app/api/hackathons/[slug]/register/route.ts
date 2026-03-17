import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  createRegistration,
  getRegistration,
  deleteRegistration,
} from "@/lib/models/HackathonRegistration";
import { updateProfile } from "@/lib/models/Profile";
import { getProfileByUserId } from "@/lib/models/Profile";
import type { HackathonInvolvement, HackathonRole } from "@/types";

// POST /api/hackathons/[slug]/register - Register for hackathon
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    if (hackathon.status !== "registration" && hackathon.status !== "active") {
      return NextResponse.json(
        { error: "Registration is not open for this hackathon" },
        { status: 400 },
      );
    }

    if (
      hackathon.registrationDeadline &&
      new Date() > hackathon.registrationDeadline
    ) {
      return NextResponse.json(
        { error: "Registration deadline has passed" },
        { status: 400 },
      );
    }

    // Check if already registered
    const existing = await getRegistration(hackathon._id, auth.user.id);
    if (existing) {
      return NextResponse.json(
        { error: "Already registered for this hackathon" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const { involvement, rolePreference, skillBackground, aiExperience } = body;

    if (!involvement) {
      return NextResponse.json(
        { error: "involvement is required" },
        { status: 400 },
      );
    }

    // Create registration
    const registration = await createRegistration({
      hackathonId: hackathon._id,
      userId: auth.user.id,
      involvement: involvement as HackathonInvolvement,
      rolePreference: rolePreference as HackathonRole | undefined,
    });

    // Update profile with hackathon fields, badge, and make public
    const profile = await getProfileByUserId(auth.user.id);
    const currentBadges = profile?.badges || [];
    const updatedBadges = currentBadges.includes("hackathon")
      ? currentBadges
      : [...currentBadges, "hackathon"];

    if (profile) {
      await updateProfile(auth.user.id, {
        badges: updatedBadges,
        isPublic: true,
        ...(skillBackground ? { skillBackground } : {}),
        ...(aiExperience ? { aiExperience } : {}),
      });
    } else {
      const { createProfile } = await import("@/lib/models/Profile");
      await createProfile({
        userId: auth.user.id,
        badges: updatedBadges,
        isPublic: true,
        ...(skillBackground ? { skillBackground } : {}),
        ...(aiExperience ? { aiExperience } : {}),
      });
    }

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error("Register for hackathon error:", error);
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "Already registered for this hackathon" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 },
    );
  }
}

// DELETE /api/hackathons/[slug]/register - Unregister from hackathon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const deleted = await deleteRegistration(hackathon._id, auth.user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Not registered for this hackathon" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unregister from hackathon error:", error);
    return NextResponse.json(
      { error: "Failed to unregister" },
      { status: 500 },
    );
  }
}
