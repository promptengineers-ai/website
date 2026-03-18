"use client";

import { Suspense, useState, FormEvent } from "react";
import Link from "next/link";
import { FiArrowLeft, FiMail } from "react-icons/fi";

type Status = "idle" | "loading" | "sent" | "error";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("sent");
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("An error occurred. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <div className="flex justify-center">
          <div className="text-6xl">🤖</div>
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {status === "sent" ? (
          <div className="space-y-6 text-center">
            <FiMail className="mx-auto h-12 w-12 text-blue-400" />
            <p className="text-gray-300">
              If an account with that email exists, a password reset link has
              been sent. Check your inbox.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-700 bg-red-900/50 p-4">
                <div className="text-sm text-red-200">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
