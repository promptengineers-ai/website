import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeroSection from "../HeroSection";
import { ApiError, apiClient } from "@/utils/client";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

const account = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "Passw0rdOK",
};

const fillAndSubmit = (values = account) => {
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: values.name },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: values.password },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));
};

describe("HeroSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders name, email and password fields and no contact capture", () => {
    render(<HeroSection />);

    expect(screen.getByLabelText(/name/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/password/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.queryByText(/slack/i, { selector: "p" })).toBeNull();
    expect(screen.queryByText(/be in touch/i)).not.toBeInTheDocument();
  });

  it("registers with name, email and password and renders the success state", async () => {
    const register = vi.spyOn(apiClient, "register").mockResolvedValue({
      message: "Account created.",
      requiresVerification: true,
    });
    const contact = vi.spyOn(apiClient, "contactFormSubmit");

    render(<HeroSection />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/account created/i);
    });
    expect(register).toHaveBeenCalledWith(account);
    expect(contact).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(account.email);
    expect(screen.getByRole("status")).toHaveTextContent(/verification link/i);
    expect(
      screen.getByRole("button", { name: /resend verification/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it("resends the verification email from the success state", async () => {
    vi.spyOn(apiClient, "register").mockResolvedValue({
      message: "Account created.",
      requiresVerification: true,
    });
    const resend = vi
      .spyOn(apiClient, "resendVerification")
      .mockResolvedValue({ message: "sent" });

    render(<HeroSection />);
    fillAndSubmit();

    const resendButton = await screen.findByRole("button", {
      name: /resend verification/i,
    });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith(account.email);
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/sent again/i);
    });
  });

  it("renders the duplicate-email error with a sign-in link and never success on 409", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(apiClient, "register").mockRejectedValue(
      new ApiError("Email is already registered", 409),
    );

    render(<HeroSection />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /email is already registered/i,
      );
    });
    expect(
      within(screen.getByRole("alert")).getByRole("link", {
        name: /sign in/i,
      }),
    ).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/account created/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue(account.email);
  });

  it("renders each unmet password rule on a 400 rejection", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(apiClient, "register").mockRejectedValue(
      new ApiError("Password does not meet requirements", 400, [
        "Password must be at least 8 characters long",
        "Password must contain at least one uppercase letter",
      ]),
    );

    render(<HeroSection />);
    fillAndSubmit({ ...account, password: "short" });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /password does not meet requirements/i,
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /at least 8 characters long/i,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /at least one uppercase letter/i,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders an error and never success when the request rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(apiClient, "register").mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    render(<HeroSection />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/failed to fetch/i);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/account created/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue(account.name);
  });

  it("keeps the community survey as a secondary link", () => {
    render(<HeroSection />);

    expect(screen.getByRole("link", { name: /survey/i })).toHaveAttribute(
      "href",
      "https://forms.gle/DYBEgiiFGUUisw7V6",
    );
  });
});
