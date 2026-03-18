import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthFromRequest } from "@/lib/jwt";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody, isValidObjectId } from "@/lib/validation";
import { getUserById, getUsersByIds } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getRegistrationsByHackathonId,
  updateRegistration,
} from "@/lib/models/HackathonRegistration";
import {
  getProfileByUserId,
  getProfilesByUserIds,
  updateProfile,
  createProfile,
} from "@/lib/models/Profile";
import { getDb } from "@/lib/mongodb";
import type { HackathonRole, HackathonInvolvement } from "@/types";

// GET /api/hackathons/[slug]/participants - List registered participants
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    // Check if requester is admin (for full details) or regular user
    const auth = await getAuthFromRequest(request);
    let isAdmin = false;
    if (auth) {
      const user = await getUserById(auth.user.id);
      isAdmin = user?.isAdmin || false;
    }

    const registrations = await getRegistrationsByHackathonId(hackathon._id);

    // Batch-fetch users and profiles
    const userIds = registrations.map((r) => r.userId);
    const [userMap, profileMap] = await Promise.all([
      getUsersByIds(userIds),
      getProfilesByUserIds(userIds),
    ]);

    const participants = registrations.map((reg) => {
      const user = userMap.get(reg.userId);
      const profile = profileMap.get(reg.userId);

      return {
        userId: reg.userId,
        name: user?.name || "Unknown",
        involvement: reg.involvement,
        rolePreference: reg.rolePreference,
        registeredAt: reg.registeredAt,
        skillBackground: profile?.skillBackground || null,
        aiExperience: profile?.aiExperience || null,
        avatarUrl: profile?.avatarUrl || null,
        linkedIn: profile?.links?.linkedin || null,
        ...(isAdmin ? { email: user?.email } : {}),
      };
    });

    return NextResponse.json({
      participants,
      total: participants.length,
    });
  } catch (error) {
    console.error("Get participants error:", error);
    return NextResponse.json(
      { error: "Failed to get participants" },
      { status: 500 },
    );
  }
}

// PUT /api/hackathons/[slug]/participants - Update a participant (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const {
      userId,
      name,
      skillBackground,
      aiExperience,
      rolePreference,
      involvement,
    } = body as {
      userId?: string;
      name?: string;
      skillBackground?: string;
      aiExperience?: string;
      rolePreference?: HackathonRole;
      involvement?: HackathonInvolvement;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 },
      );
    }

    // Update user name
    if (name !== undefined) {
      const db = await getDb();
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { name: name.trim(), updatedAt: new Date() } },
        );
    }

    // Update profile fields (create profile if it doesn't exist)
    if (skillBackground !== undefined || aiExperience !== undefined) {
      const existingProfile = await getProfileByUserId(userId);
      if (existingProfile) {
        await updateProfile(userId, {
          ...(skillBackground !== undefined ? { skillBackground } : {}),
          ...(aiExperience !== undefined ? { aiExperience } : {}),
        });
      } else {
        await createProfile({
          userId,
          ...(skillBackground !== undefined ? { skillBackground } : {}),
          ...(aiExperience !== undefined ? { aiExperience } : {}),
        });
      }
    }

    // Update registration fields
    if (rolePreference !== undefined || involvement !== undefined) {
      await updateRegistration(hackathon._id, userId, {
        ...(involvement !== undefined ? { involvement } : {}),
        ...(rolePreference !== undefined ? { rolePreference } : {}),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update participant error:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 },
    );
  }
}
