"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";

type AuthFormProps = {
  type: "login" | "signup";
  onSubmit: (data: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<void>;
};

export default function AuthForm({ type, onSubmit }: AuthFormProps) {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const fromQuery = fromParam ? `?from=${encodeURIComponent(fromParam)}` : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password confirmation for signup
    if (type === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        email,
        password,
        name: type === "signup" ? name : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <div className="text-6xl">🤖</div>
        </div>

        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {type === "login"
              ? "Sign in to your account"
              : "Create your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {type === "login" ? (
              <>
                Or{" "}
                <Link
                  href={`/signup${fromQuery}`}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  create a new account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href={`/login${fromQuery}`}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {type === "signup" && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="relative block w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-3 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            )}
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
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  type === "login" ? "current-password" : "new-password"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-3 pr-10 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5" />
                ) : (
                  <FiEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {type === "signup" && (
              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full appearance-none rounded-md border border-gray-700 bg-gray-900 px-3 py-3 pr-10 text-white placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            )}
          </div>

          {type === "signup" && (
            <div className="rounded-md border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
              <p className="mb-2 font-medium text-white">
                Password must contain:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          )}

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
              {loading
                ? "Processing..."
                : type === "login"
                  ? "Sign in"
                  : "Sign up"}
            </button>
          </div>

          {type === "login" && (
            <div className="text-center text-sm">
              <p className="text-gray-400">
                Forgot your password?{" "}
                <a
                  href="https://www.linkedin.com/company/prompt-engineers-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  Contact us on LinkedIn
                </a>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
