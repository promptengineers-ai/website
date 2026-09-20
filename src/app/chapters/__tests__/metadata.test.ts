import { existsSync } from "fs";
import { join } from "path";
import { vi } from "vitest";
import { CHAPTERS } from "@/config/chapters";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "--font-stub", className: "font-stub" });
  return { Montserrat: font, Space_Grotesk: font };
});

const { metadata: layoutMetadata } = await import("../../layout");
const { generateMetadata } = await import("../[slug]/page");

const HARDCODED_MEMBER_COUNT =
  /[0-9][,.]?[0-9]*(k|,[0-9]{3})\+? *(members|developers)/i;

function imageUrls(images: unknown): string[] {
  const list = Array.isArray(images) ? images : [images];
  return list
    .filter(Boolean)
    .map((image) =>
      typeof image === "string"
        ? image
        : String((image as { url: string | URL }).url),
    );
}

async function chapterMetadata() {
  return Promise.all(
    CHAPTERS.map(async (chapter) => ({
      chapter,
      metadata: await generateMetadata({ params: { slug: chapter.slug } }),
    })),
  );
}

describe("chapter metadata", () => {
  it("each chapter has a distinct title and og image", async () => {
    const entries = await chapterMetadata();

    const titles = entries.map((entry) => String(entry.metadata.title));
    const descriptions = entries.map((entry) => entry.metadata.description);
    const ogImages = entries.map((entry) =>
      imageUrls(entry.metadata.openGraph?.images).join(","),
    );

    expect(new Set(titles).size).toBe(CHAPTERS.length);
    expect(new Set(descriptions).size).toBe(CHAPTERS.length);
    expect(new Set(ogImages).size).toBe(CHAPTERS.length);

    for (const entry of entries) {
      const og = imageUrls(entry.metadata.openGraph?.images);
      const twitter = imageUrls(entry.metadata.twitter?.images);
      expect(og).toEqual([`/images/og-chapter-${entry.chapter.slug}.png`]);
      expect(twitter).toEqual(og);
      expect(String(entry.metadata.title)).toContain(entry.chapter.city);
      expect(entry.metadata.description).toContain(entry.chapter.city);
      expect(String(entry.metadata.openGraph?.url)).toBe(
        `https://promptengineers.ai/chapters/${entry.chapter.slug}`,
      );
    }

    const siteImages = imageUrls(layoutMetadata.openGraph?.images);
    for (const image of ogImages) {
      expect(siteImages).not.toContain(image);
    }
  });

  it("each referenced og image file exists on disk", async () => {
    const entries = await chapterMetadata();

    for (const entry of entries) {
      const urls = [
        ...imageUrls(entry.metadata.openGraph?.images),
        ...imageUrls(entry.metadata.twitter?.images),
      ];
      expect(urls.length).toBeGreaterThan(0);
      for (const url of urls) {
        expect(existsSync(join(process.cwd(), "public", url))).toBe(true);
      }
    }
  });

  it("launching chapter metadata carries no date and no member count", async () => {
    const entries = await chapterMetadata();

    for (const { chapter, metadata } of entries) {
      const text = [
        String(metadata.title),
        metadata.description,
        metadata.openGraph?.description,
        ...imageUrls(metadata.openGraph?.images),
      ].join(" ");
      expect(text).not.toMatch(HARDCODED_MEMBER_COUNT);
      if (chapter.status === "launching") {
        expect(text).not.toMatch(/\b20\d{2}\b|\b\d{1,2}\/\d{1,2}\b/);
        expect(text).toContain("You don't need to code");
      }
    }
  });

  it("throws notFound for an unknown slug", async () => {
    await expect(
      generateMetadata({ params: { slug: "nowhere" } }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });
});
