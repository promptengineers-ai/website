import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getTeamsByHackathonId,
  createHackathonTeam,
  updateHackathonTeam,
} from "@/lib/models/HackathonTeam";
import { getRegistrationsByHackathonId } from "@/lib/models/HackathonRegistration";
import { getProfileByUserId } from "@/lib/models/Profile";
import type { HackathonRole, HackathonTeamSlot } from "@/types";

// Map skillBackground to closest hackathon role
const SKILL_TO_ROLE: Record<string, HackathonRole> = {
  "Frontend development": "Frontend Developer",
  "Backend development": "Backend Engineer",
  "Data / Machine Learning / AI": "Prompt/AI Engineer",
  "Design / UX": "UI/UX Designer",
  "Product Management": "Product Manager",
  "DevOps / Infrastructure": "Backend Engineer",
  "Non-technical (learning AI tools)": "Flex",
};

interface ParticipantInfo {
  userId: string;
  rolePreference?: string;
  skillBackground?: string;
}

// POST /api/hackathons/[slug]/teams/auto-assign
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

    // Gather all data
    const [teams, registrations] = await Promise.all([
      getTeamsByHackathonId(hackathon._id),
      getRegistrationsByHackathonId(hackathon._id),
    ]);

    // Build participant info with profiles
    const participants: ParticipantInfo[] = await Promise.all(
      registrations.map(async (reg) => {
        const profile = await getProfileByUserId(reg.userId);
        return {
          userId: reg.userId,
          rolePreference: reg.rolePreference || undefined,
          skillBackground: profile?.skillBackground || undefined,
        };
      }),
    );

    // Find already-assigned user IDs
    const assignedUserIds = new Set(
      teams.flatMap((t) =>
        t.slots.filter((s) => s.userId).map((s) => s.userId!),
      ),
    );

    // Unassigned participants
    const unassigned = participants.filter(
      (p) => !assignedUserIds.has(p.userId),
    );

    if (unassigned.length === 0) {
      return NextResponse.json({
        message: "No unassigned participants to place",
        assigned: 0,
        teamsCreated: 0,
      });
    }

    // Determine best role for each participant
    const getBestRole = (p: ParticipantInfo): HackathonRole => {
      if (
        p.rolePreference &&
        hackathon!.roles.includes(p.rolePreference as HackathonRole)
      ) {
        return p.rolePreference as HackathonRole;
      }
      if (p.skillBackground && SKILL_TO_ROLE[p.skillBackground]) {
        return SKILL_TO_ROLE[p.skillBackground];
      }
      return "Flex";
    };

    // Score participants: those with clear preferences first
    const scored = unassigned.map((p) => ({
      ...p,
      bestRole: getBestRole(p),
      priority: p.rolePreference ? 0 : p.skillBackground ? 1 : 2,
    }));
    scored.sort((a, b) => a.priority - b.priority);

    // Collect mutable team slot state
    interface MutableTeam {
      id: string;
      slots: { role: HackathonRole; userId?: string; required: boolean }[];
      isNew: boolean;
    }

    const mutableTeams: MutableTeam[] = teams.map((t) => ({
      id: t._id,
      slots: t.slots.map((s) => ({
        role: s.role as HackathonRole,
        userId: s.userId || undefined,
        required: s.required,
      })),
      isNew: false,
    }));

    let teamsCreated = 0;
    let assigned = 0;

    const findOpenSlot = (
      role: HackathonRole,
    ): { team: MutableTeam; slotIndex: number } | null => {
      // Prefer teams with more empty required slots (spread evenly)
      const sorted = [...mutableTeams].sort((a, b) => {
        const aEmpty = a.slots.filter((s) => !s.userId && s.required).length;
        const bEmpty = b.slots.filter((s) => !s.userId && s.required).length;
        return bEmpty - aEmpty; // more empty = higher priority
      });

      for (const team of sorted) {
        const idx = team.slots.findIndex(
          (s) => s.role === role && !s.userId,
        );
        if (idx !== -1) return { team, slotIndex: idx };
      }
      return null;
    };

    const createNewTeam = (): MutableTeam => {
      teamsCreated++;
      const newTeam: MutableTeam = {
        id: `new-${mutableTeams.length + 1}`,
        slots: hackathon!.roles.map((role) => ({
          role,
          userId: undefined,
          required: hackathon!.requiredRoles.includes(role),
        })),
        isNew: true,
      };
      mutableTeams.push(newTeam);
      return newTeam;
    };

    // Phase 1: Fill required roles first
    const requiredFirst = scored.filter((p) => p.bestRole !== "Flex");
    const flexParticipants = scored.filter((p) => p.bestRole === "Flex");

    for (const p of requiredFirst) {
      let match = findOpenSlot(p.bestRole);

      // No open slot for preferred role — try Flex
      if (!match) {
        match = findOpenSlot("Flex");
      }

      // Still nothing — create a new team
      if (!match) {
        const newTeam = createNewTeam();
        const idx = newTeam.slots.findIndex(
          (s) => s.role === p.bestRole && !s.userId,
        );
        if (idx !== -1) {
          match = { team: newTeam, slotIndex: idx };
        } else {
          // Role doesn't exist in default slots, use first open
          const firstOpen = newTeam.slots.findIndex((s) => !s.userId);
          if (firstOpen !== -1) {
            match = { team: newTeam, slotIndex: firstOpen };
          }
        }
      }

      if (match) {
        match.team.slots[match.slotIndex].userId = p.userId;
        assigned++;
      }
    }

    // Phase 2: Fill Flex participants
    for (const p of flexParticipants) {
      let match = findOpenSlot("Flex");

      // No Flex slot — find any open slot
      if (!match) {
        for (const role of hackathon.roles) {
          match = findOpenSlot(role);
          if (match) break;
        }
      }

      // Still nothing — create a new team
      if (!match) {
        const newTeam = createNewTeam();
        const firstOpen = newTeam.slots.findIndex((s) => !s.userId);
        if (firstOpen !== -1) {
          match = { team: newTeam, slotIndex: firstOpen };
        }
      }

      if (match) {
        match.team.slots[match.slotIndex].userId = p.userId;
        assigned++;
      }
    }

    // Persist changes
    for (const mt of mutableTeams) {
      const slots: HackathonTeamSlot[] = mt.slots.map((s) => ({
        role: s.role,
        userId: s.userId,
        required: s.required,
      }));

      if (mt.isNew) {
        // Create the team in DB
        await createHackathonTeam({
          hackathonId: hackathon._id,
          name: `Team ${String.fromCharCode(64 + mutableTeams.indexOf(mt) + 1)}`,
          description: "",
          slots,
          createdBy: auth.user.id,
        });
      } else {
        // Update existing team
        await updateHackathonTeam(mt.id, { slots });
      }
    }

    return NextResponse.json({
      message: `Auto-assigned ${assigned} participants`,
      assigned,
      teamsCreated,
      unplacedCount: unassigned.length - assigned,
    });
  } catch (error) {
    console.error("Auto-assign error:", error);
    return NextResponse.json(
      { error: "Failed to auto-assign" },
      { status: 500 },
    );
  }
}
