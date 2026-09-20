import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: () => <div data-testid="avatar" />,
}));

vi.mock("react-qr-code", () => ({
  default: () => <div data-testid="qr" />,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { name: "Alice", email: "alice@test.com" },
    status: "authenticated",
  }),
}));

vi.mock("@/components/profile/DeleteAccountCard", () => ({
  default: () => <div data-testid="delete-account" />,
}));

import ProfilePage from "../page";

const SURVEY_URL = "https://forms.gle/DYBEgiiFGUUisw7V6";

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe("ProfilePage survey entry point", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("profile exposes a durable survey entry point", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        profile: {
          userId: "652f1c2a3b4c5d6e7f809113",
          links: {},
          background: "",
          seeking: ["networking"],
          isPublic: false,
          badges: [],
        },
      }),
    );

    render(<ProfilePage />);

    const link = await screen.findByRole("link", { name: /survey/i });
    expect(link).toHaveAttribute("href", SURVEY_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it("offers the survey before a profile has been created", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(404, {}));

    render(<ProfilePage />);

    expect(
      await screen.findByText(/haven't created your profile/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /survey/i })).toHaveAttribute(
      "href",
      SURVEY_URL,
    );
  });
});
