import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
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
