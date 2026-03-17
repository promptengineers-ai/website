"use client";

import { useState } from "react";
import {
  ROLE_DESCRIPTIONS,
  type Hackathon,
  type HackathonTeam,
  type HackathonTeamSlot,
  type HackathonRole,
} from "@/types";

type EnrichedSlot = HackathonTeamSlot & { userName?: string | null };
type EnrichedTeam = Omit<HackathonTeam, "slots"> & { slots: EnrichedSlot[] };

interface Props {
  teams: EnrichedTeam[];
  hackathon: Hackathon;
  isRegistered: boolean;
  currentUserId?: string;
  onRefresh: () => void;
  slug: string;
}

export default function TeamCardGrid({
  teams,
  hackathon,
  isRegistered,
  currentUserId,
  onRefresh,
  slug,
}: Props) {
  const [joiningSlot, setJoiningSlot] = useState<{
    teamId: string;
    role: string;
  } | null>(null);
  const [leavingTeam, setLeavingTeam] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const currentTeam = currentUserId
    ? teams.find((t) =>
        t.slots.some((s) => s.userId && s.userId === currentUserId),
      )
    : undefined;

  const filteredTeams = filter
    ? teams.filter((t) =>
        t.slots.some((s) => s.role === filter && !s.userId),
      )
    : teams;

  const handleJoin = async (teamId: string, role: HackathonRole) => {
    setJoiningSlot({ teamId, role });
    try {
      const res = await fetch(
        `/api/hackathons/${slug}/teams/${teamId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to join team");
        return;
      }

      onRefresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setJoiningSlot(null);
    }
  };

  const handleLeave = async (teamId: string) => {
    setLeavingTeam(teamId);
    try {
      const res = await fetch(
        `/api/hackathons/${slug}/teams/${teamId}/leave`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to leave team");
        return;
      }

      onRefresh();
    } catch {
      alert("Something went wrong");
    } finally {
      setLeavingTeam(null);
    }
  };

  const filledCount = (team: EnrichedTeam) =>
    team.slots.filter((s) => s.userId).length;

  return (
    <div>
      {/* Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            !filter
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          All Teams
        </button>
        {hackathon.roles.map((role) => (
          <button
            key={role}
            onClick={() => setFilter(filter === role ? "" : role)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              filter === role
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Needs {role}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => {
          const isMyTeam = currentTeam?._id === team._id;
          const filled = filledCount(team);
          const total = team.slots.length;

          return (
            <div
              key={team._id}
              className={`relative rounded-xl border p-6 transition-all ${
                isMyTeam
                  ? "border-emerald-500/40 bg-gradient-to-br from-blue-900/30 to-purple-900/30"
                  : "border-gray-700 bg-gray-900 hover:border-gray-600"
              }`}
            >
              {/* Glow border for user's team */}
              {isMyTeam && (
                <span className="pointer-events-none absolute -inset-[2px] rounded-xl shadow-[0_0_25px_6px_rgba(16,185,129,0.25),0_0_50px_12px_rgba(16,185,129,0.1)] animate-pulse" />
              )}
              {/* Header */}
              <div className="relative mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{team.name}</h3>
                  {team.description && (
                    <p className="mt-1 text-sm text-gray-400">
                      {team.description}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filled === total
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {filled}/{total}
                </span>
              </div>

              {/* Slots */}
              <div className="relative space-y-2">
                {team.slots.map((slot, idx) => {
                  const isMe = !!(currentUserId && slot.userId && slot.userId === currentUserId);
                  const isOpen = !slot.userId;
                  const isRequired = slot.required;
                  const isJoining =
                    joiningSlot?.teamId === team._id &&
                    joiningSlot?.role === slot.role;

                  return (
                    <div
                      key={`${slot.role}-${idx}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        isMe
                          ? "bg-blue-500/15 border border-blue-500/30"
                          : isOpen
                            ? "bg-gray-800/50 border border-dashed border-gray-600"
                            : "bg-gray-800 border border-gray-700"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {/* Status indicator */}
                        {!isOpen ? (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                        ) : isRequired ? (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                        ) : (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full border border-gray-500" />
                        )}

                        <span
                          className="flex-shrink-0 text-sm font-medium text-gray-300"
                          title={ROLE_DESCRIPTIONS[slot.role] || slot.role}
                        >
                          {slot.role}
                        </span>

                        {!isOpen && (
                          <span className="truncate text-sm text-gray-400" title={isMe ? "You" : (slot.userName || "")}>
                            &mdash; {isMe ? "You" : slot.userName}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {isOpen &&
                        isRegistered &&
                        !currentTeam &&
                        !isJoining && (
                          <button
                            onClick={() =>
                              handleJoin(team._id, slot.role as HackathonRole)
                            }
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium transition-colors hover:bg-blue-700"
                          >
                            Join
                          </button>
                        )}

                      {isJoining && (
                        <span className="text-xs text-gray-400">
                          Joining...
                        </span>
                      )}

                      {isMe && (
                        <button
                          onClick={() => handleLeave(team._id)}
                          disabled={leavingTeam === team._id}
                          className="rounded bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
                        >
                          {leavingTeam === team._id ? "Leaving..." : "Leave"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* My team indicator */}
              {isMyTeam && (
                <div className="relative mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Your Team
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="rounded-lg border border-gray-800 p-8 text-center text-gray-400">
          No teams match this filter.
        </div>
      )}
    </div>
  );
}
