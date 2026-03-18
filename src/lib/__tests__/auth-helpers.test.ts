import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing module under test
vi.mock("@/lib/jwt", () => ({
  getAuthFromRequest: vi.fn(),
}));

vi.mock("@/lib/models/User", () => ({
  getUserById: vi.fn(),
}));

import { requireAuth, requireAdmin } from "../auth-helpers";
import { getAuthFromRequest } from "@/lib/jwt";
import { getUserById } from "@/lib/models/User";
import { NextRequest } from "next/server";

const mockGetAuth = vi.mocked(getAuthFromRequest);
const mockGetUser = vi.mocked(getUserById);

function makeRequest() {
  return new NextRequest("http://localhost/api/test");
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "user1",
    email: "test@test.com",
    passwordHash: "hash",
    name: "Test",
    isAdmin: false,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requireAuth", () => {
  it("returns 401 when no auth token", async () => {
    mockGetAuth.mockReturnValue(null);
    const result = await requireAuth(makeRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 401 when user not found", async () => {
    mockGetAuth.mockReturnValue({
      token: "t",
      payload: { sub: "user1", email: "test@test.com" } as never,
      user: { id: "user1", email: "test@test.com" },
    });
    mockGetUser.mockResolvedValue(null);
    const result = await requireAuth(makeRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns ok with auth and user on success", async () => {
    const user = makeUser();
    mockGetAuth.mockReturnValue({
      token: "t",
      payload: { sub: "user1", email: "test@test.com" } as never,
      user: { id: "user1", email: "test@test.com" },
    });
    mockGetUser.mockResolvedValue(user);

    const result = await requireAuth(makeRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("test@test.com");
    }
  });
});

describe("requireAdmin", () => {
  it("returns 403 when user is not admin", async () => {
    const user = makeUser({ isAdmin: false });
    mockGetAuth.mockReturnValue({
      token: "t",
      payload: { sub: "user1", email: "test@test.com" } as never,
      user: { id: "user1", email: "test@test.com" },
    });
    mockGetUser.mockResolvedValue(user);

    const result = await requireAdmin(makeRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns ok when user is admin", async () => {
    const user = makeUser({ isAdmin: true });
    mockGetAuth.mockReturnValue({
      token: "t",
      payload: { sub: "user1", email: "test@test.com" } as never,
      user: { id: "user1", email: "test@test.com" },
    });
    mockGetUser.mockResolvedValue(user);

    const result = await requireAdmin(makeRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.isAdmin).toBe(true);
    }
  });
});
