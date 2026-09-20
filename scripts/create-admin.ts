/**
 * Creates an admin user or promotes an existing user to admin.
 *
 * Usage:
 *   pnpm dlx tsx scripts/create-admin.ts [email] [password] [name]
 *
 * Email defaults to admin@promptengineers.ai.
 *
 * If user exists: promotes to admin
 * If user doesn't exist: creates with given password and name, then promotes
 */

import { MongoClient, ObjectId } from "mongodb";
import * as bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_DB_URI || "mongodb://localhost:27017/promptengineers";
const DEFAULT_ADMIN_EMAIL = "admin@promptengineers.ai";

async function main() {
  const [emailArg, password, name] = process.argv.slice(2);
  const email = emailArg || DEFAULT_ADMIN_EMAIL;

  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");
    const profiles = db.collection("profiles");

    const existing = await users.findOne({ email });

    if (existing) {
      await users.updateOne({ _id: existing._id }, { $set: { isAdmin: true } });
      console.log(
        `✓ Promoted existing user "${existing.name}" (${email}) to admin.`,
      );
    } else {
      if (!password || !name) {
        console.error("User not found. Provide password and name to create:");
        console.error(
          `  pnpm dlx tsx scripts/create-admin.ts ${email} <password> <name>`,
        );
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const now = new Date();

      const result = await users.insertOne({
        email,
        passwordHash,
        name,
        isAdmin: true,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      // Create empty profile
      await profiles.insertOne({
        userId: result.insertedId,
        links: {},
        background: "",
        seeking: "networking",
        isPublic: false,
        avatarUrl: "",
        badges: [],
        skillBackground: "",
        aiExperience: "",
        createdAt: now,
        updatedAt: now,
      });

      console.log(`✓ Created admin user "${name}" (${email})`);
    }

    // Create indexes
    await users.createIndex({ email: 1 }, { unique: true });
    await profiles.createIndex({ userId: 1 }, { unique: true });
    console.log("✓ Indexes verified.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
