import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/models/Profile", () => ({
  getProfileByUserId: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("@/lib/models/User", () => ({
  updateUserName: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  validateUrl: vi.fn(() => true),
}));

vi.mock("@/lib/jwt", () => ({
  getAuthFromCookies: vi.fn(),
  clearAuthCookie: vi.fn(),
  setAuthCookie: vi.fn(),
  refreshAuthToken: vi.fn(() => "refreshed-token"),
  shouldRefreshToken: vi.fn(() => false),
  signAuthToken: vi.fn(() => "signed-token"),
}));

import { POST } from "../profile/route";
import {
  getProfileByUserId,
  createProfile,
  updateProfile,
} from "@/lib/models/Profile";
import { getAuthFromCookies } from "@/lib/jwt";

const mockGetAuth = vi.mocked(getAuthFromCookies);
const mockGetProfile = vi.mocked(getProfileByUserId);
const mockCreateProfile = vi.mocked(createProfile);
const mockUpdateProfile = vi.mocked(updateProfile);

const USER_ID = "652f1c2a3b4c5d6e7f809113";

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    _id: "652f1c2a3b4c5d6e7f809112",
    userId: USER_ID,
    links: {},
    background: "",
    seeking: "networking",
    chapters: [],
    isPublic: false,
    avatarUrl: "",
    badges: [],
    skillBackground: "",
    aiExperience: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/users/profile", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function authenticate() {
  mockGetAuth.mockReturnValue({
    user: { id: USER_ID, email: "member@test.com", name: "Member" },
    payload: {},
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  authenticate();
});

describe("POST /api/users/profile — chapters (#30)", () => {
  it("rejects unknown chapter slug with 400", async () => {
    mockGetProfile.mockResolvedValue(makeProfile() as never);

    const res = await POST(makeRequest({ chapters: ["atlantis"] }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid chapter");
    expect(mockUpdateProfile).not.toHaveBeenCalled();
    expect(mockCreateProfile).not.toHaveBeenCalled();
  });

  it("rejects a chapters value that is not an array", async () => {
    mockGetProfile.mockResolvedValue(makeProfile() as never);

    const res = await POST(makeRequest({ chapters: "plano" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid chapter");
  });

  it("rejects a valid slug mixed with an unknown slug", async () => {
    mockGetProfile.mockResolvedValue(makeProfile() as never);

    const res = await POST(makeRequest({ chapters: ["plano", "atlantis"] }));

    expect(res.status).toBe(400);
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it("accepts valid slugs and persists them on update", async () => {
    mockGetProfile.mockResolvedValue(makeProfile() as never);
    mockUpdateProfile.mockResolvedValue(
      makeProfile({ chapters: ["plano", "st-george"] }) as never,
    );

    const res = await POST(makeRequest({ chapters: ["plano", "st-george"] }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ chapters: ["plano", "st-george"] }),
    );
    expect(body.profile.chapters).toEqual(["plano", "st-george"]);
  });

  it("accepts an empty chapters array", async () => {
    mockGetProfile.mockResolvedValue(makeProfile() as never);
    mockUpdateProfile.mockResolvedValue(makeProfile({ chapters: [] }) as never);

    const res = await POST(makeRequest({ chapters: [] }));

    expect(res.status).toBe(200);
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      USER_ID,
      expect.objectContaining({ chapters: [] }),
    );
  });

  it("threads chapters through profile creation", async () => {
    mockGetProfile.mockResolvedValue(null as never);
    mockCreateProfile.mockResolvedValue(
      makeProfile({ chapters: ["plano"] }) as never,
    );

    const res = await POST(makeRequest({ chapters: ["plano"] }));

    expect(res.status).toBe(200);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, chapters: ["plano"] }),
    );
  });

  it("returns 401 for an unauthenticated caller", async () => {
    mockGetAuth.mockReturnValue(null as never);

    const res = await POST(makeRequest({ chapters: ["plano"] }));

    expect(res.status).toBe(401);
  });
});
