import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import {
  createHackathon,
  getActiveHackathon,
} from "@/lib/models/Hackathon";
import { initializeDatabase } from "@/lib/initDb";
import { HACKATHON_ROLES } from "@/types";
import type { HackathonRole } from "@/types";

let dbInitialized = false;

// GET /api/hackathons - Get the active hackathon
export async function GET() {
  try {
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
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
    if (!dbInitialized) {
      await initializeDatabase();
      dbInitialized = true;
    }

    const auth = await getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserById(auth.user.id);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
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
    } = body;

    if (!slug || !name || !date || !location) {
      return NextResponse.json(
        { error: "slug, name, date, and location are required" },
        { status: 400 },
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
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
      date: new Date(date),
      location,
      maxTeamSize: maxTeamSize || 5,
      roles: validRoles as HackathonRole[],
      requiredRoles: validRequiredRoles as HackathonRole[],
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : undefined,
      teamLockDate: teamLockDate ? new Date(teamLockDate) : undefined,
      createdBy: auth.user.id,
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
