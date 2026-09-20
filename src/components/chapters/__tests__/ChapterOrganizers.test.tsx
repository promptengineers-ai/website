import { render, screen } from "@testing-library/react";
import { CHAPTERS, getChapter } from "@/config/chapters";
import type { Chapter } from "@/config/chapters";
import ChapterOrganizers from "../ChapterOrganizers";

const plano = getChapter("plano") as Chapter;

describe("ChapterOrganizers", () => {
  it("renders a heading and a card for every chapter with organizers", () => {
    render(<ChapterOrganizers />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Chapter organizers" }),
    ).toBeInTheDocument();

    const withOrganizers = CHAPTERS.filter(
      (chapter) => chapter.organizers.length > 0,
    );

    expect(withOrganizers.length).toBeGreaterThan(0);

    for (const chapter of withOrganizers) {
      expect(
        screen.getByRole("heading", {
          level: 3,
          name: `${chapter.city}, ${chapter.state}`,
        }),
      ).toBeInTheDocument();
      for (const organizer of chapter.organizers) {
        expect(screen.getByText(organizer.name)).toBeInTheDocument();
      }
    }
  });

  it("links a known organizer to LinkedIn, GitHub and email", () => {
    render(<ChapterOrganizers />);

    const organizer = plano.organizers[0];

    expect(
      screen.getByRole("link", { name: `${organizer.name} on LinkedIn` }),
    ).toHaveAttribute("href", organizer.linkedinUrl);
    expect(
      screen.getByRole("link", { name: `${organizer.name} on GitHub` }),
    ).toHaveAttribute("href", organizer.githubUrl);
    expect(
      screen.getByRole("link", { name: `Email ${organizer.name}` }),
    ).toHaveAttribute("href", `mailto:${organizer.email}`);
  });

  it("opens external profiles in a new tab and keeps mailto in place", () => {
    render(<ChapterOrganizers />);

    const organizer = plano.organizers[0];

    for (const name of [
      `${organizer.name} on LinkedIn`,
      `${organizer.name} on GitHub`,
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }

    const mailto = screen.getByRole("link", {
      name: `Email ${organizer.name}`,
    });
    expect(mailto).not.toHaveAttribute("target");
    expect(mailto).not.toHaveAttribute("rel");
  });
});
