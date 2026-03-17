"use client";

import { useState } from "react";
import {
  SKILL_BACKGROUNDS,
  AI_EXPERIENCE_LEVELS,
  HACKATHON_ROLES,
} from "@/types";
import type { HackathonRole, SkillBackground, AiExperience } from "@/types";

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
  participant: Participant;
  hackathonId: string;
  slug: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditParticipantModal({
  participant,
  hackathonId,
  slug,
  onClose,
  onUpdated,
}: Props) {
  const [name, setName] = useState(participant.name);
  const [skillBackground, setSkillBackground] = useState(
    participant.skillBackground || "",
  );
  const [aiExperience, setAiExperience] = useState(
    participant.aiExperience || "",
  );
  const [rolePreference, setRolePreference] = useState(
    participant.rolePreference || "",
  );
  const [involvement, setInvolvement] = useState(participant.involvement);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        userId: participant.userId,
        name: name.trim(),
        skillBackground,
        aiExperience,
        rolePreference: rolePreference || null,
        involvement,
      };


      const nameRes = await fetch(`/api/hackathons/${slug}/participants?_t=${Date.now()}`, {
        method: "PUT",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      const resData = await nameRes.json();


      if (!nameRes.ok) {
        setError(resData.error || "Failed to update");
        return;
      }

      setSuccess(true);
      setTimeout(() => onUpdated(), 400);
    } catch (err) {
      console.error("[EditParticipant] Error:", err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Edit Participant</h2>
            <p className="text-sm text-gray-400">{participant.email}</p>
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Involvement
            </label>
            <div className="flex gap-2">
              {(["participant", "volunteer", "mentor"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInvolvement(type)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    involvement === type
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Background
            </label>
            <select
              value={skillBackground}
              onChange={(e) => setSkillBackground(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Not set</option>
              {SKILL_BACKGROUNDS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              AI Experience
            </label>
            <select
              value={aiExperience}
              onChange={(e) => setAiExperience(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Not set</option>
              {AI_EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Role Preference
            </label>
            <select
              value={rolePreference}
              onChange={(e) => setRolePreference(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">No preference</option>
              {HACKATHON_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              Updated!
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
              disabled={loading || !name.trim()}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
