"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  SKILL_BACKGROUNDS,
  AI_EXPERIENCE_LEVELS,
  HACKATHON_ROLES,
} from "@/types";
import type {
  Hackathon,
  HackathonInvolvement,
  HackathonRole,
  SkillBackground,
  AiExperience,
} from "@/types";

interface Props {
  hackathon: Hackathon;
  onClose: () => void;
  onRegistered: () => void;
}

export default function HackathonRegistrationForm({
  hackathon,
  onClose,
  onRegistered,
}: Props) {
  const [involvement, setInvolvement] =
    useState<HackathonInvolvement>("participant");
  const [rolePreference, setRolePreference] = useState<HackathonRole | "">("");
  const [skillBackground, setSkillBackground] = useState<SkillBackground | "">(
    "",
  );
  const [aiExperience, setAiExperience] = useState<AiExperience | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/hackathons/${hackathon.slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          involvement,
          rolePreference,
          skillBackground,
          aiExperience,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Registration failed");
        return;
      }

      onRegistered();
    } catch {
      setError("Something went wrong. Please try again.");
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
            <DialogTitle className="text-xl font-bold">
              Register for {hackathon.name}
            </DialogTitle>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Involvement */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                How would you like to be involved?
              </label>
              <div className="flex gap-3">
                {(["participant", "volunteer", "mentor"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInvolvement(type)}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                        involvement === type
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Skill Background */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Your background
              </label>
              <select
                value={skillBackground}
                onChange={(e) =>
                  setSkillBackground(e.target.value as SkillBackground)
                }
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select your background</option>
                {SKILL_BACKGROUNDS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Experience */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                AI experience level
              </label>
              <select
                value={aiExperience}
                onChange={(e) =>
                  setAiExperience(e.target.value as AiExperience)
                }
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select your experience</option>
                {AI_EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Preference */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Preferred role
              </label>
              <select
                value={rolePreference}
                onChange={(e) =>
                  setRolePreference(e.target.value as HackathonRole)
                }
                required
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select your preferred role</option>
                {hackathon.roles.map((role) => (
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
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 font-medium transition-all hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
