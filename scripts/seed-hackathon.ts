/**
 * Seeds a test hackathon with teams.
 *
 * Usage: npx tsx scripts/seed-hackathon.ts
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGO_URI = process.env.MONGO_DB_URI || "mongodb://localhost:27017/promptengineers";

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();

    // Find admin user
    const admin = await db.collection("users").findOne({ isAdmin: true });
    if (!admin) {
      console.error("No admin user found. Run create-admin.ts first.");
      process.exit(1);
    }

    const hackathons = db.collection("hackathons");
    const teams = db.collection("hackathonTeams");

    // Check if already seeded
    const existing = await hackathons.findOne({ slug: "spring-2026" });
    if (existing) {
      console.log("Hackathon 'spring-2026' already exists. Skipping.");
      process.exit(0);
    }

    // Create hackathon
    const now = new Date();
    const eventDate = new Date("2026-04-19T09:00:00");
    const roles = [
      "Product Manager",
      "UI/UX Designer",
      "Prompt/AI Engineer",
      "Backend Engineer",
      "Frontend Developer",
      "DevOps/Deployment",
      "Data Engineer",
      "Flex",
    ];
    const requiredRoles = [
      "Backend Engineer",
      "Frontend Developer",
      "Prompt/AI Engineer",
    ];

    const hackathonResult = await hackathons.insertOne({
      slug: "spring-2026",
      name: "Prompt Engineers AI Hackathon - Spring 2026",
      description:
        "Build AI-powered applications in 24 hours. Form a team, pick your role, and ship something amazing.",
      date: eventDate,
      location: "Plano, TX",
      maxTeamSize: 6,
      roles,
      requiredRoles,
      registrationDeadline: new Date("2026-04-18T23:59:59"),
      teamLockDate: new Date("2026-04-19T08:00:00"),
      status: "registration",
      createdBy: admin._id,
      createdAt: now,
      updatedAt: now,
    });

    const hackathonId = hackathonResult.insertedId;
    console.log(`✓ Created hackathon "spring-2026" (${hackathonId})`);

    // Create indexes
    await hackathons.createIndex({ slug: 1 }, { unique: true });
    await hackathons.createIndex({ status: 1 });
    await teams.createIndex({ hackathonId: 1 });
    await teams.createIndex({ hackathonId: 1, name: 1 }, { unique: true });

    // Create sample teams
    const teamNames = [
      { name: "Team Alpha", desc: "Building an AI-powered code review tool" },
      { name: "Team Beta", desc: "Creating an intelligent meeting summarizer" },
      { name: "Team Gamma", desc: "Developing an AI tutoring platform" },
      { name: "Team Delta", desc: "Building a smart recipe generator" },
    ];

    for (const t of teamNames) {
      const defaultSlots = [
        { role: "Product Manager", userId: null, required: false },
        { role: "Frontend Developer", userId: null, required: true },
        { role: "Backend Engineer", userId: null, required: true },
        { role: "Prompt/AI Engineer", userId: null, required: true },
        { role: "UI/UX Designer", userId: null, required: false },
        { role: "Flex", userId: null, required: false },
      ];

      await teams.insertOne({
        hackathonId,
        name: t.name,
        description: t.desc,
        slots: defaultSlots,
        createdBy: admin._id,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`  ✓ Created team "${t.name}"`);
    }

    console.log("\n✓ Seed complete. Visit /hackathon/spring-2026");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
