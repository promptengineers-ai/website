import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb';
import type { User } from '@/types';

export const USERS_COLLECTION = 'users';

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
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(user);

  return {
    _id: result.insertedId.toString(),
    ...user,
  };
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
    emailVerified: user.emailVerified || false,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}
