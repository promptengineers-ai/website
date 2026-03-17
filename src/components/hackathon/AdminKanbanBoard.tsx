"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  Hackathon,
  HackathonTeam,
  HackathonTeamSlot,
} from "@/types";

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
}

interface Props {
  hackathon: Hackathon;
  teams: EnrichedTeam[];
  unassignedParticipants: Participant[];
  slug: string;
  onRefresh: () => void;
}

// Draggable card for participants (unassigned and assigned)
function DraggableCard({
  id,
  participant,
  isOverlay,
  sourceTeamId,
  sourceRole,
  compact,
}: {
  id: string;
  participant: Participant;
  isOverlay?: boolean;
  sourceTeamId?: string;
  sourceRole?: string;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "participant", participant, sourceTeamId, sourceRole },
  });

  if (compact) {
    return (
      <div
        ref={isOverlay ? undefined : setNodeRef}
        {...(isOverlay ? {} : { ...listeners, ...attributes })}
        style={isDragging && !isOverlay ? { opacity: 0.3 } : undefined}
        className="cursor-grab truncate text-xs font-medium text-gray-200"
        title={participant.name}
      >
        {participant.name}
      </div>
    );
  }

  const prefAbbrev = participant.rolePreference
    ? ROLE_ABBREV[participant.rolePreference] || participant.rolePreference.slice(0, 2).toUpperCase()
    : null;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : { ...listeners, ...attributes })}
      style={isDragging && !isOverlay ? { opacity: 0.3 } : undefined}
      className={`flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors ${
        isOverlay
          ? "rotate-2 scale-105 border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20"
          : "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50"
      }`}
    >
      {prefAbbrev ? (
        <span
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[9px] font-bold text-blue-400"
          title={`Wants: ${participant.rolePreference}`}
        >
          {prefAbbrev}
        </span>
      ) : (
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-500 text-[9px] text-gray-500">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-gray-200" title={participant.name}>
          {participant.name}
        </div>
        {participant.skillBackground && (
          <div className="truncate text-[10px] text-gray-400">
            {participant.skillBackground}
          </div>
        )}
      </div>
    </div>
  );
}

const ROLE_ABBREV: Record<string, string> = {
  "Product Manager": "PM",
  "UI/UX Designer": "UX",
  "Prompt/AI Engineer": "AI",
  "Backend Engineer": "BE",
  "Frontend Developer": "FE",
  "Flex": "FX",
};

// Droppable slot inside a team column
function DroppableSlot({
  teamId,
  slot,
  index,
  participants,
  onRemove,
}: {
  teamId: string;
  slot: EnrichedSlot;
  index: number;
  participants: Participant[];
  onRemove: (teamId: string, userId: string) => void;
}) {
  const droppableId = `slot-${teamId}-${slot.role}-${index}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { teamId, role: slot.role, index },
    disabled: !!slot.userId,
  });

  if (slot.userId) {
    const assignedParticipant = participants.find(
      (p) => p.userId === slot.userId,
    );
    const abbrev = ROLE_ABBREV[slot.role] || slot.role.slice(0, 2).toUpperCase();
    const displayName = assignedParticipant?.name || slot.userName || "Unknown";

    return (
      <div className="group">
        <div
          ref={undefined}
          className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-2 py-1.5 cursor-grab"
        >
          <span
            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20 text-[9px] font-bold text-green-400"
            title={slot.role}
          >
            {abbrev}
          </span>
          {assignedParticipant ? (
            <div className="min-w-0 flex-1">
              <DraggableCard
                id={`assigned-${teamId}-${slot.userId}-${index}`}
                participant={assignedParticipant}
                sourceTeamId={teamId}
                sourceRole={slot.role}
                compact
              />
            </div>
          ) : (
            <span className="min-w-0 flex-1 truncate text-xs text-gray-300" title={displayName}>
              {displayName}
            </span>
          )}
          <button
            onClick={() => onRemove(teamId, slot.userId!)}
            className="flex-shrink-0 rounded p-0.5 text-gray-600 opacity-0 transition-all hover:bg-red-600/20 hover:text-red-400 group-hover:opacity-100"
            title="Remove from team"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 transition-colors ${
        isOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-600 bg-gray-800/30"
      }`}
    >
      {slot.required ? (
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
      ) : (
        <span className="h-2 w-2 flex-shrink-0 rounded-full border border-gray-500" />
      )}
      <span className="text-xs text-gray-400">
        {isOver ? `Drop to assign as ${slot.role}` : slot.role}
      </span>
    </div>
  );
}

