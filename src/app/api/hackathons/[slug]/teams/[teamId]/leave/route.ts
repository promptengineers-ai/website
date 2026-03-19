import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { leaveTeam, getTeamById } from "@/lib/models/HackathonTeam";

// POST /api/hackathons/[slug]/teams/[teamId]/leave - Leave a team
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
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

    // Check team lock
    if (
      hackathon.teamsLocked ||
      (hackathon.teamLockDate && new Date() > hackathon.teamLockDate)
    ) {
      return NextResponse.json(
        { error: "Teams are locked and can no longer be modified" },
        { status: 400 },
      );
    }

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    // Verify user is on this team
    const isOnTeam = team.slots.some(
      (slot) => slot.userId === auth.user.id,
    );
    if (!isOnTeam) {
      return NextResponse.json(
        { error: "You are not on this team" },
        { status: 400 },
      );
    }

    const updatedTeam = await leaveTeam(params.teamId, auth.user.id);

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Leave team error:", error);
    return NextResponse.json(
      { error: "Failed to leave team" },
      { status: 500 },
    );
  }
}
