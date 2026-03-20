import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import {
  getTeamsByHackathonId,
  createHackathonTeam,
  updateHackathonTeam,
} from "@/lib/models/HackathonTeam";
import { getRegistrationsByHackathonId } from "@/lib/models/HackathonRegistration";
import { getProfilesByUserIds } from "@/lib/models/Profile";
import type { HackathonRole, HackathonTeamSlot } from "@/types";

const SKILL_TO_ROLE: Record<string, HackathonRole> = {
  "Frontend development": "Frontend Developer",
  "Backend development": "Backend Engineer",
  "Data / Machine Learning / AI": "Prompt/AI Engineer",
  "Design / UX": "UI/UX Designer",
  "Product Management": "Product Manager",
  "DevOps / Infrastructure": "Backend Engineer",
  "Non-technical (learning AI tools)": "Flex",
};

const EXPERIENCE_RANK: Record<string, number> = {
  "Advanced (production experience)": 3,
  "Intermediate (built small projects)": 2,
  "Beginner (played with APIs / tools)": 1,
};

const EXP_LABEL: Record<number, string> = {
  3: "Adv",
  2: "Int",
  1: "Beg",
  0: "Unk",
};

interface ParticipantInfo {
  userId: string;
  rolePreference?: string;
  skillBackground?: string;
  aiExperience?: string;
}

interface TaggedParticipant extends ParticipantInfo {
  bestRole: HackathonRole;
  expRank: number;
}

interface MutableTeam {
  id: string;
  name: string;
  slots: { role: HackathonRole; userId?: string; required: boolean }[];
  isNew: boolean;
}

