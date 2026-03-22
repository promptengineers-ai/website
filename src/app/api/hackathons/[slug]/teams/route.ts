import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody } from "@/lib/validation";
import { getUsersByIds } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  createHackathonTeam,
  getTeamsByHackathonId,
} from "@/lib/models/HackathonTeam";
import { getProfilesByUserIds } from "@/lib/models/Profile";
import { getAuthFromRequest } from "@/lib/jwt";
import type { HackathonTeamSlot } from "@/types";

// GET /api/hackathons/[slug]/teams - List all teams
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

    const teams = await getTeamsByHackathonId(hackathon._id);

    // Batch-fetch all user names and profiles for filled slots
    const allUserIds = Array.from(
      new Set(
        teams.flatMap((t) =>
          t.slots.filter((s) => s.userId).map((s) => s.userId!),
        ),
      ),
    );
    const userMap = await getUsersByIds(allUserIds);
    const profileMap = await getProfilesByUserIds(allUserIds);

    // Determine current user's team for email visibility
    const auth = getAuthFromRequest(request);
    const currentUserId = auth?.user?.id;
    const isAdmin = currentUserId
      ? userMap.get(currentUserId)?.isAdmin === true
      : false;

    // Find which team the current user is on
    const currentUserTeamId = currentUserId
      ? teams.find((t) => t.slots.some((s) => s.userId === currentUserId))?._id
      : undefined;

    const enrichedTeams = teams.map((team) => {
      const isSameTeam = currentUserTeamId === team._id;

      return {
        ...team,
        slots: team.slots.map((slot) => {
          const user = slot.userId ? userMap.get(slot.userId) : undefined;
          const profile = slot.userId ? profileMap.get(slot.userId) : undefined;
          const showEmail = !!(slot.userId && user && (isAdmin || isSameTeam));

          return {
            ...slot,
            userName: user?.name || (slot.userId ? "Unknown" : null),
            avatarUrl: profile?.avatarUrl || null,
            isPublic: profile?.isPublic || false,
            email: showEmail ? user!.email : null,
          };
        }),
      };
    });

    return NextResponse.json({ teams: enrichedTeams });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json({ error: "Failed to get teams" }, { status: 500 });
  }
}

// POST /api/hackathons/[slug]/teams - Create a team (admin only)
export async function POST(
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
    const { name, description, slots } = parsed.data as {
      name?: string;
      description?: string;
      slots?: HackathonTeamSlot[];
    };

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }

    // If no slots provided, create default slots from hackathon roles
    const teamSlots: HackathonTeamSlot[] =
      slots ||
      hackathon.roles.slice(0, hackathon.maxTeamSize).map((role) => ({
        role,
        required: hackathon.requiredRoles.includes(role),
      }));

    // Validate slot count
    if (teamSlots.length > hackathon.maxTeamSize) {
      return NextResponse.json(
        {
          error: `Team cannot have more than ${hackathon.maxTeamSize} slots`,
        },
        { status: 400 },
      );
    }

    // Validate slot role names are non-empty
    for (const slot of teamSlots) {
      if (!slot.role || typeof slot.role !== "string" || !slot.role.trim()) {
        return NextResponse.json(
          { error: "Each slot must have a role name" },
          { status: 400 },
        );
      }
    }

    const team = await createHackathonTeam({
      hackathonId: hackathon._id,
      name,
      description,
      slots: teamSlots,
      createdBy: authResult.auth.user.id,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Create team error:", error);
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A team with this name already exists in this hackathon" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}
