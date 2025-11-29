"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaLink,
  FaFileAlt,
  FaBriefcase,
  FaUserFriends,
  FaUsers,
  FaHome,
  FaMeetup,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import Image from "next/image";
import QRCode from "react-qr-code";
import type { UserProfile } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProfilePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return <FaLinkedin className="h-5 w-5" />;
      case "github":
        return <FaGithub className="h-5 w-5" />;
      case "twitter":
        return <FaTwitter className="h-5 w-5" />;
      case "portfolio":
        return <FaGlobe className="h-5 w-5" />;
      case "meetup":
        return <FaMeetup className="h-5 w-5" />;
      default:
        return <FaLink className="h-5 w-5" />;
    }
  };

  const getSeekingIcon = (seeking: string) => {
    switch (seeking) {
      case "work":
        return <FaBriefcase className="h-4 w-4" />;
      case "hiring":
        return <FaUsers className="h-4 w-4" />;
      case "networking":
        return <FaUserFriends className="h-4 w-4" />;
      default:
        return <FaLink className="h-4 w-4" />;
    }
  };

  const getSeekingLabel = (seeking: string) => {
    switch (seeking) {
      case "work":
        return "Seeking Work";
      case "hiring":
        return "Hiring";
      case "networking":
        return "Networking";
      default:
        return seeking.charAt(0).toUpperCase() + seeking.slice(1);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/users/profile");

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 404) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    fetchProfile();
  }, [status, router, fetchProfile]);

  useEffect(() => {
    if (typeof window !== "undefined" && profile?.userId) {
      setPublicUrl(`${window.location.origin}/members/${profile.userId}`);
    }
  }, [profile?.userId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Unable to load profile
          </h2>
          <p className="mb-4 text-gray-300">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              fetchProfile();
            }}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <FaHome className="h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="border border-gray-800 bg-gray-900 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-white">
                Welcome to Prompt Engineers AI!
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-400">
                <p>
                  You haven&apos;t created your profile yet. Create one to get
                  started.
                </p>
              </div>
              <div className="mt-5">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
                >
                  Create Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation */}
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FaHome className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header Card */}
        <div className="overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl">
          <div className="px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {profile.avatarUrl && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white/20">
                    <Image
                      src={profile.avatarUrl}
                      alt={user?.name || "Avatar"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                  <p className="mt-2 text-blue-100">{user?.email}</p>
                  {/* Career Intentions Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Array.isArray(profile.seeking)
                      ? profile.seeking
                      : [profile.seeking]
                    ).map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                      >
                        {getSeekingIcon(s)}
                        {getSeekingLabel(s)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex items-center rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Public Profile & QR Code */}
        {profile.isPublic && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Public Profile
            </h2>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="rounded-lg bg-white p-4 w-full max-w-[320px] sm:max-w-[200px] flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-[128px]">
                  <QRCode
                    value={publicUrl}
                    size={280}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 280 280`}
                  />
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <p className="text-gray-300">
                  Your profile is public! Share this QR code or link with others.
                </p>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Public Link
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 text-sm text-blue-400 hover:text-blue-300 truncate"
                    >
                      {publicUrl.replace(/^https?:\/\//, "")}
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex-shrink-0 rounded-md bg-gray-700 p-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                      title="Copy link"
                    >
                      {copied ? (
                        <FaCheck className="h-4 w-4 text-green-400" />
                      ) : (
                        <FaCopy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Links Card */}
        {(profile.links.linkedin ||
          profile.links.github ||
          profile.links.twitter ||
          profile.links.portfolio ||
          profile.links.meetup ||
          profile.links.other) && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">
              Connect With Me
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.links.linkedin && (
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("linkedin")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    LinkedIn
                  </span>
                </a>
              )}
              {profile.links.github && (
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("github")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    GitHub
                  </span>
                </a>
              )}
              {profile.links.twitter && (
                <a
                  href={profile.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("twitter")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    Twitter
                  </span>
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={profile.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("portfolio")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    Portfolio
                  </span>
                </a>
              )}
              {profile.links.meetup && (
                <a
                  href={profile.links.meetup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("meetup")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    Meetup
                  </span>
                </a>
              )}
              {profile.links.other && (
                <a
                  href={profile.links.other}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 transition-all hover:border-blue-500 hover:bg-gray-700"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon("other")}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">
                    Other Link
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Background Card */}
        {profile.background && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">About Me</h2>
            <div
              className="prose prose-sm prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: profile.background }}
            />
          </div>
        )}

        {/* Resume Card */}
        {profile.resumeId && (
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-white">Resume</h2>
            <a
              href={`/api/resumes/${profile.resumeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              <FaFileAlt className="h-4 w-4" />
              View Resume
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