// Sortable + droppable team column
function SortableTeamColumn({
  team,
  hackathon,
  slug,
  allParticipants,
  onRefresh,
  onDeleteTeam,
  onRemoveMember,
}: {
  team: EnrichedTeam;
  hackathon: Hackathon;
  slug: string;
  allParticipants: Participant[];
  onRefresh: () => void;
  onDeleteTeam: (id: string) => void;
  onRemoveMember: (teamId: string, userId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editDesc, setEditDesc] = useState(team.description || "");
  const [saving, setSaving] = useState(false);

  const columnId = `column-${team._id}`;

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnId,
    data: { type: "column", teamId: team._id },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `team-${team._id}`,
    data: { teamId: team._id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const filled = team.slots.filter((s) => s.userId).length;

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/hackathons/${slug}/teams/${team._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
        }),
      });
      if (res.ok) {
        setEditing(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Edit team error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDropRef(node);
      }}
      style={style}
      className={`flex w-[85vw] flex-shrink-0 flex-col rounded-xl border p-4 transition-colors sm:w-72 ${
        isOver
          ? "border-blue-500 bg-blue-500/5"
          : "border-gray-700 bg-gray-900"
      }`}
    >
      {/* Header with drag handle */}
      <div className="mb-3">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description"
              className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-1">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
                className="rounded bg-blue-600 px-2 py-0.5 text-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditName(team.name);
                  setEditDesc(team.description || "");
                }}
                className="rounded bg-gray-700 px-2 py-0.5 text-xs hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            {/* Drag handle area */}
            <div
              className="min-w-0 flex-1 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <h3 className="text-sm font-bold">{team.name}</h3>
              {team.description && (
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {team.description}
                </p>
              )}
            </div>
            <div className="ml-2 flex flex-shrink-0 items-center gap-1">
              <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                {filled}/{team.slots.length}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                title="Edit team"
              >
                <svg
                  className="h-3.5 w-3.5"
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
              </button>
              <button
                onClick={() => onDeleteTeam(team._id)}
                className="rounded p-1 text-gray-500 hover:bg-red-600/20 hover:text-red-400"
                title="Delete team"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slots */}
      <div className="space-y-2">
        {team.slots.map((slot, idx) => (
          <DroppableSlot
            key={`${slot.role}-${idx}`}
            teamId={team._id}
            slot={slot}
            index={idx}
            participants={allParticipants}
            onRemove={onRemoveMember}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminKanbanBoard({
  hackathon,
  teams,
  unassignedParticipants,
  slug,
  onRefresh,
}: Props) {
  const [activeDragData, setActiveDragData] = useState<{
    type: "participant" | "column";
    participant?: Participant;
    sourceTeamId?: string;
    sourceRole?: string;
    teamId?: string;
    teamName?: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [teamOrder, setTeamOrder] = useState<string[]>(
    teams.map((t) => t._id),
  );

  // Keep teamOrder in sync when teams change
  const orderedTeams = teamOrder
    .map((id) => teams.find((t) => t._id === id))
    .filter(Boolean) as EnrichedTeam[];
  // Add any teams not in the order (newly created)
  const missingTeams = teams.filter((t) => !teamOrder.includes(t._id));
  const allOrderedTeams = [...orderedTeams, ...missingTeams];

  // All participants for lookups
  const assignedParticipants: Participant[] = teams.flatMap((t) =>
    t.slots
      .filter((s) => s.userId)
      .map((s) => ({
        userId: s.userId!,
        name: s.userName || "Unknown",
        involvement: "participant",
        skillBackground: null,
        aiExperience: null,
      })),
  );
  const allParticipants = [
    ...unassignedParticipants,
    ...assignedParticipants.filter(
      (a) => !unassignedParticipants.some((u) => u.userId === a.userId),
    ),
  ];

  const { setNodeRef: setUnassignedRef, isOver: isOverUnassigned } =
    useDroppable({
      id: "unassigned-zone",
      data: { zone: "unassigned" },
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
  );

  const updateTeamSlots = async (
    teamId: string,
    newSlots: EnrichedSlot[],
  ) => {
    const res = await fetch(`/api/hackathons/${slug}/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots: newSlots.map((s) => ({
          role: s.role,
          userId: s.userId || undefined,
          required: s.required,
        })),
      }),
    });
    return res.ok;
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    setProcessing(true);
    try {
      const team = teams.find((t) => t._id === teamId);
      if (!team) return;
      const newSlots = team.slots.map((s) =>
        s.userId === userId
          ? { ...s, userId: undefined, userName: null }
          : s,
      );
      const ok = await updateTeamSlots(teamId, newSlots);
      if (ok) onRefresh();
    } finally {
      setProcessing(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as Record<string, unknown>;

    if (data?.type === "column") {
      const team = teams.find((t) => t._id === data.teamId);
      setActiveDragData({
        type: "column",
        teamId: data.teamId as string,
        teamName: team?.name,
      });
    } else {
      setActiveDragData({
        type: "participant",
        participant: data.participant as Participant,
        sourceTeamId: data.sourceTeamId as string | undefined,
        sourceRole: data.sourceRole as string | undefined,
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const dragData = activeDragData;
    setActiveDragData(null);

    const { over, active } = event;
    if (!over || processing || !dragData) return;

    // Handle column reorder
    if (dragData.type === "column") {
      const activeId = active.id.toString().replace("column-", "");
      const overId = over.id.toString().replace("column-", "");

      if (activeId !== overId) {
        const oldIndex = allOrderedTeams.findIndex((t) => t._id === activeId);
        const overTeamIndex = allOrderedTeams.findIndex(
          (t) => t._id === overId,
        );

        if (oldIndex !== -1 && overTeamIndex !== -1) {
          const newOrder = arrayMove(
            allOrderedTeams.map((t) => t._id),
            oldIndex,
            overTeamIndex,
          );
          setTeamOrder(newOrder);

          // Persist to DB
          fetch(`/api/hackathons/${slug}/teams/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamIds: newOrder }),
          }).catch(console.error);
        }
      }
      return;
    }

    // Handle participant drag
    const { participant, sourceTeamId } = dragData;
    if (!participant) return;

    const overData = over.data.current as {
      teamId?: string;
      role?: string;
      zone?: string;
    };

    // Dropped on unassigned zone
    if (overData?.zone === "unassigned" || over.id === "unassigned-zone") {
      if (sourceTeamId) {
        await handleRemoveMember(sourceTeamId, participant.userId);
      }
      return;
    }

    // Determine target team and role
    let targetTeamId: string | undefined;
    let targetRole: string | undefined;

    if (overData?.role) {
      targetTeamId = overData.teamId;
      targetRole = overData.role;
    } else if (over.id.toString().startsWith("team-")) {
      targetTeamId = over.id.toString().replace("team-", "");
      const team = teams.find((t) => t._id === targetTeamId);
      const openSlot = team?.slots.find((s) => !s.userId);
      if (!openSlot) return;
      targetRole = openSlot.role;
    }

    if (!targetTeamId || !targetRole) return;

    // Same team, same role — no-op
    if (sourceTeamId === targetTeamId && dragData.sourceRole === targetRole) return;

    setProcessing(true);
    try {
      if (sourceTeamId === targetTeamId) {
        // Moving within the same team (role swap)
        const team = teams.find((t) => t._id === sourceTeamId);
        if (team) {
          let removed = false;
          let assigned = false;
          const newSlots = team.slots.map((s) => {
            // Remove from old slot
            if (s.userId === participant.userId && !removed) {
              removed = true;
              return { ...s, userId: undefined, userName: null };
            }
            // Assign to new slot
            if (s.role === targetRole && !s.userId && !assigned) {
              assigned = true;
              return { ...s, userId: participant.userId, userName: participant.name };
            }
            return s;
          });
          await updateTeamSlots(sourceTeamId, newSlots);
        }
      } else {
        // Moving between teams
        // Remove from source team
        if (sourceTeamId) {
          const sourceTeam = teams.find((t) => t._id === sourceTeamId);
          if (sourceTeam) {
            const sourceSlots = sourceTeam.slots.map((s) =>
              s.userId === participant.userId
                ? { ...s, userId: undefined, userName: null }
                : s,
            );
            await updateTeamSlots(sourceTeamId, sourceSlots);
          }
        }

        // Assign to target team
        const targetTeam = teams.find((t) => t._id === targetTeamId);
        if (targetTeam) {
          let filled = false;
          const targetSlots = targetTeam.slots.map((s) => {
            if (s.role === targetRole && !s.userId && !filled) {
              filled = true;
              return {
                ...s,
                userId: participant.userId,
                userName: participant.name,
              };
            }
            return s;
          });
          await updateTeamSlots(targetTeamId, targetSlots);
        }
      }

      onRefresh();
    } catch (error) {
      console.error("Move error:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Delete this team? Members will become unassigned.")) return;
    try {
      const res = await fetch(`/api/hackathons/${slug}/teams/${teamId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTeamOrder((prev) => prev.filter((id) => id !== teamId));
        onRefresh();
      }
    } catch (error) {
      console.error("Delete team error:", error);
    }
  };

  const columnIds = allOrderedTeams.map((t) => `column-${t._id}`);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-4 sm:gap-4">
        {/* Unassigned Column (fixed, not sortable) */}
        <div
          ref={setUnassignedRef}
          className={`flex w-[85vw] flex-shrink-0 flex-col rounded-xl border p-4 transition-colors sm:w-64 ${
            isOverUnassigned
              ? "border-yellow-500 bg-yellow-500/5"
              : "border-gray-700 bg-gray-900"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold">
              Unassigned{" "}
              <span className="font-normal text-gray-400">
                ({unassignedParticipants.length})
              </span>
            </h3>
            {unassignedParticipants.length > 0 && (
              <button
                onClick={async () => {
                  if (processing) return;
                  if (
                    !confirm(
                      `Auto-assign ${unassignedParticipants.length} participants to teams based on their role preferences?`,
                    )
                  )
                    return;
                  setProcessing(true);
                  try {
                    const res = await fetch(
                      `/api/hackathons/${slug}/teams/auto-assign`,
                      { method: "POST" },
                    );
                    const data = await res.json();
                    if (res.ok) {
                      alert(
                        `${data.assigned} assigned${data.teamsCreated ? `, ${data.teamsCreated} new team(s) created` : ""}`,
                      );
                      onRefresh();
                    } else {
                      alert(data.error || "Auto-assign failed");
                    }
                  } catch {
                    alert("Something went wrong");
                  } finally {
                    setProcessing(false);
                  }
                }}
                disabled={processing}
                className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium transition-colors hover:bg-green-700 disabled:opacity-50"
                title="Auto-assign all unassigned participants to teams based on their role preferences"
              >
                &#9889; Auto
              </button>
            )}
          </div>
          {isOverUnassigned && activeDragData?.sourceTeamId && (
            <div className="mb-2 rounded-lg border border-dashed border-yellow-500 bg-yellow-500/10 px-3 py-2 text-center text-xs text-yellow-400">
              Drop to unassign
            </div>
          )}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {unassignedParticipants.map((p) => (
              <DraggableCard
                key={p.userId}
                id={`participant-${p.userId}`}
                participant={p}
              />
            ))}
            {unassignedParticipants.length === 0 && !isOverUnassigned && (
              <div className="py-4 text-center text-xs text-gray-500">
                All participants assigned
              </div>
            )}
          </div>
        </div>

        {/* Sortable Team Columns */}
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {allOrderedTeams.map((team) => (
            <SortableTeamColumn
              key={team._id}
              team={team}
              hackathon={hackathon}
              slug={slug}
              allParticipants={allParticipants}
              onRefresh={onRefresh}
              onDeleteTeam={handleDeleteTeam}
              onRemoveMember={handleRemoveMember}
            />
          ))}
        </SortableContext>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragData?.type === "participant" && activeDragData.participant && (
          <DraggableCard
            id="overlay"
            participant={activeDragData.participant}
            isOverlay
          />
        )}
        {activeDragData?.type === "column" && (
          <div className="w-72 rounded-xl border border-blue-500 bg-gray-900/90 p-4 shadow-xl shadow-blue-500/20">
            <h3 className="text-sm font-bold">{activeDragData.teamName}</h3>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
