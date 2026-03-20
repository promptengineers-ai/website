/**
 * Seeds 200 test participants with varied attributes for testing auto-assign.
 * Also creates 10 teams with standard role slots.
 *
 * Usage: npx tsx scripts/seed-participants.ts
 * Clean:  npx tsx scripts/seed-participants.ts --clean
 */

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_DB_URI || "mongodb://localhost:27017/promptengineers";
const HACKATHON_SLUG = "test";
const PARTICIPANT_COUNT = 200;
const TEAM_COUNT = 10;

const ROLES = [
  "Product Manager",
  "UI/UX Designer",
  "Prompt/AI Engineer",
  "Backend Engineer",
  "Frontend Developer",
  "Flex",
] as const;

const SKILL_BACKGROUNDS = [
  "Frontend development",
  "Backend development",
  "Data / Machine Learning / AI",
  "Design / UX",
  "Product Management",
  "DevOps / Infrastructure",
  "Non-technical (learning AI tools)",
] as const;

const AI_EXPERIENCE_LEVELS = [
  "Beginner (played with APIs / tools)",
  "Intermediate (built small projects)",
  "Advanced (production experience)",
] as const;

const INVOLVEMENTS = ["participant", "volunteer", "mentor"] as const;

// Weighted distribution to create realistic imbalances
// More backend/frontend, fewer PM/UX — mirrors real hackathon signups
const ROLE_PREFERENCE_WEIGHTS: {
  role: (typeof ROLES)[number];
  weight: number;
}[] = [
  { role: "Backend Engineer", weight: 30 },
  { role: "Frontend Developer", weight: 25 },
  { role: "Prompt/AI Engineer", weight: 20 },
  { role: "UI/UX Designer", weight: 10 },
  { role: "Product Manager", weight: 8 },
  { role: "Flex", weight: 7 },
];

const EXPERIENCE_WEIGHTS: {
  exp: (typeof AI_EXPERIENCE_LEVELS)[number];
  weight: number;
}[] = [
  { exp: "Beginner (played with APIs / tools)", weight: 40 },
  { exp: "Intermediate (built small projects)", weight: 35 },
  { exp: "Advanced (production experience)", weight: 25 },
];

const FIRST_NAMES = [
  "Alex",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Quinn",
  "Avery",
  "Cameron",
  "Dakota",
  "Drew",
  "Emery",
  "Finley",
  "Harper",
  "Jamie",
  "Kendall",
  "Logan",
  "Micah",
  "Nico",
  "Parker",
  "Reese",
  "Sage",
  "Skyler",
  "Tatum",
  "Hayden",
  "Blake",
  "Charlie",
  "Devon",
  "Ellis",
  "Frankie",
  "Gray",
  "Harley",
  "Indigo",
  "Jules",
  "Kit",
  "Lane",
  "Marlo",
  "Noel",
  "Oakley",
  "Peyton",
  "Remy",
  "Sam",
  "Toby",
  "Val",
  "Winter",
  "Xen",
  "Yael",
  "Zion",
  "Aria",
  "Kai",
  "Mika",
  "Sasha",
  "River",
  "Ash",
  "Wren",
  "Jude",
  "Eden",
  "Rowan",
  "Phoenix",
  "Robin",
  "Shay",
  "Lennox",
  "Raven",
  "Storm",
];

const LAST_NAMES = [
  "Chen",
  "Park",
  "Singh",
  "Kim",
  "Torres",
  "Wu",
  "Patel",
  "Garcia",
  "Zhang",
  "Ali",
  "Nguyen",
  "Lee",
  "Martinez",
  "Brown",
  "Johnson",
  "Davis",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Thompson",
  "Clark",
  "Lewis",
  "Walker",
  "Hall",
  "Young",
  "Scott",
  "Adams",
  "Nelson",
  "Hill",
  "King",
  "Wright",
  "Green",
  "Baker",
  "Rivera",
  "Campbell",
  "Reed",
  "Cook",
  "Bell",
  "Murphy",
  "Cooper",
  "Ross",
  "Morgan",
  "Brooks",
];

