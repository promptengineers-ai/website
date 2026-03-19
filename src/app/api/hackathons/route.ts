import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody, validateDate } from "@/lib/validation";
import {
  createHackathon,
  getActiveHackathon,
  getAllHackathons,
} from "@/lib/models/Hackathon";
import { initializeDatabase } from "@/lib/initDb";
import { HACKATHON_ROLES } from "@/types";
import type { HackathonRole } from "@/types";

// GET /api/hackathons - Get the active hackathon, or all hackathons if ?all=true (admin only)
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") === "true") {
      const authResult = await requireAdmin(request);
      if (!authResult.ok) return authResult.response;

      const hackathons = await getAllHackathons();
      return NextResponse.json({ hackathons });
    }

    const hackathon = await getActiveHackathon();

    if (!hackathon) {
      return NextResponse.json({ hackathon: null });
    }

    return NextResponse.json({ hackathon });
  } catch (error) {
    console.error("Get hackathon error:", error);
    return NextResponse.json(
      { error: "Failed to get hackathon" },
      { status: 500 },
    );
  }
}

// POST /api/hackathons - Create a hackathon (admin only)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const authResult = await requireAdmin(request);
    if (!authResult.ok) return authResult.response;

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const {
      slug,
      name,
      description,
      date,
      location,
      maxTeamSize,
      roles,
      requiredRoles,
      registrationDeadline,
      teamLockDate,
    } = parsed.data as {
      slug?: string;
      name?: string;
      description?: string;
      date?: string;
      location?: string;
      maxTeamSize?: number;
      roles?: HackathonRole[];
      requiredRoles?: HackathonRole[];
      registrationDeadline?: string;
      teamLockDate?: string;
    };

    if (!slug || !name || !date || !location) {
      return NextResponse.json(
        { error: "slug, name, date, and location are required" },
        { status: 400 },
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 },
      );
    }

    // Validate dates
    const parsedDate = validateDate(date);
    if (date && !parsedDate) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }
    const parsedRegistrationDeadline = validateDate(registrationDeadline);
    if (registrationDeadline && !parsedRegistrationDeadline) {
      return NextResponse.json(
        { error: "Invalid registrationDeadline format" },
        { status: 400 },
      );
    }
    const parsedTeamLockDate = validateDate(teamLockDate);
    if (teamLockDate && !parsedTeamLockDate) {
      return NextResponse.json(
        { error: "Invalid teamLockDate format" },
        { status: 400 },
      );
    }

    // Validate roles
    const validRoles = roles || [...HACKATHON_ROLES];
    const validRequiredRoles = requiredRoles || [];

    for (const role of validRequiredRoles) {
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Required role "${role}" must be in the roles list` },
          { status: 400 },
        );
      }
    }

    const hackathon = await createHackathon({
      slug,
      name,
      description: description || "",
      date: parsedDate!,
      location,
      maxTeamSize: maxTeamSize || 5,
      roles: validRoles as HackathonRole[],
      requiredRoles: validRequiredRoles as HackathonRole[],
      registrationDeadline: parsedRegistrationDeadline || undefined,
      teamLockDate: parsedTeamLockDate || undefined,
      createdBy: authResult.auth.user.id,
    });

    return NextResponse.json({ hackathon }, { status: 201 });
  } catch (error) {
    console.error("Create hackathon error:", error);
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A hackathon with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create hackathon" },
      { status: 500 },
    );
  }
}
