"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaHome } from "react-icons/fa";
import ProfileForm from "@/components/profile/ProfileForm";
import ResumeUpload from "@/components/profile/ResumeUpload";
import type { UserProfile } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

export default function EditProfilePage() {
  const { status } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

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
      console.error("Error fetching profile:", err);
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

  const handleSubmit = async (data: {
    links: {
      linkedin?: string;
      github?: string;
      twitter?: string;
      portfolio?: string;
      meetup?: string;
      other?: string;
    };
    background: string;
    seeking: string[];
    isPublic: boolean;
    avatarFile: File | null;
  }) => {
    // Extract avatarFile to handle separately
    const { avatarFile, ...profileData } = data;

    // Save profile data
    const response = await fetch("/api/users/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save profile");
    }

    // Upload avatar if file selected
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const uploadResponse = await fetch("/api/avatars/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "Failed to upload avatar");
      }
    }

    // Upload resume if file selected
    if (resumeFile) {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const uploadResponse = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.error || "Failed to upload resume");
      }
    }

    router.push("/profile");
  };

  const handleFileSelect = (file: File | null) => {
    setResumeFile(file);
  };

  const handleResumeDelete = async () => {
    if (!profile?.resumeId) return;

    if (!confirm("Are you sure you want to delete your resume?")) {
      return;
    }

    try {
      const response = await fetch(`/api/resumes/${profile.resumeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setProfile((prev) => (prev ? { ...prev, resumeId: undefined } : null));
    } catch (err) {
      console.error("Failed to delete resume:", err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FaHome className="h-4 w-4" />
            Home
          </Link>
          <span className="text-gray-600">|</span>
          <Link
            href="/profile"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Profile
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {profile ? "Edit Profile" : "Create Profile"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-400">
            Update your professional information and links
          </p>
        </div>

        <ProfileForm profile={profile || undefined} onSubmit={handleSubmit} />

        <div className="mt-6 border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-white">
                Resume
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Upload your resume (PDF, DOC, or DOCX)
              </p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <ResumeUpload
                resumeId={profile?.resumeId}
                onFileSelect={handleFileSelect}
                onDelete={handleResumeDelete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
