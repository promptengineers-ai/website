"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail } from "react-icons/fi";

export default function MagicLinkForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/magic-link/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send magic link");
      }

      router.push(`/auth/magic-link/sent?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pt-8">
      <div>
        <p className="text-center text-sm text-gray-400">
          We&apos;ll send you a magic link to sign in — no password needed.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="magic-email" className="sr-only">
            Email address
          </label>
          <input
            id="magic-email"
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

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiMail className="mr-2 h-5 w-5" />
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </div>

        <div className="text-center text-sm">
          <p className="text-gray-400">
            New here? Just enter your email above — we&apos;ll create your
            account automatically.
          </p>
        </div>
      </form>
    </div>
  );
}
