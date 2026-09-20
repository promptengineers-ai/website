import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeroSection from "../HeroSection";
import { ApiError, apiClient } from "@/utils/client";
import { SURVEY_URL } from "@/config/survey";
import {
  FALLBACK_MEETUP_STATS,
  formatEventCount,
  formatMemberCount,
  formatRating,
} from "@/lib/meetup";
import type { MeetupStats } from "@/types";

const auth = vi.hoisted(() => ({
  status: "unauthenticated" as "loading" | "authenticated" | "unauthenticated",
  user: null as { id: string; email: string; name?: string } | null,
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ status: auth.status, user: auth.user }),
}));

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
  beforeEach(() => {
    auth.status = "unauthenticated";
    auth.user = null;
    window.localStorage.clear();
  });

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

    const status = await screen.findByRole("status");
    const surveyLink = screen.getByRole("link", { name: /survey/i });
    expect(within(status).queryByRole("link", { name: /survey/i })).toBeNull();
    expect(
      within(status).queryByRole("button", { name: /skip for now/i }),
    ).toBeNull();
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
      SURVEY_URL,
    );
  });

  describe("signed-in members see the survey, not the signup form (#53)", () => {
    const signIn = () => {
      auth.status = "authenticated";
      auth.user = { id: "u1", email: "ada@example.com", name: "Ada" };
    };

    const surveySlot = () => screen.queryByTestId("hero-survey-slot");
    const signupForm = () =>
      screen.queryByRole("button", { name: /create account/i });

    it("unauthenticated renders the signup form and no survey block in its place", () => {
      render(<HeroSection />);

      expect(signupForm()).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(surveySlot()).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /hide this/i }),
      ).not.toBeInTheDocument();
    });

    it("authenticated renders the survey and no signup form", () => {
      signIn();
      render(<HeroSection />);

      expect(signupForm()).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(document.querySelector("form")).toBeNull();

      const slot = surveySlot();
      expect(slot).toBeInTheDocument();
      const surveyLinks = screen.getAllByRole("link", { name: /survey/i });
      expect(surveyLinks).toHaveLength(1);
      expect(surveyLinks[0]).toHaveAttribute("href", SURVEY_URL);
      expect(surveyLinks[0]).toHaveAttribute("target", "_blank");
      expect(surveyLinks[0]).toHaveAttribute(
        "rel",
        expect.stringContaining("noopener"),
      );
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /sign in/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /hide this/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatMemberCount(FALLBACK_MEETUP_STATS.memberCount)),
      ).toBeInTheDocument();
    });

    it("loading renders neither the signup form nor the survey", () => {
      auth.status = "loading";
      render(<HeroSection />);

      expect(signupForm()).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
      expect(document.querySelector("form")).toBeNull();
      expect(surveySlot()).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /survey/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("hero-auth-placeholder")).toBeInTheDocument();
    });

    it("dismissing the survey slot hides it without affecting the account", () => {
      signIn();
      render(<HeroSection />);

      fireEvent.click(screen.getByRole("button", { name: /hide this/i }));

      expect(
        screen.queryByRole("link", { name: /take the community survey/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /hide this/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
        "href",
        "/profile",
      );
      expect(signupForm()).not.toBeInTheDocument();
      expect(document.querySelector("form")).toBeNull();
      expect(auth.status).toBe("authenticated");
      expect(window.localStorage.getItem("hero-survey-dismissed")).toBe("1");
    });

    it("a prior dismissal on this device keeps the slot hidden", () => {
      window.localStorage.setItem("hero-survey-dismissed", "1");
      signIn();
      render(<HeroSection />);

      expect(
        screen.queryByRole("link", { name: /take the community survey/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
        "href",
        "/profile",
      );
      expect(signupForm()).not.toBeInTheDocument();
    });

    it("account-unlock line is hidden from a signed-in member", () => {
      signIn();
      render(<HeroSection />);

      expect(
        screen.queryByText(/creates a member profile you can choose to list/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Events Hosted")).toBeInTheDocument();
      expect(screen.getByText("Rating")).toBeInTheDocument();
    });

    it("account-unlock line does not render while auth is loading", () => {
      auth.status = "loading";
      render(<HeroSection />);

      expect(
        screen.queryByText(/creates a member profile you can choose to list/i),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    it("renders the survey when localStorage throws", () => {
      const getItem = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("SecurityError");
        });
      signIn();
      render(<HeroSection />);

      expect(getItem).toHaveBeenCalled();
      expect(
        screen.getByRole("link", { name: /take the community survey/i }),
      ).toHaveAttribute("href", SURVEY_URL);
      expect(signupForm()).not.toBeInTheDocument();
    });
  });

  describe("live proof above the ask (#49)", () => {
    const signupForm = () =>
      screen.getByRole("button", { name: /create account/i }).closest("form");

    it("live stats render above the signup form in DOM order", () => {
      render(<HeroSection />);

      const form = signupForm();
      expect(form).not.toBeNull();
      for (const label of ["Members", "Events Hosted", "Rating"]) {
        const stat = screen.getByText(label);
        expect(
          stat.compareDocumentPosition(form as Node) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      }
    });

    it("stat values come from the stats prop, not literals", () => {
      const fake: MeetupStats = {
        memberCount: 5432,
        pastEventCount: 91,
        averageRating: 3.3,
        ratingCount: 7,
        isFallback: false,
      };
      render(<HeroSection stats={fake} />);

      expect(
        screen.getByText(formatMemberCount(fake.memberCount)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatEventCount(fake.pastEventCount)),
      ).toBeInTheDocument();
      expect(
        screen.getByText(formatRating(fake.averageRating)),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(
          formatMemberCount(FALLBACK_MEETUP_STATS.memberCount),
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          formatEventCount(FALLBACK_MEETUP_STATS.pastEventCount),
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(formatRating(FALLBACK_MEETUP_STATS.averageRating)),
      ).not.toBeInTheDocument();
    });

    it("states what an account unlocks", () => {
      render(<HeroSection />);

      const line = screen.getByText(
        /creates a member profile you can choose to list in the browsable members directory/i,
      );
      expect(line).toBeInTheDocument();
      expect(
        line.compareDocumentPosition(signupForm() as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(line).not.toHaveTextContent(/slack|meetup|invite|newsletter/i);
    });
  });

  describe("logo image, not the robot emoji (#54)", () => {
    const ROBOT = String.fromCodePoint(0x1f916);
    const logo = () => document.querySelector('img[src="/pe-logo.png"]');

    it.each(["unauthenticated", "authenticated", "loading"] as const)(
      "renders the logo image and no robot emoji (%s)",
      (status) => {
        auth.status = status;
        auth.user =
          status === "authenticated"
            ? { id: "u1", email: "ada@example.com", name: "Ada" }
            : null;
        render(<HeroSection />);

        const image = logo();
        expect(image).not.toBeNull();
        expect(image).toHaveAttribute("width", "72");
        expect(image).toHaveAttribute("height", "72");
        expect(image).toHaveAttribute("alt", "");
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        expect(document.body.textContent).not.toContain(ROBOT);
      },
    );
  });

  describe("password rules stated once (#51)", () => {
    const RULES = /8\+ characters/i;

    const ruleStatements = () => {
      const inText = screen.queryAllByText(RULES).length;
      const inPlaceholders = Array.from(
        document.querySelectorAll("[placeholder]"),
      ).filter((el) => RULES.test(el.getAttribute("placeholder") ?? "")).length;
      return inText + inPlaceholders;
    };

    it("password rules are stated exactly once", () => {
      render(<HeroSection />);

      expect(ruleStatements()).toBe(1);
      expect(
        screen.getByLabelText(/^password$/i).getAttribute("placeholder") ?? "",
      ).not.toMatch(/8\+|upper|lower|number/i);
    });

    it("rules remain associated with the password field", () => {
      render(<HeroSection />);

      const field = screen.getByLabelText(/^password$/i);
      fireEvent.change(field, { target: { value: "Partial1" } });
      field.focus();

      const describedBy = field.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      const rules = document.getElementById(describedBy as string);
      expect(rules).not.toBeNull();
      expect(rules).toHaveTextContent(RULES);
      expect(rules).toHaveTextContent(/uppercase letter/i);
      expect(rules).toHaveTextContent(/lowercase letter/i);
      expect(rules).toHaveTextContent(/number/i);
      expect(rules).toHaveTextContent(/free/i);
      expect(field).toHaveValue("Partial1");
    });
  });

  describe("mobile spacing (#56)", () => {
    it("hero reserves top space for the fixed nav", () => {
      const { container } = render(<HeroSection />);

      const hero = container.firstElementChild as HTMLElement;
      expect(hero).toHaveClass("min-h-screen", "justify-center");
      // Guard the defect (no top padding at all), not one exact value — the
      // scale is tuned for space and differs per breakpoint.
      expect(hero.className).toMatch(/(^|\s)pt-\S+/);
      expect(hero.className).toMatch(/(^|\s)sm:pt-\S+/);
    });

    it("social links carry bottom spacing", () => {
      render(<HeroSection />);

      const socials = screen.getByRole("link", { name: /slack/i })
        .parentElement as HTMLElement;
      expect(socials).toHaveClass("flex", "justify-center");
      // Guard the defect (flush against the chapters divider), not one exact
      // value — the scale is tuned for space and differs per breakpoint.
      expect(socials.className).toMatch(/(^|\s)mb-\S+/);
      expect(socials.className).toMatch(/(^|\s)sm:mb-\S+/);
    });
  });
});
