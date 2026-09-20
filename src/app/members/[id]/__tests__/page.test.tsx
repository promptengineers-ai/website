import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/image", () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock("@/lib/models/Profile", () => ({
  getProfileByUserId: vi.fn(),
}));

vi.mock("@/lib/models/User", () => ({
  getUserById: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  getAuthFromCookies: vi.fn(),
}));

import MemberProfilePage from "../page";
import { getProfileByUserId } from "@/lib/models/Profile";
import { getUserById } from "@/lib/models/User";
import { getAuthFromCookies } from "@/lib/jwt";

const mockGetProfile = vi.mocked(getProfileByUserId);
const mockGetUser = vi.mocked(getUserById);
const mockGetAuth = vi.mocked(getAuthFromCookies);

const MEMBER_ID = "652f1c2a3b4c5d6e7f809113";
const MEMBER_EMAIL = "alice@test.com";

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    _id: "652f1c2a3b4c5d6e7f809112",
    userId: MEMBER_ID,
    links: {},
    background: "",
    seeking: "networking",
    chapters: [],
    isPublic: true,
    avatarUrl: "",
    badges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: MEMBER_ID,
    name: "Alice",
    email: MEMBER_EMAIL,
    isAdmin: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

async function renderPage(profileOverrides: Record<string, unknown> = {}) {
  mockGetProfile.mockResolvedValue(makeProfile(profileOverrides) as never);
  mockGetUser.mockResolvedValue(makeUser() as never);
  const ui = await MemberProfilePage({ params: { id: MEMBER_ID } });
  return render(ui);
}

function signIn() {
  mockGetAuth.mockReturnValue({
    user: { id: "viewer-id", email: "viewer@test.com", name: "Viewer" },
    payload: {},
  } as never);
}

function signOut() {
  mockGetAuth.mockReturnValue(null as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MemberProfilePage — email gating (#29)", () => {
  it("hides email for anonymous viewer", async () => {
    signOut();
    const { container } = await renderPage();

    expect(screen.queryByText(MEMBER_EMAIL)).not.toBeInTheDocument();
    expect(
      container.querySelector(`a[href^="mailto:"]`),
    ).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain(MEMBER_EMAIL);
  });

  it("offers a sign-in link instead of the address for anonymous viewers", async () => {
    signOut();
    const { container } = await renderPage();

    expect(screen.getByText("Sign in to view email")).toBeInTheDocument();
    expect(
      container.querySelector(`a[href="/login?from=/members/${MEMBER_ID}"]`),
    ).toBeInTheDocument();
  });

  it("shows email when authenticated", async () => {
    signIn();
    const { container } = await renderPage();

    expect(screen.getAllByText(MEMBER_EMAIL).length).toBeGreaterThan(0);
    expect(
      container.querySelector(`a[href="mailto:${MEMBER_EMAIL}"]`),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sign in to view email")).not.toBeInTheDocument();
  });

  it("hides email when the session carries no user id", async () => {
    mockGetAuth.mockReturnValue({ user: {}, payload: {} } as never);
    const { container } = await renderPage();

    expect(container.innerHTML).not.toContain(MEMBER_EMAIL);
    expect(screen.getByText("Sign in to view email")).toBeInTheDocument();
  });
});

describe("MemberProfilePage — chapter badges (#30)", () => {
  it("renders a badge for each designated chapter", async () => {
    signOut();
    await renderPage({ chapters: ["plano", "st-george"] });

    expect(screen.getByText("Plano, TX")).toBeInTheDocument();
    expect(screen.getByText("St. George, UT")).toBeInTheDocument();
  });

  it("renders no chapter badges for a legacy profile", async () => {
    signOut();
    await renderPage({ chapters: [] });

    expect(screen.queryByText("Plano, TX")).not.toBeInTheDocument();
  });
});

describe("MemberProfilePage — resume link gating (#37)", () => {
  const RESUME_ID = "dddddddddddddddddddddddd";
  const resumeHref = `a[href="/api/resumes/${RESUME_ID}"]`;

  function signInAsOwner() {
    mockGetAuth.mockReturnValue({
      user: { id: MEMBER_ID, email: MEMBER_EMAIL, name: "Alice" },
      payload: {},
    } as never);
  }

  it("hides the resume link from an anonymous viewer even when opted in", async () => {
    signOut();
    const { container } = await renderPage({
      resumeId: RESUME_ID,
      resumeVisibleToMembers: true,
    });

    expect(container.querySelector(resumeHref)).not.toBeInTheDocument();
    expect(screen.queryByText("View Resume")).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain(RESUME_ID);
  });

  it("hides the resume link from a signed-in non-owner when the owner has not opted in", async () => {
    signIn();
    const { container } = await renderPage({
      resumeId: RESUME_ID,
      resumeVisibleToMembers: false,
    });

    expect(container.querySelector(resumeHref)).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain(RESUME_ID);
  });

  it("hides the resume link from a signed-in non-owner for a legacy profile without the flag", async () => {
    signIn();
    const { container } = await renderPage({ resumeId: RESUME_ID });

    expect(container.querySelector(resumeHref)).not.toBeInTheDocument();
  });

  it("shows the resume link to a signed-in non-owner when the owner has opted in", async () => {
    signIn();
    const { container } = await renderPage({
      resumeId: RESUME_ID,
      resumeVisibleToMembers: true,
    });

    expect(container.querySelector(resumeHref)).toBeInTheDocument();
    expect(screen.getByText("View Resume")).toBeInTheDocument();
  });

  it("shows the resume link to the owner regardless of the flag", async () => {
    signInAsOwner();
    const { container } = await renderPage({
      resumeId: RESUME_ID,
      resumeVisibleToMembers: false,
    });

    expect(container.querySelector(resumeHref)).toBeInTheDocument();
  });

  it("shows no resume link to the owner once the resume is deleted", async () => {
    signInAsOwner();
    const { container } = await renderPage({
      resumeId: undefined,
      resumeVisibleToMembers: true,
    });

    expect(
      container.querySelector('a[href^="/api/resumes/"]'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("View Resume")).not.toBeInTheDocument();
  });
});
