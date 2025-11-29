"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaHome, FaSearch, FaFilter, FaUsers } from "react-icons/fa";
import MemberCard from "@/components/members/MemberCard";

type Member = {
  _id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  seeking: string | string[];
  background?: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [location, setLocation] = useState("");
  const [seeking, setSeeking] = useState("");

  const fetchMembers = async (pageToFetch: number, reset: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        limit: "20",
      });

      if (location) params.append("location", location);
      if (seeking) params.append("seeking", seeking);

      const response = await fetch(`/api/members?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch members");

      const data = await response.json();

      if (reset) {
        setMembers(data.members);
      } else {
        setMembers((prev) => [...prev, ...data.members]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageToFetch + 1);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMembers(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMembers(1, true);
  };

  const handleLoadMore = () => {
    fetchMembers(page, false);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <FaHome className="h-4 w-4" />
            Home
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-white">Members Directory</h1>
            <p className="mt-1 text-sm text-gray-400">
              Connect with other prompt engineers
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-4 md:flex-row md:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="location"
                className="mb-1 block text-sm font-medium text-gray-300"
              >
                Location (Search Bio)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaSearch className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Under development..."
                  disabled
                  className="block w-full rounded-md border border-gray-700 bg-gray-800 py-3 pl-10 text-gray-500 placeholder-gray-600 opacity-60 cursor-not-allowed sm:text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-500 font-medium">
                  Coming Soon
                </span>
              </div>
            </div>

            <div className="w-full md:w-64">
              <label
                htmlFor="seeking"
                className="mb-1 block text-sm font-medium text-gray-300"
              >
                Looking For
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FaFilter className="h-4 w-4 text-gray-500" />
                </div>
                <select
                  id="seeking"
                  value={seeking}
                  onChange={(e) => setSeeking(e.target.value)}
                  className="block w-full rounded-md border border-gray-700 bg-gray-800 py-3 pl-10 text-white focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Intentions</option>
                  <option value="work">Seeking Work</option>
                  <option value="hiring">Hiring</option>
                  <option value="networking">Networking</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm opacity-50 cursor-not-allowed"
            >
              Search
            </button>
          </form>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map((member) => (
            <MemberCard key={member._id} member={member} />
          ))}
        </div>

        {/* Empty State */}
        {!loading && members.length === 0 && (
          <div className="py-12 text-center">
            <FaUsers className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-300">
              No members found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search filters.
            </p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center rounded-md border border-gray-700 bg-gray-800 px-6 py-3 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More Members"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
