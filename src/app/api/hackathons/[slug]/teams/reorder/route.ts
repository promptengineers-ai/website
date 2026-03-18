import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody, isValidObjectId } from "@/lib/validation";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { reorderTeams } from "@/lib/models/HackathonTeam";

// POST /api/hackathons/[slug]/teams/reorder - Reorder teams (admin only)
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
    const { teamIds } = parsed.data as { teamIds?: string[] };

    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json(
        { error: "teamIds array is required" },
        { status: 400 },
      );
    }

    // Validate all teamIds are valid ObjectIds
    for (const id of teamIds) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          { error: "Invalid team ID format" },
          { status: 400 },
        );
      }
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
