import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies before importing module under test
vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/validation", () => ({
  parseJsonBody: vi.fn(),
}));

vi.mock("@/lib/models/Hackathon", () => ({
  getHackathonBySlug: vi.fn(),
}));

vi.mock("@/lib/models/HackathonTeam", () => ({
  getTeamById: vi.fn(),
  updateHackathonTeam: vi.fn(),
  deleteHackathonTeam: vi.fn(),
}));

vi.mock("@/lib/models/User", () => ({
  getUsersByIds: vi.fn(),
}));

vi.mock("@/lib/models/Profile", () => ({
  getProfilesByUserIds: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  getAuthFromRequest: vi.fn(),
}));

import { PATCH } from "../route";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { parseJsonBody } from "@/lib/validation";
import { getHackathonBySlug } from "@/lib/models/Hackathon";
import { getTeamById, updateHackathonTeam } from "@/lib/models/HackathonTeam";

const mockRequireAuth = vi.mocked(requireAuth);
const mockRequireAdmin = vi.mocked(requireAdmin);
const mockParseJson = vi.mocked(parseJsonBody);
const mockGetHackathon = vi.mocked(getHackathonBySlug);
const mockGetTeam = vi.mocked(getTeamById);
const mockUpdateTeam = vi.mocked(updateHackathonTeam);

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/hackathons/test/teams/team1", {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "user1",
    email: "test@test.com",
    passwordHash: "hash",
    name: "Test User",
    isAdmin: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeHackathon() {
  return {
    _id: "hack1",
    slug: "test",
    name: "Test Hackathon",
    description: "A test hackathon",
    date: new Date(),
    location: "Dallas",
    status: "active" as const,
    maxTeamSize: 6,
    roles: ["Frontend Developer" as const],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeTeam(overrides: Record<string, unknown> = {}) {
  return {
    _id: "team1",
    hackathonId: "hack1",
    name: "Team Alpha",
    description: "A great team",
    order: 0,
    slots: [
      { role: "Frontend Developer" as const, userId: "user1", required: true },
      { role: "Backend Engineer" as const, userId: undefined, required: true },
    ],
    createdBy: "admin1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const params = { slug: "test", teamId: "team1" };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("PATCH /api/hackathons/[slug]/teams/[teamId]", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuth.mockResolvedValue({
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      }) as never,
    });

    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is neither admin nor team member", async () => {
    const user = makeUser({ _id: "outsider" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "outsider", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);

    const res = await PATCH(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("succeeds when user is a team member", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { name: "New Name", repoUrl: "https://github.com/test/repo" },
    } as never);
    const updatedTeam = makeTeam({
      name: "New Name",
      repoUrl: "https://github.com/test/repo",
    });
    mockUpdateTeam.mockResolvedValue(updatedTeam as never);

    const res = await PATCH(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.team.name).toBe("New Name");
  });

  it("succeeds when user is admin", async () => {
    const user = makeUser({ _id: "admin1", isAdmin: true });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "admin1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { name: "Admin Edit", description: "New desc", slots: [] },
    } as never);
    const updatedTeam = makeTeam({
      name: "Admin Edit",
      description: "New desc",
    });
    mockUpdateTeam.mockResolvedValue(updatedTeam as never);

    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(200);
    // Admin can pass all fields including slots and description
    expect(mockUpdateTeam).toHaveBeenCalledWith("team1", {
      name: "Admin Edit",
      description: "New desc",
      slots: [],
    });
  });

  it("strips slots for non-admin team members but allows description", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: {
        name: "Team Edit",
        description: "Updated desc",
        slots: [],
        repoUrl: "https://github.com/test/repo",
        contactEmail: "team@test.com",
      },
    } as never);
    const updatedTeam = makeTeam({ name: "Team Edit" });
    mockUpdateTeam.mockResolvedValue(updatedTeam as never);

    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(200);
    // Should pass allowed fields including description, but NOT slots
    expect(mockUpdateTeam).toHaveBeenCalledWith("team1", {
      name: "Team Edit",
      description: "Updated desc",
      repoUrl: "https://github.com/test/repo",
      contactEmail: "team@test.com",
    });
  });

  it("validates repoUrl format", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { repoUrl: "not-a-url" },
    } as never);

    const res = await PATCH(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid repo URL");
  });

  it("validates contactEmail format", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { contactEmail: "not-an-email" },
    } as never);

    const res = await PATCH(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid contact email");
  });

  it("allows empty string to clear repoUrl and contactEmail", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { repoUrl: "", contactEmail: "" },
    } as never);
    const updatedTeam = makeTeam({ repoUrl: "", contactEmail: "" });
    mockUpdateTeam.mockResolvedValue(updatedTeam as never);

    const res = await PATCH(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(mockUpdateTeam).toHaveBeenCalledWith("team1", {
      repoUrl: "",
      contactEmail: "",
    });
  });

  it("returns 409 when team name already exists", async () => {
    const user = makeUser({ _id: "user1" });
    mockRequireAuth.mockResolvedValue({
      ok: true,
      auth: { user: { id: "user1", email: user.email } },
      user,
    } as never);
    mockGetHackathon.mockResolvedValue(makeHackathon() as never);
    mockGetTeam.mockResolvedValue(makeTeam() as never);
    mockParseJson.mockResolvedValue({
      ok: true,
      data: { name: "Duplicate Name" },
    } as never);
    const dupError = new Error("duplicate key") as Error & { code: number };
    dupError.code = 11000;
    mockUpdateTeam.mockRejectedValue(dupError);

    const res = await PATCH(makeRequest(), { params });
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error).toBe(
      "A team with this name already exists in this hackathon",
    );
  });
});
