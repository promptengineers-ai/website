import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaHome,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaLink,
  FaFileAlt,
  FaBriefcase,
  FaUserFriends,
  FaUsers,
  FaMeetup,
} from "react-icons/fa";
import { getProfileByUserId } from "@/lib/models/Profile";
import { getUserById } from "@/lib/models/User";

export default async function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const userId = params.id;

  // Validate ID format
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    notFound();
  }

  const profile = await getProfileByUserId(userId);

  if (!profile || !profile.isPublic) {
    notFound();
  }

  const user = await getUserById(userId);

  if (!user) {
    notFound();
  }

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

  return (
    <div className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FaHome className="h-4 w-4" />
            Home
          </Link>
          <span className="text-gray-600">|</span>
          <Link
            href="/members"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            ← Back to Members
          </Link>
        </div>

        {/* Header Card */}
        <div className="overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-xl">
          <div className="px-6 py-8">
            <div className="flex items-center gap-6">
              {profile.avatarUrl && (
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white/20">
                  <Image
                    src={profile.avatarUrl}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                {/* We might not want to show email publicly? Spec says: Avatar, Name, Title, Skills. 
                    I'll hide email for now unless explicitly public. 
                    The mock doesn't show email.
                */}

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
          </div>
        </div>

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
              className="prose prose-sm prose-invert max-w-none text-gray-300 [&_a]:text-blue-400 [&_a]:underline hover:[&_a]:text-blue-300"
              dangerouslySetInnerHTML={{ __html: profile.background }}
            />
          </div>
        )}

        {/* Resume Card - Should we show resume public? Spec says "tells about themselves and their interests". 
            Usually resumes are public on professional profiles.
        */}
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
