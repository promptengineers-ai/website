"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import TopNavBar from "@/components/nav/TopNavBar";
import Loading from "@/components/loaders/Loading";
import AdminKanbanBoard from "@/components/hackathon/AdminKanbanBoard";
import CreateTeamModal from "@/components/hackathon/CreateTeamModal";
import HackathonSettingsPanel from "@/components/hackathon/HackathonSettingsPanel";
import EditParticipantModal from "@/components/hackathon/EditParticipantModal";
import type { Hackathon, HackathonTeam, HackathonTeamSlot } from "@/types";

type EnrichedSlot = HackathonTeamSlot & { userName?: string | null };
type EnrichedTeam = Omit<HackathonTeam, "slots"> & { slots: EnrichedSlot[] };

interface Participant {
  userId: string;
  name: string;
  email?: string;
  involvement: string;
  skillBackground?: string | null;
  aiExperience?: string | null;
  avatarUrl?: string | null;
}

export default function HackathonAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status } = useAuth();
  const slug = params.slug as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<EnrichedTeam[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = (
    searchParams.get("tab") === "participants" ? "participants" : "kanban"
  ) as "kanban" | "participants";
  const setActiveTab = (tab: "kanban" | "participants") => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "kanban") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const [editingParticipant, setEditingParticipant] =
    useState<Participant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<
    | "name"
    | "email"
    | "skillBackground"
    | "aiExperience"
    | "involvement"
    | "status"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchData = useCallback(async () => {
    try {
      const t = Date.now();
      const [hackRes, teamsRes, participantsRes] = await Promise.all([
        fetch(`/api/hackathons/${slug}?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/hackathons/${slug}/teams?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/hackathons/${slug}/participants?_t=${t}`, {
          cache: "no-store",
        }),
      ]);

      if (!hackRes.ok) {
        router.push("/hackathon");
        return;
      }

      const hackData = await hackRes.json();
      const teamsData = await teamsRes.json();
      const participantsData = await participantsRes.json();

      setHackathon(hackData.hackathon);
      setTeams(teamsData.teams || []);
      setParticipants(participantsData.participants || []);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // Check admin status
  useEffect(() => {
    if (status === "authenticated" && user) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          const admin = data.user?.isAdmin || false;
          setIsAdmin(admin);
          if (!admin) {
            router.push(`/hackathon/${slug}`);
          }
        })
        .catch(() => {
          router.push(`/login?from=/hackathon/${slug}/admin`);
        });
    } else if (status === "unauthenticated") {
      router.push(`/login?from=/hackathon/${slug}/admin`);
    }
  }, [status, user, slug, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  if (loading || !isAdmin) return <Loading />;
  if (!hackathon) return <Loading />;

  // Find participants not assigned to any team
  const assignedUserIds = new Set(
    teams.flatMap((t) => t.slots.filter((s) => s.userId).map((s) => s.userId!)),
  );
  const unassignedParticipants = participants.filter(
    (p) => !assignedUserIds.has(p.userId),
  );

  // Filter and sort participants for the list view
  const query = searchQuery.toLowerCase();
  const filteredParticipants = participants
    .filter((p) => {
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.skillBackground &&
          p.skillBackground.toLowerCase().includes(query)) ||
        (p.aiExperience && p.aiExperience.toLowerCase().includes(query)) ||
        p.involvement.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      let aVal = "";
      let bVal = "";

      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "email":
          aVal = a.email || "";
          bVal = b.email || "";
          break;
        case "skillBackground":
          aVal = a.skillBackground || "";
          bVal = b.skillBackground || "";
          break;
        case "aiExperience":
          aVal = a.aiExperience || "";
          bVal = b.aiExperience || "";
          break;
        case "involvement":
          aVal = a.involvement;
          bVal = b.involvement;
          break;
        case "status":
          aVal = assignedUserIds.has(a.userId) ? "assigned" : "unassigned";
          bVal = assignedUserIds.has(b.userId) ? "assigned" : "unassigned";
          break;
      }

      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-blue-400">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <TopNavBar />

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 pt-20 sm:px-4 sm:pt-24">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-2xl">
                {hackathon.name}
              </h1>
              <p className="text-xs text-gray-400 sm:text-sm">
                Admin Dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/hackathon/${slug}`}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800 sm:px-4 sm:py-2 sm:text-sm"
              >
                Public Page
              </a>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800 sm:px-4 sm:py-2 sm:text-sm"
              >
                Settings
              </button>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm"
              >
                + Team
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-4 gap-2 sm:flex sm:gap-6">
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-lg font-bold text-blue-400 sm:text-xl">
                {participants.length}
              </div>
              <div className="text-[10px] text-gray-400 sm:text-xs">
                Registered
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-lg font-bold text-purple-400 sm:text-xl">
                {teams.length}
              </div>
              <div className="text-[10px] text-gray-400 sm:text-xs">Teams</div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-lg font-bold text-green-400 sm:text-xl">
                {assignedUserIds.size}
              </div>
              <div className="text-[10px] text-gray-400 sm:text-xs">
                Assigned
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-lg font-bold text-yellow-400 sm:text-xl">
                {unassignedParticipants.length}
              </div>
              <div className="text-[10px] text-gray-400 sm:text-xs">
                Unassigned
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg border border-gray-700 bg-gray-900 p-1">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "kanban"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Team Board
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "participants"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Participants ({participants.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === "kanban" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <AdminKanbanBoard
                hackathon={hackathon}
                teams={teams}
                unassignedParticipants={unassignedParticipants}
                slug={slug}
                onRefresh={fetchData}
              />
            </div>
          )}

          {activeTab === "participants" && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Search bar */}
              <div className="mb-3 flex items-center gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, background..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-gray-500">
                  {filteredParticipants.length} of {participants.length}
                </span>
              </div>

              {/* Table */}
              <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-700 bg-gray-900">
                    <tr>
                      <th
                        onClick={() => handleSort("name")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Name
                        <SortIcon field="name" />
                      </th>
                      <th
                        onClick={() => handleSort("email")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Email
                        <SortIcon field="email" />
                      </th>
                      <th
                        onClick={() => handleSort("skillBackground")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Background
                        <SortIcon field="skillBackground" />
                      </th>
                      <th
                        onClick={() => handleSort("aiExperience")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Experience
                        <SortIcon field="aiExperience" />
                      </th>
                      <th
                        onClick={() => handleSort("involvement")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Involvement
                        <SortIcon field="involvement" />
                      </th>
                      <th
                        onClick={() => handleSort("status")}
                        className="cursor-pointer px-4 py-3 font-medium text-gray-300 hover:text-white"
                      >
                        Status
                        <SortIcon field="status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredParticipants.map((p) => (
                      <tr
                        key={p.userId}
                        className="cursor-pointer transition-colors hover:bg-gray-800/50"
                        onClick={() => setEditingParticipant(p)}
                      >
                        <td
                          className="max-w-[200px] truncate px-4 py-3 font-medium"
                          title={p.name}
                          aria-label={p.name}
                        >
                          <span className="flex items-center gap-2">
                            {p.name}
                            <svg
                              className="h-3 w-3 flex-shrink-0 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{p.email}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {p.skillBackground || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {p.aiExperience || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                              p.involvement === "mentor"
                                ? "bg-purple-600/20 text-purple-400"
                                : p.involvement === "volunteer"
                                  ? "bg-blue-600/20 text-blue-400"
                                  : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            {p.involvement}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {assignedUserIds.has(p.userId) ? (
                            <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
                              Assigned
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">
                              Unassigned
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredParticipants.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    {participants.length === 0
                      ? "No participants registered yet."
                      : "No participants match your search."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateTeam && hackathon && (
        <CreateTeamModal
          hackathon={hackathon}
          slug={slug}
          onClose={() => setShowCreateTeam(false)}
          onCreated={() => {
            setShowCreateTeam(false);
            fetchData();
          }}
        />
      )}

      {showSettings && hackathon && (
        <HackathonSettingsPanel
          hackathon={hackathon}
          slug={slug}
          onClose={() => setShowSettings(false)}
          onUpdated={() => {
            setShowSettings(false);
            fetchData();
          }}
        />
      )}

      {editingParticipant && hackathon && (
        <EditParticipantModal
          participant={editingParticipant}
          hackathonId={hackathon._id}
          slug={slug}
          onClose={() => setEditingParticipant(null)}
          onUpdated={() => {
            setEditingParticipant(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
