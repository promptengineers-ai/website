import { readFileSync } from "fs";
import { join } from "path";
import { getChapter } from "@/config/chapters";
import type { Chapter } from "@/config/chapters";
import {
  FALLBACK_MEETUP_STATS,
  formatEventCount,
  formatEventDateTime,
  formatMemberCount,
  formatRating,
  getChapterSnapshot,
  getMeetupStats,
  parseMeetupStats,
  parseNextEvent,
} from "../meetup";

const fixture = readFileSync(
  join(__dirname, "fixtures", "meetup-group.html"),
  "utf-8",
);

const newGroupFixture = readFileSync(
  join(__dirname, "fixtures", "meetup-group-new.html"),
  "utf-8",
);

const noUpcomingFixture = readFileSync(
  join(__dirname, "fixtures", "meetup-group-no-upcoming.html"),
  "utf-8",
);

const plano = getChapter("plano") as Chapter;
const stGeorge = getChapter("st-george") as Chapter;

function htmlResponse(html: string, ok = true) {
  return { ok, text: async () => html } as Response;
}

describe("parseMeetupStats", () => {
  it("reads stats from a real group page", () => {
    expect(parseMeetupStats(fixture)).toEqual({
      memberCount: 3983,
      pastEventCount: 27,
      averageRating: 4.67,
      ratingCount: 271,
      isFallback: false,
    });
  });

  it("returns null when the markup has no stats", () => {
    expect(parseMeetupStats("<html><body>nope</body></html>")).toBeNull();
  });

  it("returns null when a rating is out of range", () => {
    const bogus = fixture.replace('"average":4.67', '"average":9.9');
    expect(parseMeetupStats(bogus)).toBeNull();
  });

  it("returns null for a brand-new group with no past events", () => {
    expect(parseMeetupStats(newGroupFixture)).toBeNull();
  });
});

describe("parseNextEvent", () => {
  it("parses next event title and datetime from fixture", () => {
    expect(parseNextEvent(fixture)).toEqual({
      title: "🏗️ Building Your First Engineering Harness",
      dateTime: "2026-09-23T18:00:00-05:00",
      url: "https://www.meetup.com/plano-prompt-engineers/events/316446877/",
    });
  });

  it("unescapes JSON in the event title", () => {
    expect(parseNextEvent(newGroupFixture)).toEqual({
      title: 'Synthetic Kickoff: "Hello, Agents"',
      dateTime: "2026-10-14T18:30:00-06:00",
      url: "https://www.meetup.com/synthetic-prompt-engineers/events/900000101/",
    });
  });

  it("returns null nextEvent when no upcoming event", () => {
    expect(parseNextEvent(noUpcomingFixture)).toBeNull();
    expect(parseNextEvent("<html><body>nope</body></html>")).toBeNull();
  });
});

describe("getChapterSnapshot", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns stats and the next event for an established chapter", async () => {
    fetchMock.mockResolvedValue(htmlResponse(fixture));

    const snapshot = await getChapterSnapshot(plano);

    expect(fetchMock).toHaveBeenCalledWith(
      plano.meetupUrl,
      expect.objectContaining({ next: { revalidate: 86400 } }),
    );
    expect(snapshot.chapter).toBe(plano);
    expect(snapshot.stats?.memberCount).toBe(3983);
    expect(snapshot.stats?.isFallback).toBe(false);
    expect(snapshot.nextEvent?.title).toBe(
      "🏗️ Building Your First Engineering Harness",
    );
  });

  it("launching chapter never returns another chapter's stats", async () => {
    fetchMock.mockResolvedValue(htmlResponse(fixture));

    const snapshot = await getChapterSnapshot(stGeorge);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(snapshot).toEqual({
      chapter: stGeorge,
      stats: null,
      nextEvent: null,
    });
  });

  it("launching chapter with a Meetup URL keeps its own next event and no stats", async () => {
    const launched: Chapter = {
      ...stGeorge,
      meetupUrl: "https://www.meetup.com/synthetic-prompt-engineers/",
    };
    fetchMock.mockResolvedValue(htmlResponse(newGroupFixture));

    const snapshot = await getChapterSnapshot(launched);

    expect(fetchMock).toHaveBeenCalledWith(
      launched.meetupUrl,
      expect.anything(),
    );
    expect(snapshot.stats).toBeNull();
    expect(snapshot.nextEvent?.title).toBe(
      'Synthetic Kickoff: "Hello, Agents"',
    );
  });

  it("degrades to no stats and no event when the scrape fails", async () => {
    fetchMock.mockResolvedValue(htmlResponse("", false));
    expect(await getChapterSnapshot(plano)).toEqual({
      chapter: plano,
      stats: null,
      nextEvent: null,
    });

    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await getChapterSnapshot(plano)).toEqual({
      chapter: plano,
      stats: null,
      nextEvent: null,
    });
  });

  it("degrades to the card without an event when the page has none", async () => {
    fetchMock.mockResolvedValue(htmlResponse(noUpcomingFixture));

    const snapshot = await getChapterSnapshot(plano);

    expect(snapshot.nextEvent).toBeNull();
    expect(snapshot.stats?.memberCount).toBe(250);
  });
});

describe("getMeetupStats", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to the Plano group and keeps the fallback contract", async () => {
    fetchMock.mockResolvedValue(htmlResponse(fixture));
    expect((await getMeetupStats()).memberCount).toBe(3983);
    expect(fetchMock).toHaveBeenCalledWith(plano.meetupUrl, expect.anything());

    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await getMeetupStats()).toBe(FALLBACK_MEETUP_STATS);
  });

  it("scrapes the given chapter's group", async () => {
    const other: Chapter = {
      ...plano,
      meetupUrl: "https://www.meetup.com/synthetic-prompt-engineers/",
    };
    fetchMock.mockResolvedValue(htmlResponse(noUpcomingFixture));

    expect((await getMeetupStats(other)).memberCount).toBe(250);
    expect(fetchMock).toHaveBeenCalledWith(other.meetupUrl, expect.anything());
  });
});

describe("formatters", () => {
  it("rounds members down to the nearest hundred", () => {
    expect(formatMemberCount(3983)).toBe("3,900+");
    expect(formatMemberCount(2450)).toBe("2,400+");
  });

  it("formats events and ratings", () => {
    expect(formatEventCount(27)).toBe("27+");
    expect(formatRating(4.67)).toBe("4.7/5");
  });

  it("formats the fallback stats", () => {
    expect(formatMemberCount(FALLBACK_MEETUP_STATS.memberCount)).toBe("3,900+");
  });

  it("formats an event datetime in the event's own offset", () => {
    expect(formatEventDateTime("2026-09-23T18:00:00-05:00")).toBe(
      "Wed, Sep 23 · 6:00 PM",
    );
    expect(formatEventDateTime("2026-10-14T00:05:00-06:00")).toBe(
      "Wed, Oct 14 · 12:05 AM",
    );
    expect(formatEventDateTime("not a date")).toBeNull();
  });
});
