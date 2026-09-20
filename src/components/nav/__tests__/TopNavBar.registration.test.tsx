import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navState = { pathname: "/" };
const authState: {
  user: { name: string } | null;
  status: "loading" | "authenticated" | "unauthenticated";
} = { user: null, status: "unauthenticated" };

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: authState.user,
    status: authState.status,
    logout: vi.fn(),
  }),
}));

import TopNavBar from "../TopNavBar";

const menuButton = () => screen.getByRole("button", { name: /menu/i });

const mobilePanel = async () => {
  const user = userEvent.setup();
  const button = menuButton();
  await user.click(button);
  const panel = document.getElementById(
    button.getAttribute("aria-controls") ?? "",
  );
  expect(panel).not.toBeNull();
  return panel as HTMLElement;
};

const desktopLinks = (name: RegExp) => {
  const panel = document.getElementById("top-nav-mobile-menu");
  return screen
    .queryAllByRole("link", { name })
    .filter((link) => !panel || !panel.contains(link));
};

beforeEach(() => {
  navState.pathname = "/";
  authState.user = null;
  authState.status = "unauthenticated";
});

describe("TopNavBar registration affordance", () => {
  it("signed out on an interior page: the desktop row registers at the canonical form", () => {
    navState.pathname = "/members";
    render(<TopNavBar />);

    const register = desktopLinks(/^register$/i);
    expect(register).toHaveLength(1);
    expect(register[0]).toHaveAttribute("href", "/");
  });

  it("signed out on an interior page: the mobile panel registers at the canonical form", async () => {
    navState.pathname = "/members";
    render(<TopNavBar />);

    const panel = await mobilePanel();
    const register = within(panel).getByRole("link", { name: /^register$/i });
    expect(register).toHaveAttribute("href", "/");
  });

  it("signed out on the landing page: the desktop row offers no Register, but still offers Login", () => {
    navState.pathname = "/";
    render(<TopNavBar />);

    expect(desktopLinks(/^register$/i)).toHaveLength(0);
    const login = desktopLinks(/^login$/i);
    expect(login).toHaveLength(1);
    expect(login[0]).toHaveAttribute(
      "href",
      `/login?from=${encodeURIComponent("/")}`,
    );
  });

  it("signed out on the landing page: the mobile panel offers no Register, but still offers Login", async () => {
    navState.pathname = "/";
    render(<TopNavBar />);

    const panel = await mobilePanel();
    expect(
      within(panel).queryByRole("link", { name: /^register$/i }),
    ).toBeNull();
    expect(
      within(panel).getByRole("link", { name: /^login$/i }),
    ).toHaveAttribute("href", `/login?from=${encodeURIComponent("/")}`);
  });

  it("authenticated: no Register in either row, on any pathname", async () => {
    for (const pathname of ["/", "/members", "/chapters/austin"]) {
      navState.pathname = pathname;
      authState.user = { name: "Ada" };
      authState.status = "authenticated";
      const { unmount } = render(<TopNavBar />);

      expect(desktopLinks(/^register$/i)).toHaveLength(0);
      const panel = await mobilePanel();
      expect(
        within(panel).queryByRole("link", { name: /^register$/i }),
      ).toBeNull();

      unmount();
    }
  });

  it("loading: neither row renders Register or any other signed-out affordance", async () => {
    for (const pathname of ["/", "/members"]) {
      navState.pathname = pathname;
      authState.user = null;
      authState.status = "loading";
      const { unmount } = render(<TopNavBar />);

      expect(desktopLinks(/^register$/i)).toHaveLength(0);
      expect(desktopLinks(/^login$/i)).toHaveLength(0);

      const panel = await mobilePanel();
      expect(
        within(panel).queryByRole("link", { name: /^register$/i }),
      ).toBeNull();
      expect(
        within(panel).queryByRole("link", { name: /^login$/i }),
      ).toBeNull();

      unmount();
    }
  });
});
