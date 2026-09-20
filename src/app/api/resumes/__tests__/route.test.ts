import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

vi.mock("@/lib/jwt", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/jwt")>();
  return { ...actual, getAuthFromCookies: vi.fn() };
});

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(),
  getGridFSBucket: vi.fn(),
}));

import { GET, DELETE } from "../[id]/route";
import { getAuthFromCookies } from "@/lib/jwt";
import { getDb, getGridFSBucket } from "@/lib/mongodb";
import { PROFILES_COLLECTION } from "@/lib/models/Profile";

const mockGetAuth = vi.mocked(getAuthFromCookies);
const mockGetDb = vi.mocked(getDb);
const mockGetGridFSBucket = vi.mocked(getGridFSBucket);

const OWNER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const VIEWER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const RESUME_ID = "dddddddddddddddddddddddd";
const FILE_BYTES = "%PDF-1.4 secret resume contents";

type ProfileDoc = Record<string, unknown> & {
  userId: ObjectId;
  resumeId?: ObjectId;
};

function makeOwnerDoc(overrides: Record<string, unknown> = {}): ProfileDoc {
  return {
    _id: new ObjectId(),
    userId: new ObjectId(OWNER_ID),
    resumeId: new ObjectId(RESUME_ID),
    links: {},
    background: "",
    seeking: "networking",
    chapters: [],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDb(docs: ProfileDoc[]) {
  const findOne = vi.fn(async (query: Record<string, unknown>) => {
    const byUser = query.userId as ObjectId | undefined;
    const byResume = query.resumeId as ObjectId | undefined;
    return (
      docs.find((doc) => {
        if (byUser) return doc.userId.equals(byUser);
        if (byResume) return doc.resumeId?.equals(byResume) ?? false;
        return false;
      }) ?? null
    );
  });
  const findOneAndUpdate = vi.fn(async () => docs[0] ?? null);
  const profiles = { findOne, findOneAndUpdate };
  mockGetDb.mockResolvedValue({
    collection: (name: string) =>
      name === PROFILES_COLLECTION ? profiles : undefined,
  } as never);
  return profiles;
}

function makeBucket() {
  const bucket = {
    find: vi.fn(() => ({
      toArray: vi.fn().mockResolvedValue([
        {
          _id: new ObjectId(RESUME_ID),
          filename: "resume.pdf",
          length: FILE_BYTES.length,
          metadata: { contentType: "application/pdf" },
        },
      ]),
    })),
    openDownloadStream: vi.fn(() => {
      async function* stream() {
        yield Buffer.from(FILE_BYTES);
      }
      return stream();
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  mockGetGridFSBucket.mockResolvedValue(bucket as never);
  return bucket;
}

function signInAs(id: string) {
  mockGetAuth.mockReturnValue({
    token: "t",
    payload: { exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
    user: { id, email: `${id}@test.com`, name: "User" },
  } as never);
}

function signOut() {
  mockGetAuth.mockReturnValue(null);
}

function get() {
  return GET(new Request(`http://localhost/api/resumes/${RESUME_ID}`), {
    params: { id: RESUME_ID },
  });
}

function del() {
  return DELETE(
    new Request(`http://localhost/api/resumes/${RESUME_ID}`, {
      method: "DELETE",
    }),
    { params: { id: RESUME_ID } },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/resumes/[id] — member opt-in (#37)", () => {
  it("owner can download without opting in", async () => {
    signInAs(OWNER_ID);
    makeDb([makeOwnerDoc({ resumeVisibleToMembers: false })]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(FILE_BYTES);
    expect(bucket.openDownloadStream).toHaveBeenCalledTimes(1);
  });

  it("anonymous request is rejected with 401 and no file bytes", async () => {
    signOut();
    makeDb([makeOwnerDoc({ resumeVisibleToMembers: true })]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain(FILE_BYTES);
    expect(bucket.openDownloadStream).not.toHaveBeenCalled();
    expect(mockGetGridFSBucket).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie") ?? "").toMatch(/Max-Age=0/i);
  });

  it("authenticated non-owner is rejected when the owner has not opted in", async () => {
    signInAs(VIEWER_ID);
    makeDb([makeOwnerDoc({ resumeVisibleToMembers: false })]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(403);
    expect(await res.text()).not.toContain(FILE_BYTES);
    expect(bucket.openDownloadStream).not.toHaveBeenCalled();
  });

  it("authenticated non-owner can download when the owner has opted in", async () => {
    signInAs(VIEWER_ID);
    makeDb([makeOwnerDoc({ resumeVisibleToMembers: true })]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.text()).toBe(FILE_BYTES);
    expect(bucket.openDownloadStream).toHaveBeenCalledWith(
      new ObjectId(RESUME_ID),
    );
  });

  it("legacy profile without the flag is treated as not opted in", async () => {
    signInAs(VIEWER_ID);
    const legacy = makeOwnerDoc();
    delete legacy.resumeVisibleToMembers;
    makeDb([legacy]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(403);
    expect(bucket.openDownloadStream).not.toHaveBeenCalled();
  });

  it("returns 403 when no profile owns the resume id", async () => {
    signInAs(VIEWER_ID);
    makeDb([]);
    const bucket = makeBucket();

    const res = await get();

    expect(res.status).toBe(403);
    expect(bucket.openDownloadStream).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/resumes/[id] — remains owner-only", () => {
  it("anonymous request is rejected with 401", async () => {
    signOut();
    makeDb([makeOwnerDoc({ resumeVisibleToMembers: true })]);
    const bucket = makeBucket();

    const res = await del();

    expect(res.status).toBe(401);
    expect(bucket.delete).not.toHaveBeenCalled();
  });

  it("non-owner cannot delete even when the owner has opted in", async () => {
    signInAs(VIEWER_ID);
    const profiles = makeDb([makeOwnerDoc({ resumeVisibleToMembers: true })]);
    const bucket = makeBucket();

    const res = await del();

    expect(res.status).toBe(403);
    expect(bucket.delete).not.toHaveBeenCalled();
    expect(profiles.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("owner can delete", async () => {
    signInAs(OWNER_ID);
    const profiles = makeDb([makeOwnerDoc({ resumeVisibleToMembers: false })]);
    const bucket = makeBucket();

    const res = await del();

    expect(res.status).toBe(200);
    expect(bucket.delete).toHaveBeenCalledWith(new ObjectId(RESUME_ID));
    expect(profiles.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: new ObjectId(OWNER_ID) },
      expect.anything(),
      expect.anything(),
    );
  });
});
