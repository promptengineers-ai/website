import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroSection from "../HeroSection";
import { apiClient } from "@/utils/client";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

const submitEmail = (email: string) => {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: /join/i }));
};

describe("HeroSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows error and does not show success on failed submit", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(apiClient, "contactFormSubmit").mockRejectedValue(
      new Error("Failed to subscribe"),
    );

    render(<HeroSection />);
    submitEmail("visitor@example.com");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /failed to subscribe/i,
      );
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/you're in/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue("visitor@example.com");
  });

  it("shows success and clears the field on a successful submit", async () => {
    vi.spyOn(apiClient, "contactFormSubmit").mockResolvedValue({
      message: "Successfully Subscribed!",
    });

    render(<HeroSection />);
    submitEmail("visitor@example.com");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/you're in/i);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
  });

  it("keeps the community survey as a secondary link", () => {
    render(<HeroSection />);

    expect(screen.getByRole("link", { name: /survey/i })).toHaveAttribute(
      "href",
      "https://forms.gle/DYBEgiiFGUUisw7V6",
    );
  });
});
