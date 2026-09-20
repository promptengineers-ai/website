import { readFileSync } from "fs";
import { join } from "path";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { CHAPTERS, CHAPTER_SLUGS } from "@/config/chapters";

vi.mock("@/components/nav/TopNavBar", () => ({
  default: () => <div data-testid="top-nav-bar" />,
}));

import ChapterPage, { generateStaticParams } from "../[slug]/page";

const planoFixture = readFileSync(
  join(process.cwd(), "src/lib/__tests__/fixtures/meetup-group.html"),
  "utf-8",
);

const DATE_PATTERN =
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b20\d{2}\b|\b(mon|tues|wednes|thurs|fri|satur|sun)day\b/i;

async function renderChapter(slug: string) {
  const ui = await ChapterPage({ params: { slug } });
  return render(ui);
}

describe("chapter page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => planoFixture,
    } as Response);
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generateStaticParams returns all registry slugs", async () => {
    const params = await generateStaticParams();

    expect(params.map((entry) => entry.slug).sort()).toEqual(
      [...CHAPTER_SLUGS].sort(),
    );
  });

  it("renders founding copy for launching chapter", async () => {
    await renderChapter("st-george");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /AI Build Night — St\. George/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/You don't need to code\./)).toBeInTheDocument();
    expect(
      screen.getByText(/Bring a laptop, or just bring questions\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/No talk, no agenda\./)).toBeInTheDocument();
    expect(screen.getByText(/Both are the point\./)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Atwood Innovation Plaza/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/6–9 PM/)).toBeInTheDocument();
  });

  it("renders no date for a launching chapter", async () => {
    const { container } = await renderChapter("st-george");

    expect(
      screen.getAllByText(/first event to be announced/i).length,
    ).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(DATE_PATTERN);
    expect(container.querySelector("time")).toBeNull();
    expect(container.textContent).not.toMatch(/booked|confirmed|reserved/i);
  });

  it("the St. George page never renders Plano's stats", async () => {
    const { container } = await renderChapter("st-george");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/3,9\d\d|3,900|3983/);
    expect(container.textContent).not.toMatch(
      /Building Your First Engineering Harness/,
    );
    expect(
      screen.queryByRole("link", { name: /meetup/i }),
    ).not.toBeInTheDocument();
  });

  it("renders live Meetup data and no editorial copy for Plano", async () => {
    const { container } = await renderChapter("plano");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("heading", { level: 1, name: /Plano, TX/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^3,900\+ /)).toHaveTextContent(/members$/);
    expect(
      screen.getByRole("link", {
        name: "🏗️ Building Your First Engineering Harness",
      }),
    ).toHaveAttribute(
      "href",
      "https://www.meetup.com/plano-prompt-engineers/events/316446877/",
    );
    expect(
      screen.getByRole("link", { name: /rsvp on meetup/i }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/You don't need to code/);
    expect(container.textContent).not.toMatch(/No talk, no agenda/);
  });

  it("emphasis sentence renders byte-identical", async () => {
    const { container } = await renderChapter("st-george");

    const match = Array.from(container.querySelectorAll("*")).filter(
      (node) => node.textContent === "You don't need to code.",
    );

    expect(match.length).toBeGreaterThan(0);
  });

  it("emphasis precedes the descriptive paragraphs in DOM order", async () => {
    const { container } = await renderChapter("st-george");

    const emphasis = screen.getByText("You don't need to code.");
    const lead = screen.getByText(/Bring a laptop, or just bring questions\./);
    const format = screen.getByText(/No talk, no agenda\./);
    const audience = screen.getByText(
      /Developers, founders, students, and the AI-curious\./,
    );

    for (const later of [lead, format, audience]) {
      expect(
        emphasis.compareDocumentPosition(later) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    expect(container.textContent).toContain("You don't need to code.");
  });

  it("emphasis appears exactly once", async () => {
    const { container } = await renderChapter("st-george");

    const occurrences =
      (container.textContent ?? "").split("You don't need to code.").length - 1;

    expect(occurrences).toBe(1);
  });

  it("a chapter page links to the other chapter and not to itself", async () => {
    for (const chapter of CHAPTERS) {
      const { container, unmount } = await renderChapter(chapter.slug);

      const hrefs = Array.from(
        container.querySelectorAll("a[href^='/chapters/']"),
      ).map((node) => node.getAttribute("href"));

      expect(hrefs).not.toContain(`/chapters/${chapter.slug}`);
      for (const other of CHAPTERS.filter(
        (entry) => entry.slug !== chapter.slug,
      )) {
        expect(hrefs).toContain(`/chapters/${other.slug}`);
      }

      unmount();
    }
  });

  it("throws notFound for an unknown slug", async () => {
    await expect(ChapterPage({ params: { slug: "nowhere" } })).rejects.toThrow(
      /NEXT_NOT_FOUND/,
    );
  });
});
