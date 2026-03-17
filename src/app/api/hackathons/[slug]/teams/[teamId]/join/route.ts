import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { getRegistration } from "@/lib/models/HackathonRegistration";
import {
  joinTeam,
  getTeamById,
  getTeamByUserId,
} from "@/lib/models/HackathonTeam";
import type { HackathonRole } from "@/types";

// POST /api/hackathons/[slug]/teams/[teamId]/join - Join a team
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
    if (hackathon.teamLockDate && new Date() > hackathon.teamLockDate) {
      return NextResponse.json(
        { error: "Teams are locked and can no longer be modified" },
        { status: 400 },
      );
    }

    // Verify user is registered for this hackathon
    const registration = await getRegistration(hackathon._id, auth.user.id);
    if (!registration) {
      return NextResponse.json(
        { error: "You must register for the hackathon before joining a team" },
        { status: 403 },
      );
    }

    // Check if already on a team
    const existingTeam = await getTeamByUserId(hackathon._id, auth.user.id);
    if (existingTeam) {
      return NextResponse.json(
        {
          error: "You are already on a team. Leave your current team first.",
          currentTeam: { id: existingTeam._id, name: existingTeam.name },
        },
        { status: 409 },
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "role is required" },
        { status: 400 },
      );
    }

    // Verify role is valid for this hackathon
    if (!hackathon.roles.includes(role as HackathonRole)) {
      return NextResponse.json(
        { error: `Role "${role}" is not valid for this hackathon` },
        { status: 400 },
      );
    }

    // Verify team exists and belongs to this hackathon
    const team = await getTeamById(params.teamId);
    if (!team || team.hackathonId !== hackathon._id) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 },
      );
    }

    // Check if the role has an open slot
    const openSlot = team.slots.find(
      (s) => s.role === role && !s.userId,
    );
    if (!openSlot) {
      return NextResponse.json(
        { error: `No open "${role}" slot on this team` },
        { status: 400 },
      );
    }

    const updatedTeam = await joinTeam(
      params.teamId,
      auth.user.id,
      role as HackathonRole,
    );

    if (!updatedTeam) {
      return NextResponse.json(
        { error: "Failed to join team. The slot may have been taken." },
        { status: 409 },
      );
    }

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Join team error:", error);
    return NextResponse.json(
      { error: "Failed to join team" },
      { status: 500 },
    );
  }
}
