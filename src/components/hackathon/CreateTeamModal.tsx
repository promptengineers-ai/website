"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { Hackathon, HackathonRole } from "@/types";

interface Props {
  hackathon: Hackathon;
  slug: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTeamModal({
  hackathon,
  slug,
  onClose,
  onCreated,
}: Props) {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single mode state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<
    { role: HackathonRole; required: boolean }[]
  >(() => {
    const base = hackathon.roles.map((role) => ({
      role,
      required: hackathon.requiredRoles.includes(role),
    }));
    const extra = Math.max(0, hackathon.maxTeamSize - base.length);
    return [
      ...base,
      ...Array.from({ length: extra }, () => ({
        role: "Flex" as HackathonRole,
        required: false,
      })),
    ].slice(0, hackathon.maxTeamSize);
  });

  // Bulk mode state
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkPrefix, setBulkPrefix] = useState("Team");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (role: HackathonRole) => {
    const exists = selectedRoles.find((r) => r.role === role);
    if (exists) {
      setSelectedRoles(selectedRoles.filter((r) => r.role !== role));
    } else if (selectedRoles.length < hackathon.maxTeamSize) {
      setSelectedRoles([
        ...selectedRoles,
        { role, required: hackathon.requiredRoles.includes(role) },
      ]);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/hackathons/${slug}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          slots: selectedRoles.map((r) => ({
            role: r.role,
            required: r.required,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create team");
        return;
      }

      onCreated();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkCount < 1) return;

    setLoading(true);
    setError("");

    const baseSlots = hackathon.roles.map((role) => ({
      role,
      required: hackathon.requiredRoles.includes(role),
    }));
    // If maxTeamSize exceeds the number of defined roles, pad with Flex slots
    const extraSlots = Math.max(0, hackathon.maxTeamSize - baseSlots.length);
    const defaultSlots = [
      ...baseSlots,
      ...Array.from({ length: extraSlots }, () => ({
        role: "Flex" as HackathonRole,
        required: false,
      })),
    ].slice(0, hackathon.maxTeamSize);

    try {
      let created = 0;
      for (let i = 1; i <= bulkCount; i++) {
        const teamName = `${bulkPrefix.trim()} ${i}`;
        const res = await fetch(`/api/hackathons/${slug}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: teamName,
            description: "",
            slots: defaultSlots,
          }),
        });

        if (res.ok) {
          created++;
        } else {
          const data = await res.json();
          // If duplicate name, skip and continue
          if (res.status === 409) continue;
          setError(data.error || `Failed at team ${i}`);
          break;
        }
      }

      if (created > 0) onCreated();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Create Team</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="h-6 w-6"
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
          </div>

          {/* Mode tabs */}
          <div className="mb-5 flex gap-1 rounded-lg border border-gray-700 bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("single");
                setError("");
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "single"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("bulk");
                setError("");
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "bulk"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Bulk Create
            </button>
          </div>

          {mode === "single" ? (
            <form onSubmit={handleSingleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Team Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Building an AI-powered code reviewer"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Role Slots ({selectedRoles.length}/{hackathon.maxTeamSize})
                </label>
                <div className="flex flex-wrap gap-2">
                  {hackathon.roles.map((role) => {
                    const selected = selectedRoles.some((r) => r.role === role);
                    const isRequired = hackathon.requiredRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          selected
                            ? isRequired
                              ? "border-blue-500 bg-blue-500/20 text-blue-400"
                              : "border-gray-500 bg-gray-700 text-white"
                            : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        {role}
                        {isRequired && selected && " *"}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  * = required role. Click to toggle slots.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 font-medium text-gray-300 transition-colors hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || !name.trim() || selectedRoles.length === 0
                  }
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Number of Teams
                  </label>
                  <input
                    type="number"
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(
                        Math.max(
                          1,
                          Math.min(50, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    min={1}
                    max={50}
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Name Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="Team"
                    className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3">
                <div className="mb-1 text-sm text-gray-300">Preview</div>
                <div className="text-xs text-gray-400">
                  {Array.from({ length: Math.min(bulkCount, 3) }, (_, i) => (
                    <span key={i}>
                      {bulkPrefix.trim()} {i + 1}
                      {i < Math.min(bulkCount, 3) - 1 ? ", " : ""}
                    </span>
                  ))}
                  {bulkCount > 3 && (
                    <span>
                      {" "}
                      ... {bulkPrefix.trim()} {bulkCount}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Each team gets {hackathon.roles.length} role slots (
                  {hackathon.roles.join(", ")})
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 font-medium text-gray-300 transition-colors hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || bulkCount < 1 || !bulkPrefix.trim()}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Creating..."
                    : `Create ${bulkCount} Team${bulkCount !== 1 ? "s" : ""}`}
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
