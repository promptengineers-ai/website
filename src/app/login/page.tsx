"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const verified = searchParams.get("verified");
  const reset = searchParams.get("reset");
  const { login } = useAuth();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      setUnverifiedEmail(null);
      await login({ email: data.email, password: data.password });
      const redirectTo = searchParams.get("from") || "/profile";
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const err = error as Record<string, unknown>;
      if (err.unverified) {
        setUnverifiedEmail(err.email as string);
      }
      throw error;
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      if (response.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch {
      setResendStatus("error");
    }
  };

  return (
    <div>
      {registered && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-blue-700 bg-blue-900/50 p-4">
          <p className="text-center text-blue-200">
            Account created! Please check your email to verify before signing
            in.
          </p>
        </div>
      )}
      {verified && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-green-700 bg-green-900/50 p-4">
          <p className="text-center text-green-200">
            Email verified successfully! Please sign in.
          </p>
        </div>
      )}
      {reset && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-green-700 bg-green-900/50 p-4">
          <p className="text-center text-green-200">
            Password reset successfully! Please sign in with your new password.
          </p>
        </div>
      )}
      {unverifiedEmail && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-yellow-700 bg-yellow-900/50 p-4">
          <p className="mb-2 text-center text-yellow-200">
            Your email is not yet verified. Check your inbox for a verification
            link.
          </p>
          <div className="text-center">
            {resendStatus === "sent" ? (
              <p className="text-sm text-green-300">
                Verification email sent! Check your inbox.
              </p>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={resendStatus === "sending"}
                className="text-sm font-medium text-yellow-300 underline hover:text-yellow-200 disabled:opacity-50"
              >
                {resendStatus === "sending"
                  ? "Sending..."
                  : resendStatus === "error"
                    ? "Failed — try again"
                    : "Resend verification email"}
              </button>
            )}
          </div>
        </div>
      )}
      <AuthForm type="login" onSubmit={handleLogin} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
