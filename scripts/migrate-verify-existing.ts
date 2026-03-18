/**
 * One-time migration: set emailVerified=true for all existing users.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/migrate-verify-existing.ts
 */
import { MongoClient } from "mongodb";

const MONGO_URI =
  process.env.MONGO_DB_URI || "mongodb://localhost:27017/promptengineers";

async function migrate() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const result = await db
      .collection("users")
      .updateMany(
        { emailVerified: { $ne: true } },
        { $set: { emailVerified: true, updatedAt: new Date() } },
      );
    console.log(`Migrated ${result.modifiedCount} users to emailVerified=true`);
  } finally {
    await client.close();
  }
}

migrate().catch(console.error);
