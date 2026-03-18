import { getDb } from "../mongodb";

export const MAGIC_LINK_TOKENS_COLLECTION = "magicLinkTokens";

export async function createMagicLinkTokenIndexes() {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collection.createIndex({ tokenHash: 1 }, { unique: true });
  await collection.createIndex({ email: 1 });
}

export async function createMagicLinkToken(data: {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  const doc = {
    email: data.email,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    usedAt: null,
    createdAt: new Date(),
  };

  await collection.insertOne(doc);
  return doc;
}

export async function getMagicLinkTokenByHash(tokenHash: string) {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  return collection.findOne({ tokenHash });
}

export async function markMagicLinkTokenUsed(tokenHash: string) {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  await collection.updateOne({ tokenHash }, { $set: { usedAt: new Date() } });
}

export async function deleteTokensForEmail(email: string) {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  await collection.deleteMany({ email });
}

export async function countRecentTokensForEmail(email: string, since: Date) {
  const db = await getDb();
  const collection = db.collection(MAGIC_LINK_TOKENS_COLLECTION);

  return collection.countDocuments({
    email,
    createdAt: { $gte: since },
  });
}
