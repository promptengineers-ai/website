import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { Hackathon, HackathonStatus, HackathonRole } from "@/types";

export const HACKATHONS_COLLECTION = "hackathons";

export async function createHackathonIndexes() {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ status: 1 });
}

function docToHackathon(doc: Record<string, unknown>): Hackathon {
  return {
    _id: (doc._id as ObjectId).toString(),
    slug: doc.slug as string,
    name: doc.name as string,
    description: doc.description as string,
    date: new Date(doc.date as string | Date),
    location: doc.location as string,
    maxTeamSize: doc.maxTeamSize as number,
    roles: doc.roles as HackathonRole[],
    requiredRoles: doc.requiredRoles as HackathonRole[],
    registrationDeadline: doc.registrationDeadline
      ? new Date(doc.registrationDeadline as string | Date)
      : undefined,
    teamLockDate: doc.teamLockDate
      ? new Date(doc.teamLockDate as string | Date)
      : undefined,
    status: doc.status as HackathonStatus,
    createdBy: (doc.createdBy as ObjectId).toString(),
    createdAt: new Date(doc.createdAt as string | Date),
    updatedAt: new Date(doc.updatedAt as string | Date),
  };
}

export async function createHackathon(data: {
  slug: string;
  name: string;
  description: string;
  date: Date;
  location: string;
  maxTeamSize: number;
  roles: HackathonRole[];
  requiredRoles: HackathonRole[];
  registrationDeadline?: Date;
  teamLockDate?: Date;
  createdBy: string;
}): Promise<Hackathon> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const now = new Date();
  const hackathon = {
    slug: data.slug,
    name: data.name,
    description: data.description,
    date: data.date,
    location: data.location,
    maxTeamSize: data.maxTeamSize,
    roles: data.roles,
    requiredRoles: data.requiredRoles,
    registrationDeadline: data.registrationDeadline || null,
    teamLockDate: data.teamLockDate || null,
    status: "draft" as HackathonStatus,
    createdBy: new ObjectId(data.createdBy),
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(hackathon);

  return docToHackathon({ _id: result.insertedId, ...hackathon });
}

export async function getHackathonBySlug(
  slug: string,
): Promise<Hackathon | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const doc = await collection.findOne({ slug });
  if (!doc) return null;

  return docToHackathon(doc as unknown as Record<string, unknown>);
}

export async function getHackathonById(
  id: string,
): Promise<Hackathon | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return docToHackathon(doc as unknown as Record<string, unknown>);
}

export async function getActiveHackathon(): Promise<Hackathon | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const doc = await collection.findOne({
    status: { $in: ["registration", "active"] },
  });
  if (!doc) return null;

  return docToHackathon(doc as unknown as Record<string, unknown>);
}

export async function updateHackathon(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    date: Date;
    location: string;
    maxTeamSize: number;
    roles: HackathonRole[];
    requiredRoles: HackathonRole[];
    registrationDeadline: Date | null;
    teamLockDate: Date | null;
    status: HackathonStatus;
  }>,
): Promise<Hackathon | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: "after" },
  );

  if (!result) return null;

  return docToHackathon(result as unknown as Record<string, unknown>);
}

export async function deleteHackathon(id: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(HACKATHONS_COLLECTION);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
