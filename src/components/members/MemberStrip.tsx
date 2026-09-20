"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { chapterLabel } from "@/config/chapters";

const STRIP_SIZE = 8;

type StripMember = {
  _id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  chapters?: string[];
  background?: string;
};

export default function MemberStrip() {
  const [members, setMembers] = useState<StripMember[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(
          `/api/members?random=true&limit=${STRIP_SIZE}`,
        );
        if (!response.ok) throw new Error("Failed to fetch members");
        const data = (await response.json()) as { members?: StripMember[] };
        if (!cancelled) setMembers(data.members ?? []);
      } catch (error) {
        console.error("Error loading member strip:", error);
        if (!cancelled) setMembers([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (members.length === 0) return null;

  return (
    <section
      aria-labelledby="member-strip-heading"
      className="bg-black px-4 py-16 text-white sm:px-6 lg:px-8"
    >
      <div className="container mx-auto">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2
              id="member-strip-heading"
              className="text-2xl font-bold sm:text-3xl"
            >
              Meet the community
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Builders and learners across every chapter.
            </p>
          </div>
          <Link
            href="/members"
            className="shrink-0 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
          >
            See all members &rarr;
          </Link>
        </div>

        <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {members.map((member) => (
            <li key={member._id} className="w-56 shrink-0 snap-start">
              <Link
                href={`/members/${member.userId}`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 transition-colors hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-gray-700 bg-gray-800">
                    {member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-500">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="truncate font-semibold group-hover:text-blue-400">
                    {member.name}
                  </span>
                </div>
                {member.chapters && member.chapters.length > 0 && (
                  <p className="truncate text-xs text-gray-400">
                    {member.chapters.map(chapterLabel).join(" · ")}
                  </p>
                )}
                {member.background && (
                  <p className="line-clamp-2 text-sm text-gray-300">
                    {member.background}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
