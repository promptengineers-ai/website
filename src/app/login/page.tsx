"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import MagicLinkForm from "@/components/auth/MagicLinkForm";

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  return (
    <>
      {errorParam === "magic-link-expired" && (
        <div className="fixed left-1/2 top-4 z-50 mx-auto max-w-md -translate-x-1/2 transform rounded-md border border-red-700 bg-red-900/50 p-4">
          <p className="text-center text-red-200">
            This magic link has expired or is invalid. Please request a new one.
          </p>
        </div>
      )}

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

          <div className="flex justify-center">
            <div className="text-6xl">&#129302;</div>
          </div>

          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Sign in with magic link
            </h2>
          </div>

          <MagicLinkForm />
        </div>
      </div>
    </>
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
