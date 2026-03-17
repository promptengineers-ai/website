import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { getRegistrationsByHackathonId } from "@/lib/models/HackathonRegistration";
import { getProfileByUserId } from "@/lib/models/Profile";

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

    const participants = await Promise.all(
      registrations.map(async (reg) => {
        const user = await getUserById(reg.userId);
        const profile = await getProfileByUserId(reg.userId);

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
          // Only include email for admins
          ...(isAdmin ? { email: user?.email } : {}),
        };
      }),
    );

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
