"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaGithub, FaEnvelope, FaArrowLeft, FaPen } from "react-icons/fa";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import TopNavBar from "@/components/nav/TopNavBar";
import Loading from "@/components/loaders/Loading";
import type { EnrichedHackathonTeam } from "@/types";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status } = useAuth();
  const { toast } = useToast();
  const slug = params.slug as string;
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<EnrichedHackathonTeam | null>(null);
  const [hackathonName, setHackathonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");

  const fetchTeam = useCallback(async () => {
    try {
      const t = Date.now();
      const [teamRes, hackRes] = await Promise.all([
        fetch(`/api/hackathons/${slug}/teams/${teamId}?_t=${t}`, {
          cache: "no-store",
        }),
        fetch(`/api/hackathons/${slug}?_t=${t}`, { cache: "no-store" }),
      ]);

      if (!teamRes.ok) {
        setTeam(null);
        setLoading(false);
        return;
      }

      const teamData = await teamRes.json();
      setTeam(teamData.team);
      setEditName(teamData.team.name || "");
      setEditDescription(teamData.team.description || "");
      setEditRepoUrl(teamData.team.repoUrl || "");
      setEditContactEmail(teamData.team.contactEmail || "");

      if (hackRes.ok) {
        const hackData = await hackRes.json();
        setHackathonName(hackData.hackathon?.name || "");
      }
    } catch {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [slug, teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Check admin status
  useEffect(() => {
    if (status === "authenticated" && user) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          setIsAdmin(data.isAdmin || data.user?.isAdmin || false);
        })
        .catch(() => {});
    }
  }, [status, user]);

  const isTeamMember = team?.slots.some(
    (s) => s.userId && s.userId === user?.id,
  );
  const canEdit = isAdmin || isTeamMember;

  const handleSave = async () => {
    if (!team) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hackathons/${slug}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          repoUrl: editRepoUrl,
          contactEmail: editContactEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Failed to update team", "error");
        return;
      }

      toast("Team updated successfully", "success");
      setEditing(false);
      await fetchTeam();
    } catch {
      toast("Failed to update team", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditName(team?.name || "");
    setEditDescription(team?.description || "");
    setEditRepoUrl(team?.repoUrl || "");
    setEditContactEmail(team?.contactEmail || "");
  };

  if (loading) return <Loading />;

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-4 text-4xl font-bold">Team Not Found</h1>
        <button
          onClick={() => router.back()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const filledSlots = team.slots.filter((s) => s.userId);
  const totalSlots = team.slots.length;

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavBar />

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-400">
          <Link
            href={`/hackathon/${slug}`}
            className="transition-colors hover:text-white"
          >
            {hackathonName || "Hackathon"}
          </Link>
          <span>/</span>
          <span className="text-white">{team.name}</span>
        </div>

        {/* Back link */}
        <Link
          href={`/hackathon/${slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <FaArrowLeft className="h-3 w-3" />
          Back to hackathon
        </Link>

        {/* Team Header */}
        <div className="mb-6 mt-4 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {team.description && (
                <p className="mt-2 text-gray-400">{team.description}</p>
              )}
            </div>
            {canEdit && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
                aria-label="Edit team"
              >
                <FaPen className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 text-sm text-gray-400">
            {filledSlots.length}/{totalSlots} members
          </div>
        </div>

        {/* Team Info */}
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Team Info</h2>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="team-name"
                  className="mb-1 block text-sm font-medium text-gray-400"
                >
                  Team Name
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="team-description"
                  className="mb-1 block text-sm font-medium text-gray-400"
                >
                  Description
                </label>
                <textarea
                  id="team-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="What is your team building?"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="repo-url"
                  className="mb-1 block text-sm font-medium text-gray-400"
                >
                  Repository URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={editRepoUrl}
                  onChange={(e) => setEditRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-sm font-medium text-gray-400"
                >
                  Contact Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FaGithub className="h-5 w-5 text-gray-400" />
                {team.repoUrl ? (
                  <a
                    href={team.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                  >
                    {team.repoUrl}
                  </a>
                ) : (
                  <span className="text-gray-500">No repository URL set</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
                {team.contactEmail ? (
                  <a
                    href={`mailto:${team.contactEmail}`}
                    className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                  >
                    {team.contactEmail}
                  </a>
                ) : (
                  <span className="text-gray-500">No contact email set</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Team Members</h2>
          <div className="space-y-3">
            {team.slots.map((slot, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-800/50 p-3"
              >
                {/* Avatar */}
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-700">
                  {slot.userId && slot.avatarUrl ? (
                    <Image
                      src={slot.avatarUrl}
                      alt={slot.userName || "Member"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      {slot.userId
                        ? (slot.userName || "?").charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {slot.userId ? (
                      <>
                        {slot.isPublic ? (
                          <Link
                            href={`/members/${slot.userId}`}
                            className="font-medium text-white hover:text-blue-400"
                          >
                            {slot.userName}
                          </Link>
                        ) : (
                          <span className="font-medium text-white">
                            {slot.userName}
                          </span>
                        )}
                        {slot.email && (
                          <a
                            href={`mailto:${slot.email}`}
                            className="text-gray-400 hover:text-blue-400"
                            title={slot.email}
                          >
                            <FaEnvelope className="h-3 w-3" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">Open</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{slot.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
