"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/loaders/Loading";
import TopNavBar from "@/components/nav/TopNavBar";
import { HACKATHON_ROLES } from "@/types";
import type { Hackathon, HackathonRole } from "@/types";

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  registration: { bg: "bg-green-600/20", text: "text-green-400", label: "Registration Open" },
  active: { bg: "bg-blue-600/20", text: "text-blue-400", label: "Active" },
  draft: { bg: "bg-yellow-600/20", text: "text-yellow-400", label: "Draft" },
  completed: { bg: "bg-gray-600/20", text: "text-gray-400", label: "Completed" },
};

export default function HackathonIndexPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<"loading" | "no-hackathon" | "error">("loading");
  const [isAdmin, setIsAdmin] = useState(false);
  const [allHackathons, setAllHackathons] = useState<Hackathon[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [hackRes, sessionRes] = await Promise.all([
          fetch("/api/hackathons"),
          fetch("/api/auth/session"),
        ]);
        const data = await hackRes.json();
        const sessionData = await sessionRes.json();
        const admin = !!sessionData.user?.isAdmin;
        setIsAdmin(admin);

        if (data.hackathon && !admin) {
          // Non-admins redirect straight to the active hackathon
          router.replace(`/hackathon/${data.hackathon.slug}`);
          return;
        }

        if (admin) {
          // Admins see the full list — fetch all hackathons
          const allRes = await fetch("/api/hackathons?all=true");
          const allData = await allRes.json();
          setAllHackathons(allData.hackathons || []);

          // If there's an active hackathon but admin wants the dashboard, still show the list
          setPageState("no-hackathon");
        } else {
          setPageState("no-hackathon");
        }
      } catch {
        setPageState("error");
      }
    }
    init();
  }, [router]);

  if (pageState === "loading") return <Loading />;

  if (pageState === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-4 text-2xl font-bold text-red-400">Something went wrong</h1>
        <a
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <TopNavBar />
      <div className="flex flex-1 flex-col items-center px-4 pt-24 pb-12">
        {showCreateForm ? (
          <CreateHackathonForm
            onCreated={(slug) => router.push(`/hackathon/${slug}/admin`)}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : isAdmin ? (
          <AdminHackathonList
            hackathons={allHackathons}
            onCreateNew={() => setShowCreateForm(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1">
            <h1 className="mb-4 text-4xl font-bold">No Active Hackathon</h1>
            <p className="mb-8 text-gray-400">
              There are no hackathons currently open for registration.
            </p>
            <a
              href="/"
              className="rounded-lg border border-gray-600 px-6 py-3 font-medium transition-colors hover:bg-gray-800"
            >
              Go Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminHackathonList({
  hackathons,
  onCreateNew,
}: {
  hackathons: Hackathon[];
  onCreateNew: () => void;
}) {
  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hackathons</h1>
          <p className="text-sm text-gray-400">Manage all hackathons</p>
        </div>
        <button
          onClick={onCreateNew}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-blue-700"
        >
          + New Hackathon
        </button>
      </div>

      {hackathons.length === 0 ? (
        <div className="rounded-lg border border-gray-700 p-12 text-center">
          <p className="mb-2 text-lg text-gray-300">No hackathons yet</p>
          <p className="mb-6 text-sm text-gray-500">Create your first hackathon to get started.</p>
          <button
            onClick={onCreateNew}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
          >
            Create Hackathon
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {hackathons.map((h) => {
            const style = STATUS_STYLES[h.status] || STATUS_STYLES.draft;
            const eventDate = new Date(h.date);
            return (
              <div
                key={h._id}
                className="group rounded-lg border border-gray-700 bg-gray-900 transition-colors hover:border-gray-600"
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="truncate font-semibold">{h.name}</h3>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${style.bg} ${style.text}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>
                        {eventDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>{h.location}</span>
                      <span className="font-mono text-gray-500">/{h.slug}</span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <a
                      href={`/hackathon/${h.slug}`}
                      className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                    >
                      View
                    </a>
                    <a
                      href={`/hackathon/${h.slug}/admin`}
                      className="rounded-lg bg-purple-600/20 px-3 py-1.5 text-xs text-purple-400 transition-colors hover:bg-purple-600/30"
                    >
                      Admin
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateHackathonForm({
  onCreated,
  onCancel,
}: {
  onCreated: (slug: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState(6);
  const [selectedRoles, setSelectedRoles] = useState<HackathonRole[]>([
    ...HACKATHON_ROLES,
  ]);
  const [requiredRoles, setRequiredRoles] = useState<HackathonRole[]>([
    "Backend Engineer",
    "Frontend Developer",
    "Prompt/AI Engineer",
  ]);
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    );
  };

  const toggleRole = (role: HackathonRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
      setRequiredRoles(requiredRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const toggleRequired = (role: HackathonRole) => {
    if (requiredRoles.includes(role)) {
      setRequiredRoles(requiredRoles.filter((r) => r !== role));
    } else {
      setRequiredRoles([...requiredRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/hackathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          description,
          date: new Date(date).toISOString(),
          location,
          maxTeamSize,
          roles: selectedRoles,
          requiredRoles,
          registrationDeadline: registrationDeadline
            ? new Date(registrationDeadline).toISOString()
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create hackathon");
        return;
      }

      const data = await res.json();
      onCreated(data.hackathon.slug);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Hackathon</h1>
        <button
          onClick={onCancel}
          className="text-gray-400 transition-colors hover:text-white"
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
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Prompt Engineers AI Hackathon - Spring 2026"
            required
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="spring-2026"
            required
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            URL-friendly identifier (lowercase, hyphens only)
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Build AI-powered applications in 24 hours..."
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Plano, TX"
              required
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Max Team Size
            </label>
            <input
              type="number"
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(parseInt(e.target.value))}
              min={2}
              max={12}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Roles
          </label>
          <div className="space-y-2">
            {HACKATHON_ROLES.map((role) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  {role}
                </label>
                {selectedRoles.includes(role) && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={requiredRoles.includes(role)}
                      onChange={() => toggleRequired(role)}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    Required
                  </label>
                )}
              </div>
            ))}
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
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2.5 font-medium text-gray-300 transition-colors hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 font-medium transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Hackathon"}
          </button>
        </div>
      </form>
    </div>
  );
}
