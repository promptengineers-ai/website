import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import SignupPage from "../signup/page";

const SOURCE = readFileSync(
  path.join(process.cwd(), "src/app/signup/page.tsx"),
  "utf8",
);

beforeEach(() => {
  redirect.mockClear();
});

describe("/signup (#55)", () => {
  it("redirects to the canonical registration surface", () => {
    expect(() => SignupPage()).toThrow(/NEXT_REDIRECT:\//);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders no registration form of its own", () => {
    expect(SOURCE).not.toContain("AuthForm");
    expect(SOURCE).not.toContain('"use client"');
  });
});
