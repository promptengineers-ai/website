"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ApiError, apiClient } from "@/utils/client";
import { FaSlack, FaMeetup, FaLinkedin } from "react-icons/fa";
import {
  FALLBACK_MEETUP_STATS,
  formatEventCount,
  formatMemberCount,
  formatRating,
} from "@/lib/meetup";
import type { MeetupStats } from "@/types";

const HeroSection = ({
  stats = FALLBACK_MEETUP_STATS,
}: {
  stats?: MeetupStats;
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
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
    setIsSubmitting(true);
    setError(null);
    setCreatedEmail(null);

    try {
      await apiClient.register({ name, email, password });
      setCreatedEmail(email);
      setResendState("idle");
      setName("");
      setEmail("");
      setPassword("");
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

  const fieldClass =
    "w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-base text-white placeholder-gray-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-black text-white">
      {/* Logo/Icon Area */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-5 flex items-center justify-center"
      >
        <div className="text-7xl">🤖</div>
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
        className="mb-8 max-w-2xl text-center text-xl font-light text-gray-300"
      >
        A community of developers and tech enthusiasts in Plano, TX and St.
        George, UT exploring ChatGPT, LLMs, and the future of AI
      </motion.p>

      {/* Primary CTA - Signup form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mb-12 flex w-full max-w-xl flex-col items-center gap-4 px-4"
      >
        {createdEmail ? (
          <div
            role="status"
            className="flex w-full flex-col items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-5 text-center text-sm text-green-200"
          >
            <p className="text-base font-semibold text-green-300">
              Account created.
            </p>
            <p>
              Check <span className="font-medium">{createdEmail}</span> for a
              verification link. If it does not arrive, you can resend it.
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
            <input
              id="hero-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Password (8+ characters, upper, lower, number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={error?.details.length ? true : undefined}
              className={fieldClass}
            />
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
          <p className="text-center text-sm text-gray-400">
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
          <a
            href="https://forms.gle/DYBEgiiFGUUisw7V6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Already a member? Take our community survey
          </a>
        </div>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="mb-12 flex flex-wrap justify-center gap-8 text-center"
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
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.1 }}
        className="flex justify-center gap-6"
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
