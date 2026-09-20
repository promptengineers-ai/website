import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { CHAPTERS } from "@/config/chapters";
import { FALLBACK_MEETUP_STATS } from "@/lib/meetup";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: null, status: "unauthenticated" }),
}));

vi.mock("@/components/nav/TopNavBar", () => ({
  default: () => <div data-testid="top-nav-bar" />,
}));

vi.mock("@/components/members/MemberStrip", () => ({
  default: () => <div data-testid="member-strip" />,
}));

vi.mock("@/lib/meetup", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/meetup")>();
  return {
    ...actual,
    getMeetupStats: vi.fn(async () => actual.FALLBACK_MEETUP_STATS),
    getChapterSnapshot: vi.fn(async (chapter) => ({
      chapter,
      stats: null,
      nextEvent: null,
    })),
  };
});

import Home from "../page";

async function renderHome() {
  const ui = await Home();
  return render(ui);
}

const LIGHT_THEME_CLASSES = [
  "bg-gray-50",
  "text-gray-900",
  "bg-white",
  "border-gray-200",
];

function classTokens(element: Element | null): string[] {
  return (element?.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

describe("home page", () => {
  it("uses the meetup fallback stats without a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await renderHome();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(FALLBACK_MEETUP_STATS.memberCount).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });

  it("each homepage chapter card links to its chapter page", async () => {
    const { container } = await renderHome();

    for (const chapter of CHAPTERS) {
      const href = `/chapters/${chapter.slug}`;
      const link = container.querySelector(`a[href="${href}"]`);

      expect(link, `expected a link to ${href}`).not.toBeNull();
    }

    expect(
      screen.getByRole("heading", { level: 2, name: "Our chapters" }),
    ).toBeInTheDocument();
  });

  it("chapters section does not use light-theme classes", async () => {
    const { container } = await renderHome();

    const section = container.querySelector(
      'section[aria-labelledby="chapters-heading"]',
    );
    const heading = container.querySelector("#chapters-heading");

    expect(section).not.toBeNull();
    expect(heading).not.toBeNull();

    for (const element of [section, heading]) {
      const tokens = classTokens(element);
      for (const forbidden of LIGHT_THEME_CLASSES) {
        expect(
          tokens,
          `${forbidden} must not be used on the chapters section`,
        ).not.toContain(forbidden);
      }
    }
  });
});
