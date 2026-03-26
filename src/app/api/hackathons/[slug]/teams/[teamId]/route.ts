import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody } from "@/lib/validation";
import { getUsersByIds } from "@/lib/models/User";
import { getProfilesByUserIds } from "@/lib/models/Profile";
import { getAuthFromRequest } from "@/lib/jwt";
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

    // Batch-fetch user names and profiles
    const slotUserIds = team.slots
      .filter((s) => s.userId)
      .map((s) => s.userId!);
    const userMap = await getUsersByIds(slotUserIds);
    const profileMap = await getProfilesByUserIds(slotUserIds);

    // Determine email visibility: admin or same-team member
    const auth = getAuthFromRequest(request);
    const currentUserId = auth?.user?.id;
    const isAdmin = currentUserId
      ? userMap.get(currentUserId)?.isAdmin === true
      : false;
    const isSameTeam = currentUserId
      ? team.slots.some((s) => s.userId === currentUserId)
      : false;

    const enrichedSlots = team.slots.map((slot) => {
      const user = slot.userId ? userMap.get(slot.userId) : undefined;
      const profile = slot.userId ? profileMap.get(slot.userId) : undefined;
      const showEmail = !!(slot.userId && user && (isAdmin || isSameTeam));

      return {
        ...slot,
        userName: user?.name || (slot.userId ? "Unknown" : null),
        avatarUrl: profile?.avatarUrl || null,
        isPublic: profile?.isPublic || false,
        email: showEmail ? user!.email : null,
      };
    });

    return NextResponse.json({ team: { ...team, slots: enrichedSlots } });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ error: "Failed to get team" }, { status: 500 });
  }
}

// PATCH /api/hackathons/[slug]/teams/[teamId] - Update team (admin or team member)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; teamId: string } },
) {
  try {
    const authResult = await requireAuth(request);
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

    // Allow admins or team members to edit
    const isTeamMember = team.slots.some(
      (s) => s.userId && s.userId === authResult.user._id,
    );
    if (!authResult.user.isAdmin && !isTeamMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data as Partial<{
      name: string;
      description: string;
      repoUrl: string;
      contactEmail: string;
      slots: HackathonTeamSlot[];
    }>;

    // Validate repoUrl format if provided
    if (body.repoUrl !== undefined && body.repoUrl !== "") {
      try {
        new URL(body.repoUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid repo URL" },
          { status: 400 },
        );
      }
    }

    // Validate contactEmail format if provided
    if (body.contactEmail !== undefined && body.contactEmail !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) {
        return NextResponse.json(
          { error: "Invalid contact email" },
          { status: 400 },
        );
      }
    }

    // Non-admin team members can only update name, description, repoUrl, contactEmail
    let updatePayload: typeof body;
    if (!authResult.user.isAdmin) {
      updatePayload = {};
      if (body.name !== undefined) updatePayload.name = body.name;
      if (body.description !== undefined)
        updatePayload.description = body.description;
      if (body.repoUrl !== undefined) updatePayload.repoUrl = body.repoUrl;
      if (body.contactEmail !== undefined)
        updatePayload.contactEmail = body.contactEmail;
    } else {
      updatePayload = body;
    }

    const updated = await updateHackathonTeam(params.teamId, updatePayload);

    return NextResponse.json({ team: updated });
  } catch (error) {
    console.error("Update team error:", error);
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A team with this name already exists in this hackathon" },
        { status: 409 },
      );
    }
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