// POST /api/hackathons/[slug]/teams/auto-assign
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

    const [teams, registrations] = await Promise.all([
      getTeamsByHackathonId(hackathon._id),
      getRegistrationsByHackathonId(hackathon._id),
    ]);

    const userIds = registrations.map((r) => r.userId);
    const profileMap = await getProfilesByUserIds(userIds);

    const participants: ParticipantInfo[] = registrations.map((reg) => {
      const profile = profileMap.get(reg.userId);
      return {
        userId: reg.userId,
        rolePreference: reg.rolePreference || undefined,
        skillBackground: profile?.skillBackground || undefined,
        aiExperience: profile?.aiExperience || undefined,
      };
    });

    const assignedUserIds = new Set(
      teams.flatMap((t) =>
        t.slots.filter((s) => s.userId).map((s) => s.userId!),
      ),
    );

    const unassigned = participants.filter(
      (p) => !assignedUserIds.has(p.userId),
    );

    console.log("\n══════════════════════════════════════════════");
    console.log("  AUTO-ASSIGN START");
    console.log("══════════════════════════════════════════════");
    console.log(
      `  Registrations: ${participants.length}, Assigned: ${assignedUserIds.size}, Unassigned: ${unassigned.length}, Teams: ${teams.length}`,
    );

    if (unassigned.length === 0) {
      return NextResponse.json({
        message: "No unassigned participants to place",
        assigned: 0,
        teamsCreated: 0,
      });
    }

    // --- Tag participants ---
    // Role is derived from skillBackground via SKILL_TO_ROLE mapping
    const getBestRole = (p: ParticipantInfo): HackathonRole => {
      if (p.skillBackground && SKILL_TO_ROLE[p.skillBackground]) {
        const mapped = SKILL_TO_ROLE[p.skillBackground];
        if (hackathon.roles.includes(mapped)) return mapped;
      }
      return "Flex";
    };

    const getExpRank = (p: ParticipantInfo): number =>
      (p.aiExperience && EXPERIENCE_RANK[p.aiExperience]) || 0;

    const tagged: TaggedParticipant[] = unassigned.map((p) => ({
      ...p,
      bestRole: getBestRole(p),
      expRank: getExpRank(p),
    }));

    // Log role groups
    const roleGroups = new Map<HackathonRole, TaggedParticipant[]>();
    for (const p of tagged) {
      const group = roleGroups.get(p.bestRole) || [];
      group.push(p);
      roleGroups.set(p.bestRole, group);
    }

    console.log("\n  Role Groups:");
    for (const role of Array.from(roleGroups.keys())) {
      const group = roleGroups.get(role)!;
      const exp = [3, 2, 1, 0]
        .map((r) => {
          const c = group.filter((p) => p.expRank === r).length;
          return c > 0 ? `${EXP_LABEL[r]}:${c}` : null;
        })
        .filter(Boolean)
        .join(" ");
      console.log(
        `    ${role.padEnd(22)} ${String(group.length).padStart(3)}  [${exp}]`,
      );
    }

    // --- Build mutable team state ---
    const mutableTeams: MutableTeam[] = teams.map((t) => ({
      id: t._id,
      name: t.name,
      slots: t.slots.map((s) => ({
        role: s.role as HackathonRole,
        userId: s.userId || undefined,
        required: s.required,
      })),
      isNew: false,
    }));

    let teamsCreated = 0;
    let assigned = 0;

    const createNewTeam = (): MutableTeam => {
      teamsCreated++;
      const teamNum = teams.length + teamsCreated;
      const newTeam: MutableTeam = {
        id: `new-${teamNum}`,
        name: `Team ${teamNum}`,
        slots: [
          ...hackathon.roles.map((role) => ({
            role,
            userId: undefined,
            required: hackathon.requiredRoles.includes(role),
          })),
          ...Array.from(
            {
              length: Math.max(
                0,
                hackathon.maxTeamSize - hackathon.roles.length,
              ),
            },
            () => ({
              role: "Flex" as HackathonRole,
              userId: undefined,
              required: false,
            }),
          ),
        ].slice(0, hackathon.maxTeamSize),
        isNew: true,
      };
      mutableTeams.push(newTeam);
      return newTeam;
    };

    // --- Pre-create teams so we have enough capacity ---
    // Calculate how many total slots exist vs participants to place.
    // Create all needed teams upfront so the balancing algorithm can
    // spread participants evenly across ALL teams from the start.
    const slotsPerTeam = hackathon.roles.length;
    const existingOpenSlots = mutableTeams.reduce(
      (sum, t) => sum + t.slots.filter((s) => !s.userId).length,
      0,
    );
    const extraSlotsNeeded = tagged.length - existingOpenSlots;
    const extraTeamsNeeded = Math.max(
      0,
      Math.ceil(extraSlotsNeeded / slotsPerTeam),
    );

    if (extraTeamsNeeded > 0) {
      console.log(
        `\n  Pre-creating ${extraTeamsNeeded} teams (${existingOpenSlots} open slots, ${tagged.length} to place)`,
      );
      for (let i = 0; i < extraTeamsNeeded; i++) {
        createNewTeam();
      }
    }

    // Experience total for a team (used to balance placement)
    const teamExpTotal = (t: MutableTeam): number => {
      let total = 0;
      for (const slot of t.slots) {
        if (slot.userId) {
          const p = tagged.find((tp) => tp.userId === slot.userId);
          if (p) total += p.expRank;
        }
      }
      return total;
    };

    const teamFillCount = (t: MutableTeam): number =>
      t.slots.filter((s) => s.userId).length;

    // ================================================================
    //  SINGLE-PASS ALGORITHM: Global experience-balanced assignment
    //
    //  1. Sort ALL participants by experience desc (Advanced first)
    //  2. For each participant, find the best placement:
    //     a. Exact role match on team with LOWEST experience total
    //     b. Any open slot on team with LOWEST experience total
    //     c. Create new team with their preferred role
    //
    //  By processing experienced people first and always placing them
    //  on the team with the lowest total experience, we naturally
    //  spread talent evenly. Each Advanced person goes to a different
    //  team before any team gets a second one (assuming enough teams).
    // ================================================================

    // Sort by experience descending — most experienced placed first
    const sorted = [...tagged].sort((a, b) => b.expRank - a.expRank);

    console.log("\n  Assigning participants (experience-balanced)...");

    let placedInRole = 0;
    let placedInAny = 0;
    let placedInNewTeam = 0;

    for (const p of sorted) {
      // Find all teams with an open slot matching this participant's role
      // Pick the one with the lowest experience total
      let bestMatch: { team: MutableTeam; slotIndex: number } | null = null;
      let bestScore = Infinity;
      let placementType = "role";

      // Try exact role match
      for (const team of mutableTeams) {
        const idx = team.slots.findIndex(
          (s) => s.role === p.bestRole && !s.userId,
        );
        if (idx !== -1) {
          const score = teamExpTotal(team) * 100 + teamFillCount(team);
          if (score < bestScore) {
            bestScore = score;
            bestMatch = { team, slotIndex: idx };
          }
        }
      }

      // No exact role match — try any open slot
      if (!bestMatch) {
        placementType = "any";
        bestScore = Infinity;
        for (const team of mutableTeams) {
          const idx = team.slots.findIndex((s) => !s.userId);
          if (idx !== -1) {
            const score = teamExpTotal(team) * 100 + teamFillCount(team);
            if (score < bestScore) {
              bestScore = score;
              bestMatch = { team, slotIndex: idx };
            }
          }
        }
      }

      // Still nothing — create new team
      if (!bestMatch) {
        placementType = "new-team";
        const newTeam = createNewTeam();
        const idx = newTeam.slots.findIndex(
          (s) => s.role === p.bestRole && !s.userId,
        );
        if (idx !== -1) {
          bestMatch = { team: newTeam, slotIndex: idx };
        } else {
          const firstOpen = newTeam.slots.findIndex((s) => !s.userId);
          if (firstOpen !== -1) {
            bestMatch = { team: newTeam, slotIndex: firstOpen };
          }
        }
      }

      if (bestMatch) {
        bestMatch.team.slots[bestMatch.slotIndex].userId = p.userId;
        assigned++;
        if (placementType === "role") placedInRole++;
        else if (placementType === "any") placedInAny++;
        else placedInNewTeam++;
      }
    }

    console.log(`    Placed in preferred role: ${placedInRole}`);
    console.log(`    Placed in other slot:     ${placedInAny}`);
    console.log(`    Placed in new teams:      ${placedInNewTeam}`);

    // --- Log final composition ---
    console.log("\n  Final Team Composition:");
    console.log("  " + "─".repeat(55));
    console.log(
      `  ${"Team".padEnd(20)} ${"Fill".padStart(5)}  ${"Adv".padStart(4)} ${"Int".padStart(4)} ${"Beg".padStart(4)}  ${"ExpTot".padStart(6)}`,
    );
    console.log("  " + "─".repeat(55));

    let gAdv = 0,
      gInt = 0,
      gBeg = 0;

    for (const mt of mutableTeams) {
      const filled = mt.slots.filter((s) => s.userId).length;
      const total = mt.slots.length;
      let tAdv = 0,
        tInt = 0,
        tBeg = 0;
      const tExp = teamExpTotal(mt);

      for (const slot of mt.slots) {
        if (slot.userId) {
          const p = tagged.find((t) => t.userId === slot.userId);
          const rank = p?.expRank || 0;
          if (rank === 3) tAdv++;
          else if (rank === 2) tInt++;
          else if (rank === 1) tBeg++;
        }
      }

      gAdv += tAdv;
      gInt += tInt;
      gBeg += tBeg;

      const label = mt.isNew ? mt.name + " *" : mt.name;
      console.log(
        `  ${label.padEnd(20)} ${(filled + "/" + total).padStart(5)}  ${String(tAdv).padStart(4)} ${String(tInt).padStart(4)} ${String(tBeg).padStart(4)}  ${String(tExp).padStart(6)}`,
      );
    }

    console.log("  " + "─".repeat(55));
    console.log(
      `  ${"TOTAL".padEnd(20)} ${String(assigned).padStart(5)}  ${String(gAdv).padStart(4)} ${String(gInt).padStart(4)} ${String(gBeg).padStart(4)}`,
    );

    const teamExpTotals = mutableTeams
      .filter((t) => t.slots.some((s) => s.userId))
      .map((t) => teamExpTotal(t));
    const advCounts = mutableTeams.map(
      (t) =>
        t.slots.filter((s) => {
          if (!s.userId) return false;
          const p = tagged.find((tp) => tp.userId === s.userId);
          return p?.expRank === 3;
        }).length,
    );
    const filledTeams = mutableTeams.filter((t) =>
      t.slots.some((s) => s.userId),
    );

    console.log("\n  BALANCE:");
    console.log(
      `    ExpTotal range: ${Math.min(...teamExpTotals)}-${Math.max(...teamExpTotals)} (spread: ${Math.max(...teamExpTotals) - Math.min(...teamExpTotals)})`,
    );
    console.log(
      `    Adv/team range: ${Math.min(...advCounts)}-${Math.max(...advCounts)} (spread: ${Math.max(...advCounts) - Math.min(...advCounts)})`,
    );
    console.log(
      `    Avg exp/team:   ${(teamExpTotals.reduce((a, b) => a + b, 0) / filledTeams.length).toFixed(1)}`,
    );

    console.log("\n══════════════════════════════════════════════");
    console.log(
      `  RESULT: ${assigned} assigned, ${teamsCreated} new teams, ${unassigned.length - assigned} unplaced`,
    );
    console.log("══════════════════════════════════════════════\n");

    // --- Persist ---
    for (const mt of mutableTeams) {
      const slots: HackathonTeamSlot[] = mt.slots.map((s) => ({
        role: s.role,
        userId: s.userId,
        required: s.required,
      }));

      if (mt.isNew) {
        await createHackathonTeam({
          hackathonId: hackathon._id,
          name: mt.name,
          description: "",
          slots,
          createdBy: authResult.auth.user.id,
        });
      } else {
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
