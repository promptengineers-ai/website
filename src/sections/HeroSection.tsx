"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ApiError, apiClient } from "@/utils/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { SURVEY_URL } from "@/config/survey";
import { FaSlack, FaMeetup, FaLinkedin } from "react-icons/fa";
import {
  FALLBACK_MEETUP_STATS,
  formatEventCount,
  formatMemberCount,
  formatRating,
} from "@/lib/meetup";
import type { MeetupStats } from "@/types";

const SURVEY_DISMISSED_KEY = "hero-survey-dismissed";
const AUTH_SLOT_CLASS = "flex min-h-[22rem] w-full flex-col items-center";

function readSurveyDismissed(): boolean {
  try {
    return window.localStorage.getItem(SURVEY_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSurveyDismissed() {
  try {
    window.localStorage.setItem(SURVEY_DISMISSED_KEY, "1");
  } catch {}
}

const HeroSection = ({
  stats = FALLBACK_MEETUP_STATS,
}: {
  stats?: MeetupStats;
}) => {
  const { status } = useAuth();
  const [surveyDismissed, setSurveyDismissed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [surveySkipped, setSurveySkipped] = useState(false);
  const [error, setError] = useState<{
    message: string;
    details: string[];
    status?: number;
  } | null>(null);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedEmail(null);

    if (password !== confirmPassword) {
      setError({
        message: "Passwords do not match. No account was created.",
        details: [],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.register({ name, email, password });
      setCreatedEmail(email);
      setResendState("idle");
      setSurveySkipped(false);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } catch (err) {
      console.error("Error creating account:", err);
      if (err instanceof ApiError) {
        setError({
          message: err.message,
          details: err.details,
          status: err.status,
        });
      } else {
        setError({
          message:
            err instanceof Error && err.message
              ? err.message
              : "Something went wrong. Please try again.",
          details: [],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!createdEmail || resendState === "sending") return;
    setResendState("sending");
    try {
      await apiClient.resendVerification(createdEmail);
      setResendState("sent");
    } catch (err) {
      console.error("Error resending verification email:", err);
      setResendState("failed");
    }
  };

  useEffect(() => {
    setSurveyDismissed(readSurveyDismissed());
  }, []);

  const dismissSurvey = () => {
    writeSurveyDismissed();
    setSurveyDismissed(true);
  };

  const passwordsDiffer =
    confirmPassword.length > 0 && password !== confirmPassword;

  const fieldClass =
    "w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-base text-white placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black pt-24 text-white">
      {/* Logo/Icon Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-5 flex items-center justify-center"
      >
        <Image src="/pe-logo.png" alt="" width={72} height={72} />
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mb-6 text-center text-4xl font-bold tracking-tight md:text-6xl"
      >
        Prompt Engineers
        <br />
        <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          AI Community
        </span>
      </motion.h1>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mb-6 max-w-2xl px-4 text-center text-base font-light text-gray-300 sm:text-lg"
      >
        A community of developers and tech enthusiasts in Plano, TX and St.
        George, UT exploring ChatGPT, LLMs, and the future of AI
      </motion.p>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mb-8 flex max-w-xl flex-wrap justify-center gap-x-8 gap-y-4 px-4 text-center"
      >
        <div>
          <div className="text-3xl font-bold text-blue-400">
            {formatMemberCount(stats.memberCount)}
          </div>
          <div className="text-sm text-gray-400">Members</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-purple-400">
            {formatEventCount(stats.pastEventCount)}
          </div>
          <div className="text-sm text-gray-400">Events Hosted</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-400">
            {formatRating(stats.averageRating)}
          </div>
          <div className="text-sm text-gray-400">Rating</div>
        </div>
        {status === "unauthenticated" ? (
          <p className="basis-full text-sm text-gray-300">
            An account creates a member profile you can choose to list in the
            browsable members directory.
          </p>
        ) : null}
      </motion.div>

      {/* Primary CTA - Signup form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mb-12 flex w-full max-w-xl flex-col items-center gap-4 px-4"
      >
        {status === "loading" ? (
          <div
            data-testid="hero-auth-placeholder"
            aria-hidden="true"
            className={AUTH_SLOT_CLASS}
          />
        ) : status === "authenticated" ? (
          <div
            data-testid="hero-survey-slot"
            className={`${AUTH_SLOT_CLASS} justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-center text-sm text-gray-300`}
          >
            {surveyDismissed ? (
              <p>
                Survey prompt hidden on this device. The community survey stays
                open on your{" "}
                <a
                  href="/profile"
                  className="font-medium text-blue-300 underline underline-offset-4 hover:text-white"
                >
                  profile page
                </a>
                .
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-white">
                  Community survey
                </p>
                <p>
                  Optional: the community survey is open if you would like to
                  tell us about yourself.
                </p>
                <a
                  href={SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  Take the community survey
                </a>
                <button
                  type="button"
                  onClick={dismissSurvey}
                  className="text-gray-400 underline-offset-4 hover:text-white hover:underline"
                >
                  Already filled it out? Hide this.
                </button>
                <p className="text-xs text-gray-500">
                  Hiding it only affects this device. The survey stays open on
                  your profile page.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {createdEmail ? (
              <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-5 text-center text-sm text-green-200">
                <div
                  role="status"
                  className="flex w-full flex-col items-center gap-3"
                >
                  <p className="text-base font-semibold text-green-300">
                    Account created.
                  </p>
                  <p>
                    Check <span className="font-medium">{createdEmail}</span>{" "}
                    for a verification link. If it does not arrive, you can
                    resend it.
                  </p>
                  {resendState === "sent" ? (
                    <p>Verification email sent again.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState === "sending"}
                      className="font-medium text-green-300 underline underline-offset-4 hover:text-white disabled:opacity-60"
                    >
                      {resendState === "sending"
                        ? "Sending…"
                        : resendState === "failed"
                          ? "Resend failed — try again"
                          : "Resend verification email"}
                    </button>
                  )}
                </div>
                <div className="mt-2 w-full border-t border-green-500/20 pt-3 text-gray-300">
                  {surveySkipped ? (
                    <p>
                      You can take the community survey later from your profile
                      page.
                    </p>
                  ) : (
                    <>
                      <p>
                        Optional: the community survey is open if you would like
                        to tell us about yourself.
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                        <a
                          href={SURVEY_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-300 underline underline-offset-4 hover:text-white"
                        >
                          Take the community survey
                        </a>
                        <button
                          type="button"
                          onClick={() => setSurveySkipped(true)}
                          className="text-gray-400 underline-offset-4 hover:text-white hover:underline"
                        >
                          Skip for now
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-3"
                aria-describedby={error ? "hero-signup-error" : undefined}
              >
                <label htmlFor="hero-name" className="sr-only">
                  Name
                </label>
                <input
                  id="hero-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                />
                <label htmlFor="hero-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="hero-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={error?.status === 409 ? true : undefined}
                  className={fieldClass}
                />
                <label htmlFor="hero-password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="hero-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    aria-invalid={error?.details.length ? true : undefined}
                    aria-describedby={error ? undefined : "hero-password-rules"}
                    className={`${fieldClass} pr-20`}
                  />
                  <button
                    type="button"
                    aria-label="Show password"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 flex items-center rounded-full px-4 text-sm font-medium text-gray-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:opacity-60"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <label htmlFor="hero-confirm-password" className="sr-only">
                  Confirm password
                </label>
                <input
                  id="hero-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  aria-invalid={passwordsDiffer ? true : undefined}
                  aria-describedby={
                    passwordsDiffer ? "hero-confirm-password-hint" : undefined
                  }
                  className={fieldClass}
                />
                {passwordsDiffer ? (
                  <p
                    id="hero-confirm-password-hint"
                    className="-mt-1 px-5 text-sm text-red-400"
                  >
                    Passwords do not match.
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative transform rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  <span className="relative z-10">
                    {isSubmitting ? "Creating account…" : "Create account"}
                  </span>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </button>
              </form>
            )}

            {error ? (
              <div
                id="hero-signup-error"
                role="alert"
                className="text-center text-sm text-red-400"
              >
                <p>
                  {error.message}
                  {error.status === 409 ? (
                    <>
                      {" "}
                      <a
                        href="/login"
                        className="underline underline-offset-4 hover:text-white"
                      >
                        Sign in instead
                      </a>
                    </>
                  ) : null}
                </p>
                {error.details.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-left">
                    {error.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : createdEmail ? null : (
              <p
                id="hero-password-rules"
                className="text-center text-sm text-gray-400"
              >
                Free member account. Your password needs 8+ characters with an
                uppercase letter, a lowercase letter, and a number.
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-400">
              <a
                href="/login"
                className="underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Already have an account? Sign in
              </a>
              {createdEmail ? null : (
                <a
                  href={SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Already a member? Take our community survey
                </a>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="mb-16 flex justify-center gap-6"
      >
        <a
          href="https://join.slack.com/t/promptengineersai/shared_invite/zt-3t4w1meid-10gQHbgoWO~UYPJprH~Cyw"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaSlack className="text-2xl transition-transform group-hover:scale-110" />
          <span>Slack</span>
        </a>
        <a
          href="https://www.meetup.com/plano-prompt-engineers/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaMeetup className="text-2xl transition-transform group-hover:scale-110" />
          <span>Meetup</span>
        </a>
        <a
          href="https://www.linkedin.com/company/prompt-engineers-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <FaLinkedin className="text-2xl transition-transform group-hover:scale-110" />
          <span>LinkedIn</span>
        </a>
      </motion.div>
    </div>
  );
};

export default HeroSection;
