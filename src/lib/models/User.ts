import { ObjectId } from "mongodb";
import { getDb } from "../mongodb";
import type { User } from "@/types";

export const USERS_COLLECTION = "users";

export async function createUserIndexes() {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ verificationToken: 1 }, { sparse: true });
  await collection.createIndex({ passwordResetToken: 1 }, { sparse: true });
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

export async function setVerificationToken(
  id: string,
  token: string,
  expiry: Date,
): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        verificationToken: token,
        verificationTokenExpiry: expiry,
        updatedAt: new Date(),
      },
    },
  );
}

export async function getUserByVerificationToken(
  token: string,
): Promise<User | null> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const user = await collection.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    isAdmin: user.isAdmin || false,
    emailVerified: user.emailVerified || false,
    verificationToken: user.verificationToken,
    verificationTokenExpiry: user.verificationTokenExpiry
      ? new Date(user.verificationTokenExpiry)
      : undefined,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export async function clearVerificationToken(id: string): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { updatedAt: new Date() },
      $unset: { verificationToken: "", verificationTokenExpiry: "" },
    },
  );
}

export async function setPasswordResetToken(
  id: string,
  token: string,
  expiry: Date,
): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        passwordResetToken: token,
        passwordResetTokenExpiry: expiry,
        updatedAt: new Date(),
      },
    },
  );
}

export async function getUserByPasswordResetToken(
  token: string,
): Promise<User | null> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);

  const user = await collection.findOne({
    passwordResetToken: token,
    passwordResetTokenExpiry: { $gt: new Date() },
  });

  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    name: user.name,
    isAdmin: user.isAdmin || false,
    emailVerified: user.emailVerified || false,
    passwordResetToken: user.passwordResetToken,
    passwordResetTokenExpiry: user.passwordResetTokenExpiry
      ? new Date(user.passwordResetTokenExpiry)
      : undefined,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export async function clearPasswordResetToken(id: string): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: { updatedAt: new Date() },
      $unset: { passwordResetToken: "", passwordResetTokenExpiry: "" },
    },
  );
}

export async function updateUserPassword(
  id: string,
  passwordHash: string,
): Promise<void> {
  const db = await getDb();
  const collection = db.collection(USERS_COLLECTION);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { passwordHash, updatedAt: new Date() } },
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
