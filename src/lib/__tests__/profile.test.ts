import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(),
}));

import {
  createProfile,
  getProfileByUserId,
  getProfilesByUserIds,
  updateProfile,
} from "@/lib/models/Profile";
import { getDb } from "@/lib/mongodb";

const mockGetDb = vi.mocked(getDb);

const USER_ID = "652f1c2a3b4c5d6e7f809113";
const PROFILE_ID = "652f1c2a3b4c5d6e7f809112";

const collection = {
  findOne: vi.fn(),
  find: vi.fn(),
  insertOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  createIndex: vi.fn(),
};

function legacyDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: new ObjectId(PROFILE_ID),
    userId: new ObjectId(USER_ID),
    links: {},
    background: "Wrote code before chapters existed",
    seeking: "networking",
    isPublic: true,
    avatarUrl: "",
    badges: [],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  collection.find.mockReturnValue({ toArray: () => Promise.resolve([]) });
  mockGetDb.mockResolvedValue({
    collection: () => collection,
  } as never);
});

describe("Profile chapters backward compatibility (#30)", () => {
  it("defaults chapters to [] for legacy documents", async () => {
    collection.findOne.mockResolvedValue(legacyDoc());

    const profile = await getProfileByUserId(USER_ID);

    expect(profile).not.toBeNull();
    expect(profile!.chapters).toEqual([]);
  });

  it("defaults chapters to [] in the batch read mapper", async () => {
    collection.find.mockReturnValue({
      toArray: () => Promise.resolve([legacyDoc()]),
    });

    const map = await getProfilesByUserIds([USER_ID]);

    expect(map.get(USER_ID)?.chapters).toEqual([]);
  });

  it("defaults chapters to [] in the update mapper", async () => {
    collection.findOneAndUpdate.mockResolvedValue(legacyDoc());

    const profile = await updateProfile(USER_ID, { background: "updated" });

    expect(profile!.chapters).toEqual([]);
  });

  it("reads back stored chapters unchanged", async () => {
    collection.findOne.mockResolvedValue(
      legacyDoc({ chapters: ["plano", "st-george"] }),
    );

    const profile = await getProfileByUserId(USER_ID);

    expect(profile!.chapters).toEqual(["plano", "st-george"]);
  });

  it("defaults chapters to [] when creating a profile without them", async () => {
    collection.insertOne.mockResolvedValue({
      insertedId: new ObjectId(PROFILE_ID),
    });

    const profile = await createProfile({ userId: USER_ID });

    expect(profile.chapters).toEqual([]);
    expect(collection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ chapters: [] }),
    );
  });

  it("persists chapters supplied on create", async () => {
    collection.insertOne.mockResolvedValue({
      insertedId: new ObjectId(PROFILE_ID),
    });

    const profile = await createProfile({
      userId: USER_ID,
      chapters: ["plano"],
    });

    expect(profile.chapters).toEqual(["plano"]);
  });

  it("leaves chapters untouched when the update omits them", async () => {
    collection.findOneAndUpdate.mockResolvedValue(
      legacyDoc({ chapters: ["plano"] }),
    );

    await updateProfile(USER_ID, { background: "updated" });

    const [, update] = collection.findOneAndUpdate.mock.calls[0];
    expect(update.$set).not.toHaveProperty("chapters");
  });
});
