import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROBOT = String.fromCodePoint(0x1f916);
const SRC = path.resolve(process.cwd(), "src");

const EXCLUDED = [path.join(SRC, "lib", "__tests__", "fixtures")];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (EXCLUDED.some((excluded) => full === excluded)) return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

describe("robot emoji is gone from our own source (#54)", () => {
  it("no file under src/ contains the robot emoji", () => {
    const offenders = walk(SRC).filter((file) =>
      readFileSync(file, "utf8").includes(ROBOT),
    );

    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it("the one excluded path is the scraped Meetup fixture, and it still holds the robot", () => {
    const fixture = path.join(
      SRC,
      "lib",
      "__tests__",
      "fixtures",
      "meetup-group.html",
    );
    const html = readFileSync(fixture, "utf8");

    expect(html).toContain(ROBOT);
    expect(html).toContain(
      `This description was created using ChatGPT. ${ROBOT}`,
    );
  });
});
