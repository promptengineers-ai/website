import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type {
  HackathonRegistration,
  HackathonInvolvement,
  HackathonRole,
} from "@/types";

export const HACKATHON_REGISTRATIONS_COLLECTION = "hackathonRegistrations";

export async function createHackathonRegistrationIndexes() {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  await collection.createIndex({ hackathonId: 1, userId: 1 }, { unique: true });
  await collection.createIndex({ hackathonId: 1 });
  await collection.createIndex({ userId: 1 });
  await collection.createIndex({ hackathonId: 1, involvement: 1 });
}

function docToRegistration(
  doc: Record<string, unknown>,
): HackathonRegistration {
  return {
    _id: (doc._id as ObjectId).toString(),
    hackathonId: (doc.hackathonId as ObjectId).toString(),
    userId: (doc.userId as ObjectId).toString(),
    involvement: doc.involvement as HackathonInvolvement,
    rolePreference: (doc.rolePreference as HackathonRole) || undefined,
    registeredAt: new Date(doc.registeredAt as string | Date),
  };
}

export async function createRegistration(data: {
  hackathonId: string;
  userId: string;
  involvement: HackathonInvolvement;
  rolePreference?: HackathonRole;
}): Promise<HackathonRegistration> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  const registration = {
    hackathonId: new ObjectId(data.hackathonId),
    userId: new ObjectId(data.userId),
    involvement: data.involvement,
    rolePreference: data.rolePreference || null,
    registeredAt: new Date(),
  };

  const result = await collection.insertOne(registration);

  return docToRegistration({
    _id: result.insertedId,
    ...registration,
  } as unknown as Record<string, unknown>);
}

export async function getRegistration(
  hackathonId: string,
  userId: string,
): Promise<HackathonRegistration | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  const doc = await collection.findOne({
    hackathonId: new ObjectId(hackathonId),
    userId: new ObjectId(userId),
  });

  if (!doc) return null;

  return docToRegistration(doc as unknown as Record<string, unknown>);
}

export async function getRegistrationsByHackathonId(
  hackathonId: string,
): Promise<HackathonRegistration[]> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  const docs = await collection
    .find({ hackathonId: new ObjectId(hackathonId) })
    .sort({ registeredAt: 1 })
    .toArray();

  return docs.map((doc) =>
    docToRegistration(doc as unknown as Record<string, unknown>),
  );
}

export async function getRegistrationCount(
  hackathonId: string,
): Promise<number> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  return collection.countDocuments({
    hackathonId: new ObjectId(hackathonId),
  });
}

export async function updateRegistration(
  hackathonId: string,
  userId: string,
  data: Partial<{
    involvement: HackathonInvolvement;
    rolePreference: HackathonRole | null;
  }>,
): Promise<HackathonRegistration | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  const updateData: Record<string, unknown> = {};
  if (data.involvement !== undefined) updateData.involvement = data.involvement;
  if (data.rolePreference !== undefined)
    updateData.rolePreference = data.rolePreference;

  const result = await collection.findOneAndUpdate(
    {
      hackathonId: new ObjectId(hackathonId),
      userId: new ObjectId(userId),
    },
    { $set: updateData },
    { returnDocument: "after" },
  );

  if (!result) return null;

  return docToRegistration(result as unknown as Record<string, unknown>);
}

export async function deleteRegistration(
  hackathonId: string,
  userId: string,
): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_REGISTRATIONS_COLLECTION);

  const result = await collection.deleteOne({
    hackathonId: new ObjectId(hackathonId),
    userId: new ObjectId(userId),
  });

  return result.deletedCount > 0;
}
