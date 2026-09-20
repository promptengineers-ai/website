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
const OUTPUT = join(ROOT, "public", "images", "og-image.png");
const WIDTH = 1200;
const HEIGHT = 630;

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

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${WIDTH}px; height: ${HEIGHT}px; }
      body {
        background: #000;
        color: #fff;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 88px 96px;
        position: relative;
        overflow: hidden;
      }
      .glow-a, .glow-b {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
      }
      .glow-a {
        width: 620px; height: 620px;
        background: rgba(59, 130, 246, 0.38);
        top: -240px; left: -180px;
      }
      .glow-b {
        width: 640px; height: 640px;
        background: rgba(147, 51, 234, 0.34);
        bottom: -300px; right: -200px;
      }
      .content { position: relative; z-index: 1; }
      .eyebrow {
        font-size: 24px;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        color: #9ca3af;
        margin-bottom: 30px;
      }
      h1 {
        font-size: 96px;
        line-height: 1.02;
        font-weight: 700;
        letter-spacing: -0.02em;
        background: linear-gradient(90deg, #60a5fa 0%, #a78bfa 55%, #f472b6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p.tagline {
        margin-top: 32px;
        font-size: 36px;
        font-weight: 300;
        color: #d1d5db;
        max-width: 900px;
        line-height: 1.32;
      }
      .chapters {
        margin-top: 52px;
        display: flex;
        gap: 20px;
      }
      .chip {
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 14px 32px;
        font-size: 26px;
        color: #e5e7eb;
      }
      .rule {
        position: absolute;
        left: 0; right: 0; bottom: 0;
        height: 10px;
        background: linear-gradient(90deg, #3b82f6 0%, #9333ea 50%, #ec4899 100%);
      }
    </style>
  </head>
  <body>
    <div class="glow-a"></div>
    <div class="glow-b"></div>
    <div class="content">
      <div class="eyebrow">AI Community Meetup</div>
      <h1>Prompt Engineers AI</h1>
      <p class="tagline">
        Developers and tech enthusiasts exploring ChatGPT, LLMs, and the future
        of AI.
      </p>
      <div class="chapters">
        <span class="chip">Plano, TX</span>
        <span class="chip">St. George, UT</span>
      </div>
    </div>
    <div class="rule"></div>
  </body>
</html>
`;

const workdir = mkdtempSync(join(tmpdir(), "og-image-"));
const htmlPath = join(workdir, "card.html");
writeFileSync(htmlPath, html);

execFileSync(
  findChromium(),
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${WIDTH},${HEIGHT}`,
    `--screenshot=${OUTPUT}`,
    `file://${htmlPath}`,
  ],
  { stdio: "inherit" },
);

const png = readFileSync(OUTPUT);
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (png.subarray(1, 4).toString() !== "PNG" || width !== WIDTH || height !== HEIGHT) {
  throw new Error(`Unexpected output: ${width}x${height}`);
}
process.stdout.write(`Wrote ${OUTPUT} (${width}x${height})\n`);
