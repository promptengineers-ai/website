'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaLinkedin, FaGithub, FaTwitter, FaGlobe, FaLink, FaFileAlt, FaBriefcase, FaUserFriends, FaUsers, FaHome } from 'react-icons/fa';
import type { UserProfile } from '@/types';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <FaLinkedin className="w-5 h-5" />;
      case 'github':
        return <FaGithub className="w-5 h-5" />;
      case 'twitter':
        return <FaTwitter className="w-5 h-5" />;
      case 'portfolio':
        return <FaGlobe className="w-5 h-5" />;
      default:
        return <FaLink className="w-5 h-5" />;
    }
  };

  const getSeekingIcon = (seeking: string) => {
    switch (seeking) {
      case 'work':
        return <FaBriefcase className="w-4 h-4" />;
      case 'hiring':
        return <FaUsers className="w-4 h-4" />;
      case 'networking':
        return <FaUserFriends className="w-4 h-4" />;
      default:
        return <FaLink className="w-4 h-4" />;
    }
  };

  const getSeekingLabel = (seeking: string) => {
    switch (seeking) {
      case 'work':
        return 'Seeking Work';
      case 'hiring':
        return 'Hiring';
      case 'networking':
        return 'Networking';
      default:
        return seeking.charAt(0).toUpperCase() + seeking.slice(1);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');

      if (response.status === 404) {
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Navigation */}
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <FaHome className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="bg-gray-900 border border-gray-800 shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Welcome to Prompt Engineers AI!
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-400">
                <p>You haven&apos;t created your profile yet. Create one to get started.</p>
              </div>
              <div className="mt-5">
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-black"
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
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <FaHome className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white">{session?.user?.name}</h1>
                <p className="mt-2 text-blue-100">{session?.user?.email}</p>
                {/* Career Intentions Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Array.isArray(profile.seeking) ? profile.seeking : [profile.seeking]).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm"
                    >
                      {getSeekingIcon(s)}
                      {getSeekingLabel(s)}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-4 py-2 border border-white/30 shadow-sm text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Social Links Card */}
        {(profile.links.linkedin || profile.links.github || profile.links.twitter || profile.links.portfolio || profile.links.other) && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Connect With Me</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.links.linkedin && (
                <a
                  href={profile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 transition-all group"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon('linkedin')}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">LinkedIn</span>
                </a>
              )}
              {profile.links.github && (
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 transition-all group"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon('github')}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">GitHub</span>
                </a>
              )}
              {profile.links.twitter && (
                <a
                  href={profile.links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 transition-all group"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon('twitter')}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">Twitter</span>
                </a>
              )}
              {profile.links.portfolio && (
                <a
                  href={profile.links.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 transition-all group"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon('portfolio')}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">Portfolio</span>
                </a>
              )}
              {profile.links.other && (
                <a
                  href={profile.links.other}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 transition-all group"
                >
                  <div className="text-blue-400 group-hover:text-blue-300">
                    {getSocialIcon('other')}
                  </div>
                  <span className="text-gray-300 group-hover:text-white">Other Link</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Background Card */}
        {profile.background && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">About Me</h2>
            <div
              className="prose prose-sm prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: profile.background }}
            />
          </div>
        )}

        {/* Resume Card */}
        {profile.resumeId && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Resume</h2>
            <a
              href={`/api/resumes/${profile.resumeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              <FaFileAlt className="w-4 h-4" />
              View Resume
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
