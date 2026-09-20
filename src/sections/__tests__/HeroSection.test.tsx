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

const SURVEY_URL = "https://forms.gle/DYBEgiiFGUUisw7V6";

const fillAndSubmit = (
  values = account,
  confirmPassword: string = values.password,
) => {
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: values.name },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: values.password },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirmPassword },
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
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
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
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
  });

  it("mismatched passwords show an error and never call register", async () => {
    const register = vi.spyOn(apiClient, "register");

    render(<HeroSection />);
    fillAndSubmit(account, "Passw0rdNO");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /passwords do not match/i,
    );
    expect(register).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveValue(account.password);
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue(
      "Passw0rdNO",
    );
  });

  it("matching passwords submit normally", async () => {
    const register = vi.spyOn(apiClient, "register").mockResolvedValue({
      message: "Account created.",
      requiresVerification: true,
    });

    render(<HeroSection />);
    fillAndSubmit(account, account.password);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/account created/i);
    });
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith(account);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("toggle reveals and re-masks both fields, and is labelled", () => {
    render(<HeroSection />);

    const toggle = screen.getByRole("button", { name: /show password/i });
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      "type",
      "password",
    );

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      "type",
      "text",
    );
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      "type",
      "text",
    );

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("success state offers the survey and a skip", async () => {
    vi.spyOn(apiClient, "register").mockResolvedValue({
      message: "Account created.",
      requiresVerification: true,
    });

    render(<HeroSection />);
    fillAndSubmit();

    await screen.findByRole("status");
    const surveyLink = screen.getByRole("link", { name: /survey/i });
    expect(surveyLink).toHaveAttribute("href", SURVEY_URL);
    expect(surveyLink).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("button", { name: /skip for now/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it("skipping leaves the created-account state intact", async () => {
    vi.spyOn(apiClient, "register").mockResolvedValue({
      message: "Account created.",
      requiresVerification: true,
    });
    const resend = vi
      .spyOn(apiClient, "resendVerification")
      .mockResolvedValue({ message: "sent" });

    render(<HeroSection />);
    fillAndSubmit();

    const skip = await screen.findByRole("button", { name: /skip for now/i });
    fireEvent.click(skip);

    expect(
      screen.queryByRole("button", { name: /skip for now/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /take the community survey/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/account created/i);
    expect(screen.getByRole("status")).toHaveTextContent(account.email);
    expect(screen.getByText(/profile page/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /resend verification/i }),
    );
    await waitFor(() => {
      expect(resend).toHaveBeenCalledWith(account.email);
    });
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
