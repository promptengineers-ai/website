import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getTeamById,
  updateHackathonTeam,
  deleteHackathonTeam,
} from "@/lib/models/HackathonTeam";

// GET /api/hackathons/[slug]/teams/[teamId] - Get team details
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
) {
  try {
    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    // Enrich slots with user names
    const slotsWithNames = await Promise.all(
      team.slots.map(async (slot) => {
        if (!slot.userId) return { ...slot, userName: null };
        const user = await getUserById(slot.userId);
        return { ...slot, userName: user?.name || "Unknown" };
      }),
    );

    return NextResponse.json({ team: { ...team, slots: slotsWithNames } });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json(
      { error: "Failed to get team" },
      { status: 500 },
    );
  }
}

// PATCH /api/hackathons/[slug]/teams/[teamId] - Update team (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
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

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const updated = await updateHackathonTeam(params.teamId, body);

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 },
    );
  }
}

// DELETE /api/hackathons/[slug]/teams/[teamId] - Delete team (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
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

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    await deleteHackathonTeam(params.teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 },
    );
  }
}
