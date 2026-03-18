"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiMail, FiArrowLeft } from "react-icons/fi";

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20">
            <FiMail className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-white">
            Check your email
          </h2>
          <p className="mt-4 text-gray-400">
            We sent a magic link to{" "}
            <span className="font-medium text-white">{email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Click the link in your email to sign in. The link expires in 15
            minutes.
          </p>
        </div>

        <div className="rounded-md border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
          <p>
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              try again
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MagicLinkSentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <SentContent />
    </Suspense>
  );
}
