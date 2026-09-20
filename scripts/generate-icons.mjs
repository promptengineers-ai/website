import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const LOGO = join(PUBLIC, "pe-logo.png");
const MANIFEST = JSON.parse(
  readFileSync(join(PUBLIC, "manifest.json"), "utf8"),
);

const MASKABLE_SAFE_ZONE = 0.8;
const LOGO_FRACTION = 0.6;

function runnable(binary) {
  if (!existsSync(binary)) return false;
  return spawnSync(binary, ["--version"], { stdio: "ignore" }).status === 0;
}

function findChromium() {
  const cache = join(homedir(), ".cache", "ms-playwright");
  const builds = existsSync(cache) ? readdirSync(cache).sort().reverse() : [];
  const playwrightBinaries = [
    ...builds
      .filter((entry) => entry.startsWith("chromium_headless_shell-"))
      .map((entry) =>
        join(
          cache,
          entry,
          "chrome-headless-shell-linux64",
          "chrome-headless-shell",
        ),
      ),
    ...builds
      .filter((entry) => entry.startsWith("chromium-"))
      .map((entry) => join(cache, entry, "chrome-linux64", "chrome")),
  ];

  const found = [
    ...playwrightBinaries,
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].find(runnable);

  if (!found) {
    throw new Error(
      "No runnable Chromium binary found. Install Playwright Chromium or Google Chrome.",
    );
  }
  return found;
}

function iconHtml(size, { showSafeZone }) {
  const logoSize = Math.round(size * LOGO_FRACTION);
  const logoData = readFileSync(LOGO).toString("base64");
  const safeZone = showSafeZone
    ? `<div style="position:absolute;inset:0;margin:auto;width:${size * MASKABLE_SAFE_ZONE}px;height:${size * MASKABLE_SAFE_ZONE}px;border-radius:50%;border:1px solid #ff0000;"></div>`
    : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${size}px; height: ${size}px; overflow: hidden; }
      body {
        background: ${MANIFEST.background_color};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      img { width: ${logoSize}px; height: ${logoSize}px; display: block; }
    </style>
  </head>
  <body>
    <img src="data:image/png;base64,${logoData}" alt="" />
    ${safeZone}
  </body>
</html>
`;
}

function parseSizes(sizes) {
  const [width, height] = sizes.split("x").map(Number);
  if (!Number.isInteger(width) || width !== height) {
    throw new Error(`Only square icons are supported, got sizes="${sizes}"`);
  }
  return width;
}

const showSafeZone = process.argv.includes("--safe-zone");
const outputDir = showSafeZone
  ? mkdtempSync(join(tmpdir(), "pwa-icons-safe-zone-"))
  : PUBLIC;

const chromium = findChromium();
const workdir = mkdtempSync(join(tmpdir(), "pwa-icons-"));

for (const icon of MANIFEST.icons) {
  const size = parseSizes(icon.sizes);
  const file = icon.src.replace(/^\//, "");
  const output = join(outputDir, file);
  const htmlPath = join(workdir, `${file}.html`);
  writeFileSync(htmlPath, iconHtml(size, { showSafeZone }));

  execFileSync(
    chromium,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${size},${size}`,
      `--screenshot=${output}`,
      `file://${htmlPath}`,
    ],
    { stdio: "inherit" },
  );

  const png = readFileSync(output);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (
    png.subarray(1, 4).toString() !== "PNG" ||
    width !== size ||
    height !== size
  ) {
    throw new Error(`Unexpected output for ${file}: ${width}x${height}`);
  }
  process.stdout.write(`Wrote ${output} (${width}x${height})\n`);
}