function weightedRandom<T>(items: { weight: number }[], values: T[]): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= items[i].weight;
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const isClean = process.argv.includes("--clean");
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    const hackathon = await db
      .collection("hackathons")
      .findOne({ slug: HACKATHON_SLUG });
    if (!hackathon) {
      console.error(
        `Hackathon "${HACKATHON_SLUG}" not found. Create it first.`,
      );
      process.exit(1);
    }

    const hackathonId = hackathon._id;

    if (isClean) {
      // Clean up seeded data
      const deleteUsers = await db.collection("users").deleteMany({
        email: { $regex: /^testparticipant\d+@test\.com$/ },
      });
      const deleteProfiles = await db.collection("profiles").deleteMany({
        skillBackground: { $exists: true },
        userId: { $exists: true },
      });
      const deleteRegs = await db
        .collection("hackathonRegistrations")
        .deleteMany({
          hackathonId,
        });
      const deleteTeams = await db.collection("hackathonTeams").deleteMany({
        hackathonId,
      });
      console.log(
        `Cleaned: ${deleteUsers.deletedCount} users, ${deleteProfiles.deletedCount} profiles, ${deleteRegs.deletedCount} registrations, ${deleteTeams.deletedCount} teams`,
      );
      await client.close();
      return;
    }

    const passwordHash = await bcrypt.hash("password", 12);
    const now = new Date();

    // --- Distribution tracking ---
    const stats = {
      rolePreferences: {} as Record<string, number>,
      skillBackgrounds: {} as Record<string, number>,
      experienceLevels: {} as Record<string, number>,
      involvements: {} as Record<string, number>,
      noRolePref: 0,
    };

    console.log(
      `\nSeeding ${PARTICIPANT_COUNT} participants for hackathon "${HACKATHON_SLUG}"...\n`,
    );

    const userDocs: Record<string, unknown>[] = [];
    const profileDocs: Record<string, unknown>[] = [];
    const registrationDocs: Record<string, unknown>[] = [];

    for (let i = 0; i < PARTICIPANT_COUNT; i++) {
      const userId = new ObjectId();
      const firstName = pickRandom(FIRST_NAMES);
      const lastName = pickRandom(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `testparticipant${i + 1}@test.com`;

      // 85% have a role preference, 15% don't (to test fallback to skillBackground)
      const hasRolePref = Math.random() < 0.85;
      const rolePreference = hasRolePref
        ? weightedRandom(
            ROLE_PREFERENCE_WEIGHTS,
            ROLE_PREFERENCE_WEIGHTS.map((r) => r.role),
          )
        : undefined;

      const skillBackground = pickRandom(SKILL_BACKGROUNDS);
      const aiExperience = weightedRandom(
        EXPERIENCE_WEIGHTS,
        EXPERIENCE_WEIGHTS.map((e) => e.exp),
      );

      // 85% participant, 10% mentor, 5% volunteer
      const involvementRoll = Math.random();
      const involvement =
        involvementRoll < 0.85
          ? "participant"
          : involvementRoll < 0.95
            ? "mentor"
            : "volunteer";

      // Track stats
      if (rolePreference) {
        stats.rolePreferences[rolePreference] =
          (stats.rolePreferences[rolePreference] || 0) + 1;
      } else {
        stats.noRolePref++;
      }
      stats.skillBackgrounds[skillBackground] =
        (stats.skillBackgrounds[skillBackground] || 0) + 1;
      stats.experienceLevels[aiExperience] =
        (stats.experienceLevels[aiExperience] || 0) + 1;
      stats.involvements[involvement] =
        (stats.involvements[involvement] || 0) + 1;

      userDocs.push({
        _id: userId,
        email,
        passwordHash,
        name,
        isAdmin: false,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      profileDocs.push({
        userId,
        skillBackground,
        aiExperience,
        isPublic: true,
        badges: ["hackathon"],
        links: {},
        background: "",
        seeking: "networking",
        avatarUrl: "",
        createdAt: now,
        updatedAt: now,
      });

      registrationDocs.push({
        hackathonId,
        userId: userId.toString(),
        involvement,
        ...(rolePreference ? { rolePreference } : {}),
        registeredAt: now,
      });
    }

    // Bulk insert
    await db.collection("users").insertMany(userDocs);
    await db.collection("profiles").insertMany(profileDocs);
    await db.collection("hackathonRegistrations").insertMany(registrationDocs);

    console.log(
      `✓ Created ${PARTICIPANT_COUNT} users, profiles, and registrations\n`,
    );

    // --- Create teams ---
    const teamDocs: Record<string, unknown>[] = [];
    const admin = await db.collection("users").findOne({ isAdmin: true });
    const createdBy = admin?._id?.toString() || userDocs[0]._id!.toString();

    for (let i = 0; i < TEAM_COUNT; i++) {
      teamDocs.push({
        hackathonId,
        name: `Team ${i + 1}`,
        description: "",
        order: i,
        slots: ROLES.map((role) => ({
          role,
          userId: null,
          required: [
            "Backend Engineer",
            "Frontend Developer",
            "Prompt/AI Engineer",
          ].includes(role),
        })),
        createdBy,
        createdAt: now,
        updatedAt: now,
      });
    }

    await db.collection("hackathonTeams").insertMany(teamDocs);
    console.log(
      `✓ Created ${TEAM_COUNT} teams (${ROLES.length} slots each = ${TEAM_COUNT * ROLES.length} total slots)\n`,
    );

    // --- Print distribution summary ---
    console.log("═══════════════════════════════════════════");
    console.log("  PARTICIPANT DISTRIBUTION SUMMARY");
    console.log("═══════════════════════════════════════════\n");

    console.log("Role Preferences:");
    const sortedRoles = Object.entries(stats.rolePreferences).sort(
      (a, b) => b[1] - a[1],
    );
    for (const [role, count] of sortedRoles) {
      const bar = "█".repeat(Math.round(count / 2));
      console.log(`  ${role.padEnd(22)} ${String(count).padStart(3)} ${bar}`);
    }
    console.log(
      `  ${"(no preference)".padEnd(22)} ${String(stats.noRolePref).padStart(3)}`,
    );

    console.log("\nSkill Backgrounds:");
    const sortedSkills = Object.entries(stats.skillBackgrounds).sort(
      (a, b) => b[1] - a[1],
    );
    for (const [skill, count] of sortedSkills) {
      const bar = "█".repeat(Math.round(count / 2));
      console.log(`  ${skill.padEnd(35)} ${String(count).padStart(3)} ${bar}`);
    }

    console.log("\nExperience Levels:");
    const sortedExp = Object.entries(stats.experienceLevels).sort(
      (a, b) => b[1] - a[1],
    );
    for (const [exp, count] of sortedExp) {
      const bar = "█".repeat(Math.round(count / 2));
      console.log(`  ${exp.padEnd(40)} ${String(count).padStart(3)} ${bar}`);
    }

    console.log("\nInvolvement Types:");
    for (const [inv, count] of Object.entries(stats.involvements)) {
      console.log(`  ${inv.padEnd(15)} ${String(count).padStart(3)}`);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("  CAPACITY ANALYSIS");
    console.log("═══════════════════════════════════════════\n");

    const totalSlots = TEAM_COUNT * ROLES.length;
    const slotsPerRole = TEAM_COUNT; // 1 slot per role per team
    console.log(
      `  Total team slots:     ${totalSlots} (${TEAM_COUNT} teams × ${ROLES.length} roles)`,
    );
    console.log(`  Total participants:   ${PARTICIPANT_COUNT}`);
    console.log(
      `  Overflow expected:    ${Math.max(0, PARTICIPANT_COUNT - totalSlots)} participants need new teams\n`,
    );

    console.log("  Slots vs Demand per Role:");
    for (const role of ROLES) {
      const demand = stats.rolePreferences[role] || 0;
      const ratio = demand > 0 ? (demand / slotsPerRole).toFixed(1) : "0.0";
      const status =
        demand > slotsPerRole
          ? "⚠ OVERFLOW"
          : demand === slotsPerRole
            ? "= EXACT"
            : "✓ fits";
      console.log(
        `    ${role.padEnd(22)} ${String(slotsPerRole).padStart(2)} slots, ${String(demand).padStart(3)} want it  (${ratio}x)  ${status}`,
      );
    }

    console.log(
      `\n  No-preference participants (${stats.noRolePref}) will be placed by skillBackground mapping.\n`,
    );
    console.log(
      "Done! Run auto-assign from the admin panel or via API to test.\n",
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
