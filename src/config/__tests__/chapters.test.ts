import { describe, it, expect } from "vitest";
import {
  CHAPTERS,
  CHAPTER_SLUGS,
  chapterLabel,
  getChapter,
  isChapterSlug,
} from "@/config/chapters";

describe("chapter registry", () => {
  it("contains the plano and st-george chapters", () => {
    expect(CHAPTER_SLUGS).toContain("plano");
    expect(CHAPTER_SLUGS).toContain("st-george");
    expect(CHAPTERS).toHaveLength(CHAPTER_SLUGS.length);
  });
});

describe("isChapterSlug", () => {
  it("accepts known slugs", () => {
    for (const slug of CHAPTER_SLUGS) {
      expect(isChapterSlug(slug)).toBe(true);
    }
  });

  it("rejects unknown slugs", () => {
    expect(isChapterSlug("atlantis")).toBe(false);
    expect(isChapterSlug("PLANO")).toBe(false);
    expect(isChapterSlug("")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isChapterSlug(undefined)).toBe(false);
    expect(isChapterSlug(null)).toBe(false);
    expect(isChapterSlug(42)).toBe(false);
    expect(isChapterSlug(["plano"])).toBe(false);
  });
});

describe("chapterLabel", () => {
  it("returns city and state for a known slug", () => {
    const plano = getChapter("plano");
    expect(plano).toBeDefined();
    expect(chapterLabel("plano")).toBe(`${plano!.city}, ${plano!.state}`);
  });

  it("falls back to the slug for an unknown chapter", () => {
    expect(chapterLabel("atlantis")).toBe("atlantis");
  });
});
