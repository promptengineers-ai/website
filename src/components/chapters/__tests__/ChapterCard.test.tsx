import { render, screen } from "@testing-library/react";
import { getChapter } from "@/config/chapters";
import type { Chapter } from "@/config/chapters";
import type { ChapterSnapshot } from "@/types";
import ChapterCard from "../ChapterCard";

const plano = getChapter("plano") as Chapter;
const stGeorge = getChapter("st-george") as Chapter;

describe("ChapterCard", () => {
  it("renders founding state for launching chapter", () => {
    const snapshot: ChapterSnapshot = {
      chapter: stGeorge,
      stats: null,
      nextEvent: null,
    };

    render(<ChapterCard snapshot={snapshot} />);

    expect(screen.getByText("St. George, UT")).toBeInTheDocument();
    expect(screen.getByText("Launching")).toBeInTheDocument();
    expect(screen.getByText("Atwood Innovation Plaza")).toBeInTheDocument();
    expect(screen.getByText("Ryan Eggleston")).toBeInTheDocument();
    expect(screen.getByText(/first event to be announced/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/3,900/)).not.toBeInTheDocument();
  });

  it("renders the next event and Meetup link for an established chapter", () => {
    const snapshot: ChapterSnapshot = {
      chapter: plano,
      stats: {
        memberCount: 3983,
        pastEventCount: 27,
        averageRating: 4.67,
        ratingCount: 271,
        isFallback: false,
      },
      nextEvent: {
        title: "🏗️ Building Your First Engineering Harness",
        dateTime: "2026-09-23T18:00:00-05:00",
        url: "https://www.meetup.com/plano-prompt-engineers/events/316446877/",
      },
    };

    render(<ChapterCard snapshot={snapshot} />);

    expect(screen.getByText("Plano, TX")).toBeInTheDocument();
    expect(screen.getByText("Established")).toBeInTheDocument();
    expect(screen.getByText("3,900+ members")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "🏗️ Building Your First Engineering Harness",
      }),
    ).toHaveAttribute("href", snapshot.nextEvent?.url);
    expect(screen.getByText("Wed, Sep 23 · 6:00 PM")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on meetup/i })).toHaveAttribute(
      "href",
      plano.meetupUrl,
    );
  });

  it("renders no event when the scrape returned none", () => {
    render(
      <ChapterCard snapshot={{ chapter: plano, stats: null, nextEvent: null }} />,
    );

    expect(screen.getByText(/no upcoming event/i)).toBeInTheDocument();
    expect(screen.queryByText(/members/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on meetup/i })).toHaveAttribute(
      "href",
      plano.meetupUrl,
    );
  });

  it("card surface does not use light-theme classes", () => {
    const snapshot: ChapterSnapshot = {
      chapter: plano,
      stats: {
        memberCount: 3983,
        pastEventCount: 27,
        averageRating: 4.67,
        ratingCount: 271,
        isFallback: false,
      },
      nextEvent: {
        title: "\u{1F3D7}\uFE0F Building Your First Engineering Harness",
        dateTime: "2026-09-23T18:00:00-05:00",
        url: "https://www.meetup.com/plano-prompt-engineers/events/316446877/",
      },
    };

    const { container } = render(<ChapterCard snapshot={snapshot} />);

    const lightClasses = [
      "bg-white",
      "bg-gray-50",
      "text-gray-900",
      "border-gray-200",
    ];

    const card = container.querySelector("article");
    expect(card).not.toBeNull();

    const eventBlock = screen
      .getByText(/next event/i)
      .closest("div") as HTMLElement;
    expect(eventBlock).not.toBeNull();

    for (const element of [
      card as HTMLElement,
      eventBlock,
      ...Array.from(container.querySelectorAll<HTMLElement>("*")),
    ]) {
      for (const lightClass of lightClasses) {
        expect(Array.from(element.classList)).not.toContain(lightClass);
      }
    }
  });
});
