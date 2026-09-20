import { existsSync } from "fs";
import { join } from "path";
import { vi } from "vitest";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "--font-stub", className: "font-stub" });
  return { Montserrat: font, Space_Grotesk: font };
});

const { metadata } = await import("../layout");

const OG_IMAGE_PATH = "/images/og-image.png";

const HARDCODED_MEMBER_COUNT = /[0-9][,.]?[0-9]*(k|,[0-9]{3})\+? *(members|developers)/i;

function ogImageUrls(): string[] {
  const openGraphImages = metadata.openGraph?.images;
  const twitterImages = metadata.twitter?.images;
  const collected = [
    ...(Array.isArray(openGraphImages) ? openGraphImages : [openGraphImages]),
    ...(Array.isArray(twitterImages) ? twitterImages : [twitterImages]),
  ];

  return collected
    .filter(Boolean)
    .map((image) =>
      typeof image === "string"
        ? image
        : String((image as { url: string | URL }).url),
    );
}

describe("layout metadata", () => {
  it("og image path resolves to a file that exists", () => {
    const urls = ogImageUrls();

    expect(urls.length).toBeGreaterThan(0);
    expect(urls).toContain(OG_IMAGE_PATH);

    for (const url of urls) {
      expect(existsSync(join(process.cwd(), "public", url))).toBe(true);
    }
  });

  it("description contains no hardcoded member count", () => {
    const descriptions = [
      metadata.description,
      metadata.openGraph?.description,
      metadata.twitter?.description,
    ].filter((value): value is string => typeof value === "string");

    expect(descriptions.length).toBeGreaterThan(0);

    for (const description of descriptions) {
      expect(description).not.toMatch(HARDCODED_MEMBER_COUNT);
    }
  });

  it("sets metadataBase and an openGraph url on the production domain", () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(String(metadata.openGraph?.url)).toBe("https://promptengineers.ai/");
  });
});
