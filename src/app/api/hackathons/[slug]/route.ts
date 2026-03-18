import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody, validateSlug } from "@/lib/validation";
import {
  getHackathonBySlug,
  updateHackathon,
  deleteHackathon,
} from "@/lib/models/Hackathon";
import type { HackathonRole, HackathonStatus } from "@/types";
import { getRegistrationCount } from "@/lib/models/HackathonRegistration";
import { getTeamsByHackathonId } from "@/lib/models/HackathonTeam";

// GET /api/hackathons/[slug] - Get hackathon details
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    if (!validateSlug(params.slug)) {
      return NextResponse.json(
        { error: "Invalid slug format" },
        { status: 400 },
      );
    }

    const hackathon = await getHackathonBySlug(params.slug);

    if (!hackathon) {
      return NextResponse.json(
        { error: "Hackathon not found" },
        { status: 404 },
      );
    }

    const [participantCount, teams] = await Promise.all([
      getRegistrationCount(hackathon._id),
      getTeamsByHackathonId(hackathon._id),
    ]);

    return NextResponse.json({
      hackathon,
      participantCount,
      teamCount: teams.length,
    });
  } catch (error) {
    console.error("Get hackathon error:", error);
    return NextResponse.json(
      { error: "Failed to get hackathon" },
      { status: 500 },
    );
  }
}

// PATCH /api/hackathons/[slug] - Update hackathon (admin only)
export async function PATCH(
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
    const body = parsed.data as Partial<{
      name: string;
      description: string;
      date: Date;
      location: string;
      maxTeamSize: number;
      roles: HackathonRole[];
      requiredRoles: HackathonRole[];
      registrationDeadline: Date | null;
      teamLockDate: Date | null;
      status: HackathonStatus;
    }>;

    const updated = await updateHackathon(hackathon._id, body);

    return NextResponse.json({ hackathon: updated });
  } catch (error) {
    console.error("Update hackathon error:", error);
    return NextResponse.json(
      { error: "Failed to update hackathon" },
      { status: 500 },
    );
  }
}

// DELETE /api/hackathons/[slug] - Delete hackathon (admin only)
export async function DELETE(
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

    await deleteHackathon(hackathon._id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete hackathon error:", error);
    return NextResponse.json(
      { error: "Failed to delete hackathon" },
      { status: 500 },
    );
  }
}
