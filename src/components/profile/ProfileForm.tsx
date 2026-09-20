"use client";

import { FormEvent, useState } from "react";
import type { UserProfile } from "@/types";
import { CHAPTERS } from "@/config/chapters";
import RichTextEditor from "./RichTextEditor";
import AvatarUpload from "./AvatarUpload";

type ProfileFormProps = {
  profile?: UserProfile;
  userName?: string;
  onSubmit: (data: {
    name: string;
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
    chapters: string[];
    isPublic: boolean;
    resumeVisibleToMembers: boolean;
    avatarFile: File | null;
  }) => Promise<void>;
};

export default function ProfileForm({
  profile,
  userName,
  onSubmit,
}: ProfileFormProps) {
  const [name, setName] = useState(userName || "");
  const [linkedin, setLinkedin] = useState(profile?.links?.linkedin || "");
  const [github, setGithub] = useState(profile?.links?.github || "");
  const [twitter, setTwitter] = useState(profile?.links?.twitter || "");
  const [portfolio, setPortfolio] = useState(profile?.links?.portfolio || "");
  const [meetup, setMeetup] = useState(profile?.links?.meetup || "");
  const [other, setOther] = useState(profile?.links?.other || "");
  const [background, setBackground] = useState(profile?.background || "");
  const [seeking, setSeeking] = useState<string[]>(
    Array.isArray(profile?.seeking)
      ? profile.seeking
      : profile?.seeking
        ? [profile.seeking]
        : [],
  );
  const [chapters, setChapters] = useState<string[]>(profile?.chapters || []);
  const [isPublic, setIsPublic] = useState(profile?.isPublic || false);
  const [resumeVisibleToMembers, setResumeVisibleToMembers] = useState(
    profile?.resumeVisibleToMembers === true,
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChapterChange = (slug: string) => {
    setChapters((prev) =>
      prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug],
    );
  };

  const handleSeekingChange = (value: string) => {
    setSeeking((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit({
        name,
        links: {
          linkedin: linkedin || undefined,
          github: github || undefined,
          twitter: twitter || undefined,
          portfolio: portfolio || undefined,
          meetup: meetup || undefined,
          other: other || undefined,
        },
        background,
        seeking,
        chapters,
        isPublic,
        resumeVisibleToMembers,
        avatarFile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Display Name
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Your name as shown to other members
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <input
              type="text"
              id="name"
              name="name"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Your display name"
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Visibility
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Both choices below are off until you turn them on. Each one is
              separate.
            </p>
          </div>
          <div className="mt-5 space-y-6 md:col-span-2 md:mt-0">
            <div className="rounded-md border border-gray-700 bg-gray-800/40 p-4">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    aria-describedby="isPublic-description"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="isPublic"
                    className="font-medium text-gray-300"
                  >
                    List me in the member directory
                  </label>
                  <div
                    id="isPublic-description"
                    className="mt-1 space-y-2 text-gray-400"
                  >
                    <p>
                      Turn this on to be findable by other members and potential
                      collaborators.
                    </p>
                    <p>
                      Anyone who visits the directory, signed in or not, can see
                      your display name, avatar, chapters, career intentions,
                      background, and social links.
                    </p>
                    <p>
                      Your email is shown only to signed-in members. Your resume
                      is not included; sharing it is a separate choice below.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-gray-700 bg-gray-800/40 p-4">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="resumeVisibleToMembers"
                    name="resumeVisibleToMembers"
                    type="checkbox"
                    checked={resumeVisibleToMembers}
                    onChange={(e) =>
                      setResumeVisibleToMembers(e.target.checked)
                    }
                    aria-describedby="resumeVisibleToMembers-description"
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="resumeVisibleToMembers"
                    className="font-medium text-gray-300"
                  >
                    Share my resume with signed-in members
                  </label>
                  <p
                    id="resumeVisibleToMembers-description"
                    className="mt-1 text-gray-400"
                  >
                    Let members who are signed in download your resume from your
                    profile. Leave this off and only you can download it.
                    Uploading a resume does not share it. This is separate from
                    the directory listing and never applies to visitors who are
                    not signed in.
                  </p>
                </div>
              </div>
            </div>

            <AvatarUpload
              avatarUrl={profile?.avatarUrl}
              onFileSelect={setAvatarFile}
            />
          </div>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Social Links
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Add links to your professional profiles
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label
                  htmlFor="linkedin"
                  className="block text-sm font-medium text-gray-300"
                >
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  id="linkedin"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                />
              </div>

              <div className="col-span-6">
                <label
                  htmlFor="github"
                  className="block text-sm font-medium text-gray-300"
                >
                  GitHub
                </label>
                <input
                  type="url"
                  name="github"
                  id="github"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="col-span-6">
                <label
                  htmlFor="twitter"
                  className="block text-sm font-medium text-gray-300"
                >
                  Twitter
                </label>
                <input
                  type="url"
                  name="twitter"
                  id="twitter"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="col-span-6">
                <label
                  htmlFor="portfolio"
                  className="block text-sm font-medium text-gray-300"
                >
                  Portfolio
                </label>
                <input
                  type="url"
                  name="portfolio"
                  id="portfolio"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="col-span-6">
                <label
                  htmlFor="meetup"
                  className="block text-sm font-medium text-gray-300"
                >
                  Meetup
                </label>
                <input
                  type="url"
                  name="meetup"
                  id="meetup"
                  value={meetup}
                  onChange={(e) => setMeetup(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://www.meetup.com/members/1234567890"
                />
              </div>

              <div className="col-span-6">
                <label
                  htmlFor="other"
                  className="block text-sm font-medium text-gray-300"
                >
                  Other Link
                </label>
                <input
                  type="url"
                  name="other"
                  id="other"
                  value={other}
                  onChange={(e) => setOther(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Professional Background
            </h3>
            <p className="mt-1 text-sm text-gray-400">Tell us about yourself</p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="background"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Background
                </label>
                <RichTextEditor
                  value={background}
                  onChange={setBackground}
                  placeholder="Tell us about your experience, skills, and what you're passionate about..."
                  maxLength={5000}
                />
                <p className="mt-2 text-sm text-gray-400">
                  {background.replace(/<[^>]*>/g, "").length} / 5000 characters
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Career Intentions
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              What brings you to our community? (Select all that apply)
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="seeking-work"
                    name="seeking-work"
                    type="checkbox"
                    checked={seeking.includes("work")}
                    onChange={() => handleSeekingChange("work")}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="seeking-work"
                    className="font-medium text-gray-300"
                  >
                    Seeking Work
                  </label>
                  <p className="text-gray-400">Looking for job opportunities</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="seeking-hiring"
                    name="seeking-hiring"
                    type="checkbox"
                    checked={seeking.includes("hiring")}
                    onChange={() => handleSeekingChange("hiring")}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="seeking-hiring"
                    className="font-medium text-gray-300"
                  >
                    Hiring
                  </label>
                  <p className="text-gray-400">Looking to hire talent</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="seeking-networking"
                    name="seeking-networking"
                    type="checkbox"
                    checked={seeking.includes("networking")}
                    onChange={() => handleSeekingChange("networking")}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="seeking-networking"
                    className="font-medium text-gray-300"
                  >
                    Networking
                  </label>
                  <p className="text-gray-400">
                    Building professional connections
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="seeking-other"
                    name="seeking-other"
                    type="checkbox"
                    checked={seeking.includes("other")}
                    onChange={() => handleSeekingChange("other")}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="seeking-other"
                    className="font-medium text-gray-300"
                  >
                    Other
                  </label>
                  <p className="text-gray-400">Other reasons</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900 px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-white">
              Chapters
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Which local chapters do you attend? (Select all that apply)
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0">
            <div className="space-y-4">
              {CHAPTERS.map((chapter) => (
                <div key={chapter.slug} className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id={`chapter-${chapter.slug}`}
                      name={`chapter-${chapter.slug}`}
                      type="checkbox"
                      checked={chapters.includes(chapter.slug)}
                      onChange={() => handleChapterChange(chapter.slug)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor={`chapter-${chapter.slug}`}
                      className="font-medium text-gray-300"
                    >
                      {chapter.city}, {chapter.state}
                    </label>
                    <p className="text-gray-400">
                      {chapter.status === "launching"
                        ? "Launching soon"
                        : "Monthly meetup"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-700 bg-red-900/50 p-4">
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}
