import { existsSync, readFileSync } from "fs";
import { join } from "path";

type ManifestIcon = { src: string; sizes: string; type?: string };

const PUBLIC_DIR = join(process.cwd(), "public");

const manifest = JSON.parse(
  readFileSync(join(PUBLIC_DIR, "manifest.json"), "utf8"),
) as { icons: ManifestIcon[] };

function iconPath(icon: ManifestIcon): string {
  return join(PUBLIC_DIR, icon.src.replace(/^\//, ""));
}

function pngDimensions(file: string): { width: number; height: number } {
  const header = readFileSync(file);
  expect(header.subarray(1, 4).toString()).toBe("PNG");
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

describe("public/manifest.json icons", () => {
  it("declares at least one icon", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it("every icon referenced by the manifest exists on disk", () => {
    const missing = manifest.icons
      .filter((icon) => !existsSync(iconPath(icon)))
      .map((icon) => icon.src);

    expect(missing).toEqual([]);
  });

  it("each icon's PNG header matches its declared sizes", () => {
    for (const icon of manifest.icons) {
      const [declaredWidth, declaredHeight] = icon.sizes.split("x").map(Number);
      const actual = pngDimensions(iconPath(icon));

      expect({ src: icon.src, ...actual }).toEqual({
        src: icon.src,
        width: declaredWidth,
        height: declaredHeight,
      });
    }
  });
});
