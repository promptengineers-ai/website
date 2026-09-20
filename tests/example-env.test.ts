import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const RUNTIME_PROVIDED = new Set(["NODE_ENV"]);

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

function varsReadByCode(): Set<string> {
  const names = new Set<string>();
  for (const file of [
    ...sourceFiles(path.join(ROOT, "src")),
    ...sourceFiles(path.join(ROOT, "scripts")),
  ]) {
    for (const match of fs
      .readFileSync(file, "utf8")
      .matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      if (!RUNTIME_PROVIDED.has(match[1])) names.add(match[1]);
    }
  }
  return names;
}

function varsDeclaredInExample(): Set<string> {
  const contents = fs.readFileSync(path.join(ROOT, ".example.env"), "utf8");
  return new Set(
    contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0]),
  );
}

describe(".example.env", () => {
  it("declares every environment variable the code reads", () => {
    const missing = [...varsReadByCode()].filter(
      (name) => !varsDeclaredInExample().has(name),
    );
    expect(missing).toEqual([]);
  });

  it("declares no variable the code never reads", () => {
    const read = varsReadByCode();
    const stale = [...varsDeclaredInExample()].filter(
      (name) => !read.has(name),
    );
    expect(stale).toEqual([]);
  });
});
