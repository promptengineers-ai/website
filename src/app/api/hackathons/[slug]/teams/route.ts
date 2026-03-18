import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  createHackathonTeam,
  getTeamsByHackathonId,
} from "@/lib/models/HackathonTeam";
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

    // Enrich teams with member names
    const enrichedTeams = await Promise.all(
      teams.map(async (team) => {
        const slotsWithNames = await Promise.all(
          team.slots.map(async (slot) => {
            if (!slot.userId) return { ...slot, userName: null };
            const user = await getUserById(slot.userId);
            return {
              ...slot,
              userName: user?.name || "Unknown",
            };
          }),
        );
        return { ...team, slots: slotsWithNames };
      }),
    );

    return NextResponse.json({ teams: enrichedTeams });
  } catch (error) {
    console.error("Get teams error:", error);
    return NextResponse.json(
      { error: "Failed to get teams" },
      { status: 500 },
    );
  }
}

// POST /api/hackathons/[slug]/teams - Create a team (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(auth.user.id);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { name, description, slots } = body;

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
      createdBy: auth.user.id,
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
