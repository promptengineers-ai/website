import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { HackathonTeam, HackathonTeamSlot, HackathonRole } from "@/types";

export const HACKATHON_TEAMS_COLLECTION = "hackathonTeams";

export async function createHackathonTeamIndexes() {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  await collection.createIndex({ hackathonId: 1 });
  await collection.createIndex({ hackathonId: 1, name: 1 }, { unique: true });
  await collection.createIndex({ "slots.userId": 1 });
}

function deserializeSlots(
  slots: Record<string, unknown>[],
): HackathonTeamSlot[] {
  return slots.map((slot) => ({
    role: slot.role as HackathonRole,
    userId: slot.userId ? (slot.userId as ObjectId).toString() : undefined,
    required: slot.required as boolean,
  }));
}

function serializeSlots(slots: HackathonTeamSlot[]): Record<string, unknown>[] {
  return slots.map((slot) => ({
    role: slot.role,
    userId: slot.userId ? new ObjectId(slot.userId) : null,
    required: slot.required,
  }));
}

function docToTeam(doc: Record<string, unknown>): HackathonTeam {
  return {
    _id: (doc._id as ObjectId).toString(),
    hackathonId: (doc.hackathonId as ObjectId).toString(),
    name: doc.name as string,
    description: (doc.description as string) || undefined,
    repoUrl: (doc.repoUrl as string) || undefined,
    contactEmail: (doc.contactEmail as string) || undefined,
    order: (doc.order as number) ?? 0,
    slots: deserializeSlots(doc.slots as Record<string, unknown>[]),
    createdBy: (doc.createdBy as ObjectId).toString(),
    createdAt: new Date(doc.createdAt as string | Date),
    updatedAt: new Date(doc.updatedAt as string | Date),
  };
}

export async function createHackathonTeam(data: {
  hackathonId: string;
  name: string;
  description?: string;
  slots: HackathonTeamSlot[];
  createdBy: string;
}): Promise<HackathonTeam> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const now = new Date();

  // Auto-assign next order value
  const maxOrderDoc = await collection.findOne(
    { hackathonId: new ObjectId(data.hackathonId) },
    { sort: { order: -1 } },
  );
  const nextOrder = maxOrderDoc ? ((maxOrderDoc.order as number) ?? 0) + 1 : 0;

  const team = {
    hackathonId: new ObjectId(data.hackathonId),
    name: data.name,
    description: data.description || "",
    order: nextOrder,
    slots: serializeSlots(data.slots),
    createdBy: new ObjectId(data.createdBy),
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(team);

  return docToTeam({
    _id: result.insertedId,
    ...team,
  } as unknown as Record<string, unknown>);
}

export async function getTeamsByHackathonId(
  hackathonId: string,
): Promise<HackathonTeam[]> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const docs = await collection
    .find({ hackathonId: new ObjectId(hackathonId) })
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return docs.map((doc) =>
    docToTeam(doc as unknown as Record<string, unknown>),
  );
}

export async function getTeamById(id: string): Promise<HackathonTeam | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;

  return docToTeam(doc as unknown as Record<string, unknown>);
}

export async function updateHackathonTeam(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    repoUrl: string;
    contactEmail: string;
    slots: HackathonTeamSlot[];
  }>,
): Promise<HackathonTeam | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.repoUrl !== undefined) updateData.repoUrl = data.repoUrl;
  if (data.contactEmail !== undefined)
    updateData.contactEmail = data.contactEmail;
  if (data.slots !== undefined) updateData.slots = serializeSlots(data.slots);

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: "after" },
  );

  if (!result) return null;

  return docToTeam(result as unknown as Record<string, unknown>);
}

export async function joinTeam(
  teamId: string,
  userId: string,
  role: HackathonRole,
): Promise<HackathonTeam | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  // Find the team and update the first matching empty slot for this role
  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(teamId),
      "slots.role": role,
      "slots.userId": null,
    },
    {
      $set: {
        "slots.$[slot].userId": new ObjectId(userId),
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ "slot.role": role, "slot.userId": null }],
      returnDocument: "after",
    },
  );

  if (!result) return null;

  return docToTeam(result as unknown as Record<string, unknown>);
}

export async function leaveTeam(
  teamId: string,
  userId: string,
): Promise<HackathonTeam | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const result = await collection.findOneAndUpdate(
    {
      _id: new ObjectId(teamId),
      "slots.userId": new ObjectId(userId),
    },
    {
      $set: {
        "slots.$[slot].userId": null,
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ "slot.userId": new ObjectId(userId) }],
      returnDocument: "after",
    },
  );

  if (!result) return null;

  return docToTeam(result as unknown as Record<string, unknown>);
}

export async function getTeamByUserId(
  hackathonId: string,
  userId: string,
): Promise<HackathonTeam | null> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const doc = await collection.findOne({
    hackathonId: new ObjectId(hackathonId),
    "slots.userId": new ObjectId(userId),
  });

  if (!doc) return null;

  return docToTeam(doc as unknown as Record<string, unknown>);
}

export async function reorderTeams(teamIds: string[]): Promise<void> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const ops = teamIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id) },
      update: { $set: { order: index } },
    },
  }));

  if (ops.length > 0) {
    await collection.bulkWrite(ops);
  }
}

export async function deleteHackathonTeam(id: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(HACKATHON_TEAMS_COLLECTION);

  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}
