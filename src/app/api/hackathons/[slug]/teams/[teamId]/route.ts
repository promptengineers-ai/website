import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody } from "@/lib/validation";
import { getUsersByIds } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getTeamById,
  updateHackathonTeam,
  deleteHackathonTeam,
} from "@/lib/models/HackathonTeam";
import type { HackathonTeamSlot } from "@/types";

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
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Batch-fetch user names
    const slotUserIds = team.slots
      .filter((s) => s.userId)
      .map((s) => s.userId!);
    const userMap = await getUsersByIds(slotUserIds);

    const slotsWithNames = team.slots.map((slot) => ({
      ...slot,
      userName: slot.userId
        ? userMap.get(slot.userId)?.name || "Unknown"
        : null,
    }));

    return NextResponse.json({ team: { ...team, slots: slotsWithNames } });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Failed to get team" }, { status: 500 });
  }
}

// PATCH /api/hackathons/[slug]/teams/[teamId] - Update team (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
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

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data as Partial<{
      name: string;
      description: string;
      slots: HackathonTeamSlot[];
    }>;

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
    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const hackathon = await getHackathonBySlug(params.slug);
    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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
