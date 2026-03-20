import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getTeamsByHackathonId,
  updateHackathonTeam,
} from "@/lib/models/HackathonTeam";

// POST /api/hackathons/[slug]/teams/reset-assignments
// Clears all user assignments from team slots (admin only)
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

    const teams = await getTeamsByHackathonId(hackathon._id);

    let clearedCount = 0;
    for (const team of teams) {
      const hadAssignments = team.slots.some((s) => s.userId);
      if (!hadAssignments) continue;

      const clearedSlots = team.slots.map((s) => ({
        role: s.role,
        userId: undefined,
        required: s.required,
      }));

      clearedCount += team.slots.filter((s) => s.userId).length;
      await updateHackathonTeam(team._id, { slots: clearedSlots });
    }

    return NextResponse.json({
      message: `Reset ${clearedCount} assignments across ${teams.length} teams`,
      cleared: clearedCount,
      teamsAffected: teams.length,
    });
  } catch (error) {
    console.error("Reset assignments error:", error);
    return NextResponse.json(
      { error: "Failed to reset assignments" },
      { status: 500 },
    );
  }
}
