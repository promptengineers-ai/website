import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import {
  getHackathonBySlug,
  updateHackathon,
  deleteHackathon,
} from "@/lib/models/Hackathon";
import { getRegistrationCount } from "@/lib/models/HackathonRegistration";
import { getTeamsByHackathonId } from "@/lib/models/HackathonTeam";

// GET /api/hackathons/[slug] - Get hackathon details
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
