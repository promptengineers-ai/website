"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/loaders/Loading";

export default function HackathonIndexPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function findActiveHackathon() {
      try {
        const res = await fetch("/api/hackathons");
        const data = await res.json();

        if (data.hackathon) {
          router.replace(`/hackathon/${data.hackathon.slug}`);
        } else {
          setError("no-hackathon");
        }
      } catch {
        setError("error");
      }
    }
    findActiveHackathon();
  }, [router]);

  if (error === "no-hackathon") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-4 text-4xl font-bold">No Active Hackathon</h1>
        <p className="mb-8 text-gray-400">
          There are no hackathons currently open for registration.
        </p>
        <a
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    );
  }

  return <Loading />;
}
