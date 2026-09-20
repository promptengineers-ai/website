import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

import AuthForm from "../AuthForm";

describe("AuthForm reveal toggles", () => {
  it("exposes both toggles by distinct accessible names on signup", () => {
    render(<AuthForm type="signup" onSubmit={vi.fn()} />);

    const passwordToggle = screen.getByRole("button", {
      name: /^show password$/i,
    });
    const confirmToggle = screen.getByRole("button", {
      name: /^show confirm password$/i,
    });

    expect(passwordToggle).toHaveAttribute("type", "button");
    expect(confirmToggle).toHaveAttribute("type", "button");
    expect(passwordToggle).not.toBe(confirmToggle);
    expect(passwordToggle.getAttribute("aria-label")).not.toEqual(
      confirmToggle.getAttribute("aria-label"),
    );
    expect(passwordToggle.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(confirmToggle.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("flips aria-pressed and the field type independently for each toggle", () => {
    render(<AuthForm type="signup" onSubmit={vi.fn()} />);

    const passwordToggle = screen.getByRole("button", {
      name: /^show password$/i,
    });
    const confirmToggle = screen.getByRole("button", {
      name: /^show confirm password$/i,
    });
    const password = screen.getByLabelText(/^password$/i);
    const confirm = screen.getByLabelText(/^confirm password$/i);

    expect(passwordToggle).toHaveAttribute("aria-pressed", "false");
    expect(confirmToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(passwordToggle);
    expect(passwordToggle).toHaveAttribute("aria-pressed", "true");
    expect(confirmToggle).toHaveAttribute("aria-pressed", "false");
    expect(password).toHaveAttribute("type", "text");
    expect(confirm).toHaveAttribute("type", "password");

    fireEvent.click(confirmToggle);
    expect(confirmToggle).toHaveAttribute("aria-pressed", "true");
    expect(confirm).toHaveAttribute("type", "text");

    fireEvent.click(passwordToggle);
    fireEvent.click(confirmToggle);
    expect(passwordToggle).toHaveAttribute("aria-pressed", "false");
    expect(confirmToggle).toHaveAttribute("aria-pressed", "false");
    expect(password).toHaveAttribute("type", "password");
    expect(confirm).toHaveAttribute("type", "password");
  });

  it("labels the single toggle on login", () => {
    render(<AuthForm type="login" onSubmit={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: /^show password$/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByRole("button", { name: /confirm password/i }),
    ).not.toBeInTheDocument();
  });
});

describe("AuthForm logo image (#54)", () => {
  const ROBOT = String.fromCodePoint(0x1f916);
  const logo = () => document.querySelector('img[src="/pe-logo.png"]');

  it.each(["login", "signup"] as const)(
    "renders the logo image with an empty accessible name (%s)",
    (type) => {
      render(<AuthForm type={type} onSubmit={vi.fn()} />);

      const image = logo();
      expect(image).not.toBeNull();
      expect(image).toHaveAttribute("width", "60");
      expect(image).toHaveAttribute("height", "60");
      expect(image).toHaveAttribute("alt", "");
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(document.body.textContent).not.toContain(ROBOT);
    },
  );
});

describe("AuthForm registration route (#55)", () => {
  it("points the login page's create-a-new-account link at the canonical form", () => {
    render(<AuthForm type="login" onSubmit={vi.fn()} />);

    const link = screen.getByRole("link", { name: /^create a new account$/i });
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveTextContent(/^create a new account$/);
  });

  it("leaves the signup page's sign-in link unchanged", () => {
    render(<AuthForm type="signup" onSubmit={vi.fn()} />);

    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
