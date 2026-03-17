"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  rolePreference?: string;
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
  const [activeTab, setActiveTabState] = useState<"kanban" | "participants">(() => {
    if (typeof window !== "undefined" && window.location.hash === "#participants") {
      return "participants";
    }
    return "kanban";
  });
  const setActiveTab = (tab: "kanban" | "participants") => {
    setActiveTabState(tab);
    window.location.hash = tab === "kanban" ? "" : tab;
  };
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const fetchData = async () => {
    try {
      const t = Date.now();
      const [hackRes, teamsRes, participantsRes] = await Promise.all([
        fetch(`/api/hackathons/${slug}?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/hackathons/${slug}/teams?_t=${t}`, { cache: "no-store" }),
        fetch(`/api/hackathons/${slug}/participants?_t=${t}`, { cache: "no-store" }),
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
  };

  // Check admin status
  useEffect(() => {
    if (status === "authenticated" && user) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then(async () => {
          const res = await fetch(`/api/hackathons/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          // If PATCH succeeds or returns non-403, user is admin
          setIsAdmin(res.status !== 403);
          if (res.status === 403) {
            router.push(`/hackathon/${slug}`);
          }
        });
    } else if (status === "unauthenticated") {
      router.push(`/login?from=/hackathon/${slug}/admin`);
    }
  }, [status, user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, slug]);

  if (loading || !isAdmin) return <Loading />;
  if (!hackathon) return <Loading />;

  // Find participants not assigned to any team
  const assignedUserIds = new Set(
    teams.flatMap((t) => t.slots.filter((s) => s.userId).map((s) => s.userId!)),
  );
  const unassignedParticipants = participants.filter(
    (p) => !assignedUserIds.has(p.userId),
  );

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <TopNavBar />

      <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 pt-20 sm:px-4 sm:pt-24">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold sm:text-2xl">{hackathon.name}</h1>
              <p className="text-xs text-gray-400 sm:text-sm">Admin Dashboard</p>
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
              <div className="text-[10px] text-gray-400 sm:text-xs">Registered</div>
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
              <div className="text-[10px] text-gray-400 sm:text-xs">Assigned</div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 sm:px-4 sm:py-3">
              <div className="text-lg font-bold text-yellow-400 sm:text-xl">
                {unassignedParticipants.length}
              </div>
              <div className="text-[10px] text-gray-400 sm:text-xs">Unassigned</div>
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
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700 bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Name
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Background
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Experience
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Role Pref
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Involvement
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {participants.map((p) => (
                    <tr
                      key={p.userId}
                      className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => setEditingParticipant(p)}
                    >
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium" title={p.name}>
                        <span className="flex items-center gap-2">
                          {p.name}
                          <svg className="h-3 w-3 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
                      <td className="px-4 py-3 text-gray-400">
                        {p.rolePreference || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                          p.involvement === "mentor"
                            ? "bg-purple-600/20 text-purple-400"
                            : p.involvement === "volunteer"
                              ? "bg-blue-600/20 text-blue-400"
                              : "bg-gray-600/20 text-gray-400"
                        }`}>
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
              {participants.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  No participants registered yet.
                </div>
              )}
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
