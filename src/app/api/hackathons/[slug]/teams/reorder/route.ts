import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { reorderTeams } from "@/lib/models/HackathonTeam";

// POST /api/hackathons/[slug]/teams/reorder - Reorder teams (admin only)
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
    const { teamIds } = body;

    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json(
        { error: "teamIds array is required" },
        { status: 400 },
      );
    }

    await reorderTeams(teamIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder teams error:", error);
    return NextResponse.json(
      { error: "Failed to reorder teams" },
      { status: 500 },
    );
  }
}
