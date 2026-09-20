import { readFileSync } from "fs";
import { join } from "path";
import {
  FALLBACK_MEETUP_STATS,
  formatEventCount,
  formatMemberCount,
  formatRating,
  parseMeetupStats,
} from "../meetup";

const fixture = readFileSync(
  join(__dirname, "fixtures", "meetup-group.html"),
  "utf-8",
);

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
});
