import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

vi.mock("@/components/nav/TopNavBar", () => ({
  default: () => <div data-testid="top-nav-bar" />,
}));

vi.mock("@/components/loaders/Loading", () => ({
  default: () => <div data-testid="loading" />,
}));

import TeamPage from "../page";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

const mockUseParams = vi.mocked(useParams);
const mockUseAuth = vi.mocked(useAuth);

function makeTeam(overrides: Record<string, unknown> = {}) {
  return {
    _id: "team1",
    hackathonId: "hack1",
    name: "Team Alpha",
    description: "A great team",
    repoUrl: "https://github.com/test/repo",
    contactEmail: "team@test.com",
    order: 0,
    slots: [
      {
        role: "Frontend Developer",
        userId: "user1",
        required: true,
        userName: "Alice",
        avatarUrl: null,
        isPublic: true,
        email: "alice@test.com",
      },
      {
        role: "Backend Engineer",
        userId: undefined,
        required: true,
        userName: null,
        avatarUrl: null,
        isPublic: false,
        email: null,
      },
    ],
    createdBy: "admin1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeHackathon() {
  return {
    _id: "hack1",
    slug: "test-hack",
    name: "Test Hackathon",
  };
}

function setupFetch(team = makeTeam(), hackathon = makeHackathon()) {
  global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    if (urlStr.includes("/teams/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ team }),
      });
    }
    if (urlStr.includes("/api/hackathons/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ hackathon }),
      });
    }
    if (urlStr.includes("/api/auth/session")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ isAdmin: false }),
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockUseParams.mockReturnValue({ slug: "test-hack", teamId: "team1" });
});

describe("TeamPage", () => {
  it("renders team name and members", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      status: "unauthenticated",
    } as never);
    setupFetch();

    render(<TeamPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Team Alpha" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/Frontend Developer/)).toBeInTheDocument();
  });

  it("shows edit button for team member", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user1", email: "alice@test.com" },
      status: "authenticated",
    } as never);
    setupFetch();

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });
  });

  it("hides edit button for non-member", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "outsider", email: "outsider@test.com" },
      status: "authenticated",
    } as never);
    setupFetch();

    render(<TeamPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Team Alpha" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  it("edit mode shows prefilled inputs", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "user1", email: "alice@test.com" },
      status: "authenticated",
    } as never);
    setupFetch();

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));

    const nameInput = screen.getByLabelText(/team name/i);
    const repoInput = screen.getByLabelText(/repo/i);
    const emailInput = screen.getByLabelText(/contact email/i);

    expect(nameInput).toHaveValue("Team Alpha");
    expect(repoInput).toHaveValue("https://github.com/test/repo");
    expect(emailInput).toHaveValue("team@test.com");
  });

  it("save calls PATCH and exits edit mode", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "user1", email: "alice@test.com" },
      status: "authenticated",
    } as never);
    setupFetch();

    render(<TeamPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit/i }));

    const nameInput = screen.getByLabelText(/team name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    // Mock the PATCH response
    const updatedTeam = makeTeam({ name: "New Name" });
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string | URL | Request, options?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (urlStr.includes("/teams/") && options?.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ team: updatedTeam }),
          });
        }
        if (urlStr.includes("/teams/")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ team: updatedTeam }),
          });
        }
        if (urlStr.includes("/api/hackathons/")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ hackathon: makeHackathon() }),
          });
        }
        if (urlStr.includes("/api/auth/session")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ isAdmin: false }),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      },
    );

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "New Name" }),
      ).toBeInTheDocument();
    });

    // Verify PATCH was called
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const patchCall = calls.find(
      (c: [string | URL | Request, RequestInit | undefined]) =>
        c[1]?.method === "PATCH",
    );
    expect(patchCall).toBeTruthy();
  });
});
