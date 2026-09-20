import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(),
  getGridFSBucket: vi.fn(),
}));

import { DELETE } from "../route";
import { requireAuth } from "@/lib/auth-helpers";
import { getDb, getGridFSBucket } from "@/lib/mongodb";
import { USERS_COLLECTION } from "@/lib/models/User";
import { PROFILES_COLLECTION } from "@/lib/models/Profile";
import { HACKATHON_TEAMS_COLLECTION } from "@/lib/models/HackathonTeam";
import { HACKATHON_REGISTRATIONS_COLLECTION } from "@/lib/models/HackathonRegistration";

const mockRequireAuth = vi.mocked(requireAuth);
const mockGetDb = vi.mocked(getDb);
const mockGetGridFSBucket = vi.mocked(getGridFSBucket);

const SELF_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const AVATAR_ID = "cccccccccccccccccccccccc";
const RESUME_ID = "dddddddddddddddddddddddd";

function makeRequest(init?: { body?: Record<string, unknown>; query?: string }) {
  return new NextRequest(`http://localhost/api/users${init?.query ?? ""}`, {
    method: "DELETE",
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
}

function makeUser(id: string) {
  return {
    _id: id,
    email: "test@test.com",
    passwordHash: "hash",
    name: "Test User",
    isAdmin: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function authenticateAs(id: string) {
  const user = makeUser(id);
  mockRequireAuth.mockResolvedValue({
    ok: true,
    auth: { user: { id, email: user.email } },
    user,
  } as never);
}

function makeCollections(profile: Record<string, unknown> | null) {
  const collections = {
    [USERS_COLLECTION]: {
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    },
    [PROFILES_COLLECTION]: {
      findOne: vi.fn().mockResolvedValue(profile),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: profile ? 1 : 0 }),
    },
    [HACKATHON_TEAMS_COLLECTION]: {
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
    },
    [HACKATHON_REGISTRATIONS_COLLECTION]: {
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    },
  };
  mockGetDb.mockResolvedValue({
    collection: (name: string) => collections[name as keyof typeof collections],
  } as never);
  return collections;
}

function makeBuckets() {
  const buckets = {
    avatars: { delete: vi.fn().mockResolvedValue(undefined) },
    resumes: { delete: vi.fn().mockResolvedValue(undefined) },
  };
  mockGetGridFSBucket.mockImplementation(
    async (name = "resumes") => buckets[name as keyof typeof buckets] as never,
  );
  return buckets;
}

function makeProfileDoc(userId: string) {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(userId),
    avatarUrl: `/api/avatars/${AVATAR_ID}`,
    resumeId: new ObjectId(RESUME_ID),
    links: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("DELETE /api/users", () => {
  it("returns 401 without auth", async () => {
    mockRequireAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }) as never,
    });
    const collections = makeCollections(null);

    const res = await DELETE(makeRequest());

    expect(res.status).toBe(401);
    expect(collections[USERS_COLLECTION].deleteOne).not.toHaveBeenCalled();
    expect(mockGetDb).not.toHaveBeenCalled();
  });

  it("removes user, profile, avatar, and resume", async () => {
    authenticateAs(SELF_ID);
    const collections = makeCollections(makeProfileDoc(SELF_ID));
    const buckets = makeBuckets();

    const res = await DELETE(makeRequest());

    expect(res.status).toBe(200);
    expect(buckets.avatars.delete).toHaveBeenCalledWith(new ObjectId(AVATAR_ID));
    expect(buckets.resumes.delete).toHaveBeenCalledWith(new ObjectId(RESUME_ID));
    expect(collections[PROFILES_COLLECTION].deleteOne).toHaveBeenCalledWith({
      userId: new ObjectId(SELF_ID),
    });
    expect(collections[USERS_COLLECTION].deleteOne).toHaveBeenCalledWith({
      _id: new ObjectId(SELF_ID),
    });
    expect(
      collections[HACKATHON_REGISTRATIONS_COLLECTION].deleteMany,
    ).toHaveBeenCalledWith({ userId: new ObjectId(SELF_ID) });
    expect(collections[HACKATHON_TEAMS_COLLECTION].updateMany).toHaveBeenCalledWith(
      { "slots.userId": new ObjectId(SELF_ID) },
      expect.objectContaining({
        $set: expect.objectContaining({ "slots.$[slot].userId": null }),
      }),
      { arrayFilters: [{ "slot.userId": new ObjectId(SELF_ID) }] },
    );

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/auth-token=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });

  it("tolerates a profile with no files and already-missing GridFS files", async () => {
    authenticateAs(SELF_ID);
    const collections = makeCollections({
      ...makeProfileDoc(SELF_ID),
      resumeId: undefined,
    });
    const buckets = makeBuckets();
    buckets.avatars.delete.mockRejectedValue(
      new Error(`File not found for id ${AVATAR_ID}`),
    );

    const res = await DELETE(makeRequest());

    expect(res.status).toBe(200);
    expect(buckets.resumes.delete).not.toHaveBeenCalled();
    expect(collections[USERS_COLLECTION].deleteOne).toHaveBeenCalledWith({
      _id: new ObjectId(SELF_ID),
    });
  });

  it("cannot delete another user's account", async () => {
    authenticateAs(SELF_ID);
    const collections = makeCollections(makeProfileDoc(SELF_ID));
    makeBuckets();

    const res = await DELETE(
      makeRequest({
        body: { userId: OTHER_ID, id: OTHER_ID, email: "victim@test.com" },
        query: `?userId=${OTHER_ID}&id=${OTHER_ID}`,
      }),
    );

    expect(res.status).toBe(200);
    expect(collections[USERS_COLLECTION].deleteOne).toHaveBeenCalledTimes(1);
    expect(collections[USERS_COLLECTION].deleteOne).toHaveBeenCalledWith({
      _id: new ObjectId(SELF_ID),
    });
    expect(collections[PROFILES_COLLECTION].deleteOne).toHaveBeenCalledWith({
      userId: new ObjectId(SELF_ID),
    });
    const calls = JSON.stringify([
      ...collections[USERS_COLLECTION].deleteOne.mock.calls,
      ...collections[PROFILES_COLLECTION].deleteOne.mock.calls,
      ...collections[HACKATHON_REGISTRATIONS_COLLECTION].deleteMany.mock.calls,
      ...collections[HACKATHON_TEAMS_COLLECTION].updateMany.mock.calls,
    ]);
    expect(calls).not.toContain(OTHER_ID);
  });
});
