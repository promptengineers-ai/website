import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CHAPTERS } from "@/config/chapters";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: null,
    status: "unauthenticated",
    logout: vi.fn(),
  }),
}));

import TopNavBar from "../TopNavBar";

const disclosureButtons = () =>
  screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-expanded"));

const menuButton = () => screen.getByRole("button", { name: /menu/i });

describe("TopNavBar", () => {
  it("renders a link for every chapter in the registry", () => {
    render(<TopNavBar />);

    expect(CHAPTERS.length).toBeGreaterThan(0);
    for (const chapter of CHAPTERS) {
      const links = screen.getAllByRole("link", { name: chapter.name });
      expect(
        links.some(
          (link) => link.getAttribute("href") === `/chapters/${chapter.slug}`,
        ),
      ).toBe(true);
    }
  });

  it("members remains reachable at small widths", async () => {
    const user = userEvent.setup();
    render(<TopNavBar />);

    const button = menuButton();
    expect(button).toHaveAttribute("aria-expanded", "false");

    button.focus();
    await user.keyboard("{Enter}");

    expect(button).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(
      button.getAttribute("aria-controls") ?? "",
    );
    expect(panel).not.toBeNull();

    const members = within(panel as HTMLElement).getByRole("link", {
      name: /members/i,
    });
    expect(members).toHaveAttribute("href", "/members");

    for (const chapter of CHAPTERS) {
      expect(
        within(panel as HTMLElement).getByRole("link", { name: chapter.name }),
      ).toHaveAttribute("href", `/chapters/${chapter.slug}`);
    }
  });

  it("any disclosure control is labelled and keyboard operable", async () => {
    const user = userEvent.setup();
    render(<TopNavBar />);

    const buttons = disclosureButtons();
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAccessibleName();
      expect(button).toHaveAttribute("aria-expanded", "false");

      button.focus();
      expect(button).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(button).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Escape}");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveFocus();

      await user.keyboard(" ");
      expect(button).toHaveAttribute("aria-expanded", "true");
      await user.keyboard(" ");
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
  });
});
