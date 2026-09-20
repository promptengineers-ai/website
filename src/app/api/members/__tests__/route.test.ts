import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
  getDb: vi.fn(),
}));

import { GET } from "../route";
import { getDb } from "@/lib/mongodb";

const mockGetDb = vi.mocked(getDb);

type Stage = Record<string, unknown>;

const aggregate = vi.fn();

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    _id: "652f1c2a3b4c5d6e7f809112",
    userId: "652f1c2a3b4c5d6e7f809113",
    name: "Alice",
    avatarUrl: "",
    seeking: "networking",
    chapters: ["plano"],
    background: "Builds things",
    links: {},
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    ...overrides,
  };
}

function setupDb(docs: Record<string, unknown>[]) {
  aggregate.mockImplementation(() => ({
    toArray: () => Promise.resolve(docs),
  }));
  mockGetDb.mockResolvedValue({
    collection: () => ({ aggregate }),
  } as never);
}

function setupPaginated(members: Record<string, unknown>[]) {
  setupDb([{ results: members, total: [{ count: members.length }] }]);
}

function setupRandom(members: Record<string, unknown>[]) {
  setupDb(members);
}

function lastPipeline(): Stage[] {
  const calls = aggregate.mock.calls;
  return calls[calls.length - 1][0] as Stage[];
}

function projection(): Record<string, unknown> {
  const stage = lastPipeline().find((s) => "$project" in s);
  expect(stage).toBeDefined();
  return (stage as { $project: Record<string, unknown> }).$project;
}

function matchQuery(): Record<string, unknown> {
  const stage = lastPipeline().find((s) => "$match" in s);
  expect(stage).toBeDefined();
  return (stage as { $match: Record<string, unknown> }).$match;
}

function makeRequest(query = "") {
  return new Request(`http://localhost/api/members${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/members — email withholding (#29)", () => {
  it("omits email from every returned member", async () => {
    setupPaginated([makeMember(), makeMember({ _id: "b", name: "Bob" })]);

    const res = await GET(makeRequest("?page=1&limit=20"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.members).toHaveLength(2);
    for (const member of body.members) {
      expect(member).not.toHaveProperty("email");
    }

    const project = projection();
    expect(project).not.toHaveProperty("email");
    expect(JSON.stringify(project)).not.toContain("email");
    expect(JSON.stringify(lastPipeline())).not.toContain("email");
  });

  it("omits email when random=true", async () => {
    setupRandom([makeMember()]);

    const res = await GET(makeRequest("?random=true&limit=3"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination).toBeNull();
    expect(body.members).toHaveLength(1);
    expect(body.members[0]).not.toHaveProperty("email");

    const pipeline = lastPipeline();
    expect(pipeline.some((s) => "$sample" in s)).toBe(true);
    expect(projection()).not.toHaveProperty("email");
    expect(JSON.stringify(pipeline)).not.toContain("email");
  });
});

describe("GET /api/members — chapter filter (#30)", () => {
  it("filters by chapter slug", async () => {
    setupPaginated([makeMember()]);

    const res = await GET(makeRequest("?chapter=plano"));

    expect(res.status).toBe(200);
    expect(matchQuery()).toEqual({ isPublic: true, chapters: "plano" });
  });

  it("filters by chapter slug in the random branch", async () => {
    setupRandom([makeMember({ chapters: ["st-george"] })]);

    const res = await GET(makeRequest("?chapter=st-george&random=true"));

    expect(res.status).toBe(200);
    expect(matchQuery()).toEqual({ isPublic: true, chapters: "st-george" });
  });

  it("ignores unknown chapter", async () => {
    setupPaginated([makeMember()]);

    const res = await GET(makeRequest("?chapter=atlantis"));

    expect(res.status).toBe(200);
    expect(matchQuery()).toEqual({ isPublic: true });
    expect(matchQuery()).not.toHaveProperty("chapters");
  });

  it("does not filter when no chapter is supplied", async () => {
    setupPaginated([makeMember()]);

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(matchQuery()).toEqual({ isPublic: true });
  });

  it("projects chapters so the directory can render badges", async () => {
    setupPaginated([makeMember()]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(projection()).toHaveProperty("chapters", 1);
    expect(body.members[0].chapters).toEqual(["plano"]);
  });

  it("no longer supports the free-text location filter", async () => {
    setupPaginated([makeMember()]);

    const res = await GET(makeRequest("?location=Dallas"));

    expect(res.status).toBe(200);
    expect(matchQuery()).toEqual({ isPublic: true });
    expect(JSON.stringify(lastPipeline())).not.toContain("Dallas");
  });
});
