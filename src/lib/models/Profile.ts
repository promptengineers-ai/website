import { ObjectId } from 'mongodb';
import { getDb } from '../mongodb';
import type { UserProfile } from '@/types';

export const PROFILES_COLLECTION = 'profiles';

export async function createProfileIndexes() {
  const db = await getDb();
  const collection = db.collection(PROFILES_COLLECTION);

  await collection.createIndex({ userId: 1 }, { unique: true });
}

export async function createProfile(data: {
  userId: string;
  links?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    other?: string;
  };
  background?: string;
  seeking?: 'work' | 'hiring' | 'networking' | 'other';
}): Promise<UserProfile> {
  const db = await getDb();
  const collection = db.collection(PROFILES_COLLECTION);

  const now = new Date();
  const profile = {
    userId: new ObjectId(data.userId),
    links: data.links || {},
    background: data.background || '',
    seeking: data.seeking || 'networking',
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(profile);

  return {
    _id: result.insertedId.toString(),
    userId: data.userId,
    links: profile.links,
    background: profile.background,
    seeking: profile.seeking,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const db = await getDb();
  const collection = db.collection(PROFILES_COLLECTION);

  const profile = await collection.findOne({ userId: new ObjectId(userId) });

  if (!profile) return null;

  return {
    _id: profile._id.toString(),
    userId: profile.userId.toString(),
    links: profile.links || {},
    background: profile.background || '',
    seeking: profile.seeking || 'networking',
    resumeId: profile.resumeId?.toString(),
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
  };
}

export async function updateProfile(
  userId: string,
  data: {
    links?: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      portfolio?: string;
      other?: string;
    };
    background?: string;
    seeking?: 'work' | 'hiring' | 'networking' | 'other';
    resumeId?: string;
  }
): Promise<UserProfile | null> {
  const db = await getDb();
  const collection = db.collection(PROFILES_COLLECTION);

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.links !== undefined) updateData.links = data.links;
  if (data.background !== undefined) updateData.background = data.background;
  if (data.seeking !== undefined) updateData.seeking = data.seeking;
  if (data.resumeId !== undefined) {
    updateData.resumeId = data.resumeId ? new ObjectId(data.resumeId) : null;
  }

  const result = await collection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    { $set: updateData },
    { returnDocument: 'after' }
  );

  if (!result) return null;

  return {
    _id: result._id.toString(),
    userId: result.userId.toString(),
    links: result.links || {},
    background: result.background || '',
    seeking: result.seeking || 'networking',
    resumeId: result.resumeId?.toString(),
    createdAt: new Date(result.createdAt),
    updatedAt: new Date(result.updatedAt),
  };
}

export async function deleteProfile(userId: string): Promise<boolean> {
  const db = await getDb();
  const collection = db.collection(PROFILES_COLLECTION);

  const result = await collection.deleteOne({ userId: new ObjectId(userId) });

  return result.deletedCount > 0;
}
