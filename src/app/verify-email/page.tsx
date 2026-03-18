"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during verification.");
      }
    }

    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {status === "loading" && (
          <>
            <FiLoader className="mx-auto h-12 w-12 animate-spin text-blue-400" />
            <h2 className="text-2xl font-bold text-white">
              Verifying your email...
            </h2>
          </>
        )}

        {status === "success" && (
          <>
            <FiCheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="text-2xl font-bold text-white">{message}</h2>
            <p className="text-gray-400">
              You can now sign in to your account.
            </p>
            <Link
              href="/login?verified=true"
              className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <FiXCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              Verification failed
            </h2>
            <p className="text-gray-400">{message}</p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <Link
                href="/login"
                className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Go to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
