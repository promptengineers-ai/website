import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { User } from "@/types";

export const USERS_COLLECTION = "users";

export async function createUserIndexes() {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  await collection.createIndex({ email: 1 }, { unique: true });
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
}): Promise<User> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const now = new Date();
  const user = {
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name,
    isAdmin: false,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user);

  return {
    _id: result.insertedId.toString(),
    ...user,
  } as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const user = await collection.findOne({ email });

  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    isAdmin: user.isAdmin || false,
    emailVerified: user.emailVerified || false,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const user = await collection.findOne({ _id: new ObjectId(id) });

  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    isAdmin: user.isAdmin || false,
    emailVerified: user.emailVerified || false,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export async function getUsersByIds(ids: string[]): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const objectIds = ids.map((id) => new ObjectId(id));
  const docs = await collection.find({ _id: { $in: objectIds } }).toArray();

  const map = new Map<string, User>();
  for (const doc of docs) {
    const id = doc._id.toString();
    map.set(id, {
      _id: id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      name: doc.name,
      isAdmin: doc.isAdmin || false,
      emailVerified: doc.emailVerified || false,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
  return map;
}

export async function updateUserEmailVerified(
  id: string,
  verified: boolean,
): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { emailVerified: verified, updatedAt: new Date() } },
  );
}

export async function updateUserName(id: string, name: string): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, updatedAt: new Date() } },
  );
}
