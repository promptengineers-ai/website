"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import TopNavBar from "@/components/nav/TopNavBar";
import Loading from "@/components/loaders/Loading";
import HackathonRegistrationForm from "@/components/hackathon/HackathonRegistrationForm";
import TeamCardGrid from "@/components/hackathon/TeamCardGrid";
import {
  ROLE_DESCRIPTIONS,
  type Hackathon,
  type HackathonRegistration,
  type HackathonTeam,
  type HackathonTeamSlot,
} from "@/types";

type EnrichedSlot = HackathonTeamSlot & { userName?: string | null };
type EnrichedTeam = Omit<HackathonTeam, "slots"> & { slots: EnrichedSlot[] };

export default function HackathonLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, status } = useAuth();
  const slug = params.slug as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<EnrichedTeam[]>([]);
  const [registration, setRegistration] =
    useState<HackathonRegistration | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = async () => {
    try {
      const [hackRes, teamsRes] = await Promise.all([
        fetch(`/api/hackathons/${slug}`),
        fetch(`/api/hackathons/${slug}/teams`),
      ]);

      if (!hackRes.ok) {
        setHackathon(null);
        setLoading(false);
        return;
      }

      const hackData = await hackRes.json();
      const teamsData = await teamsRes.json();

      setHackathon(hackData.hackathon);
      setTeams(teamsData.teams || []);
      setParticipantCount(hackData.participantCount || 0);
    } catch (error) {
      console.error("Failed to load hackathon:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check registration status
  const checkRegistration = async () => {
    if (!user || !hackathon) return;
    try {
      const res = await fetch(`/api/hackathons/${slug}/participants`);
      const data = await res.json();
      const myReg = data.participants?.find(
        (p: { userId: string }) => p.userId === user.id,
      );
      if (myReg) {
        setRegistration({
          _id: "",
          hackathonId: hackathon._id,
          userId: user.id,
          involvement: myReg.involvement,
          rolePreference: myReg.rolePreference,
          registeredAt: new Date(myReg.registeredAt),
        });
      }
    } catch {
      // Not registered
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  // Check admin status
  useEffect(() => {
    if (status === "authenticated" && user) {
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          setIsAdmin(data.user?.isAdmin || false);
        })
        .catch(() => {});
    }
  }, [status, user]);

  useEffect(() => {
    if (status === "authenticated" && hackathon) {
      checkRegistration();
    }
  }, [status, hackathon]);

  if (loading) return <Loading />;

  if (!hackathon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <h1 className="mb-4 text-4xl font-bold">Hackathon Not Found</h1>
        <a
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    );
  }

  const isRegistered = !!registration;
  const isRegistrationOpen =
    hackathon.status === "registration" || hackathon.status === "active";
  const eventDate = new Date(hackathon.date);
  const daysUntil = Math.max(
    0,
    Math.ceil(
      (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <TopNavBar />

      {/* Hero Section */}
      <section className="px-4 pb-16 pt-32 text-center">
        <div className="mx-auto max-w-4xl">
          {hackathon.status === "draft" && (
            <span className="mb-4 inline-block rounded-full bg-yellow-600/20 px-4 py-1 text-sm text-yellow-400">
              Coming Soon
            </span>
          )}
          {isRegistrationOpen && (
            <span className="mb-4 inline-block rounded-full bg-green-600/20 px-4 py-1 text-sm text-green-400">
              Registration Open
            </span>
          )}
          {isAdmin && (
            <a
              href={`/hackathon/${slug}/admin`}
              className="mb-4 ml-2 inline-block rounded-full bg-purple-600/20 px-4 py-1 text-sm text-purple-400 transition-colors hover:bg-purple-600/30"
            >
              Admin Dashboard
            </a>
          )}
          {hackathon.status === "completed" && (
            <span className="mb-4 inline-block rounded-full bg-gray-600/20 px-4 py-1 text-sm text-gray-400">
              Completed
            </span>
          )}

          <h1 className="mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            {hackathon.name}
          </h1>

          <p className="mb-8 text-lg text-gray-300">
            {hackathon.description}
          </p>

          {/* Event Details */}
          <div className="mb-10 flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {eventDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-sm text-gray-400">Event Date</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {hackathon.location}
              </div>
              <div className="text-sm text-gray-400">Location</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {participantCount}
              </div>
              <div className="text-sm text-gray-400">Registered</div>
            </div>
            {daysUntil > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {daysUntil}
                </div>
                <div className="text-sm text-gray-400">Days Until Event</div>
              </div>
            )}
          </div>

          {/* CTA */}
          {isRegistrationOpen && !isRegistered && (
            <div>
              {status === "authenticated" ? (
                <button
                  onClick={() => setShowRegistration(true)}
                  className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-10 py-5 text-lg font-bold shadow-2xl shadow-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-green-500/50 animate-pulse-grow-shrink"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 opacity-30 blur-lg transition-opacity duration-300 group-hover:opacity-50" />
                  <span className="relative flex items-center gap-3">
                    <span className="text-2xl">&#9889;</span>
                    <span>
                      <span className="block text-left text-lg leading-tight">Join the Hackathon</span>
                      <span className="block text-left text-xs font-normal opacity-80">Pick your role &amp; find your team</span>
                    </span>
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              ) : (
                <a
                  href={`/login?from=/hackathon/${slug}`}
                  className="inline-block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40"
                >
                  Sign In to Register
                </a>
              )}
            </div>
          )}

          {isRegistered && (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-600/20 px-6 py-3 text-green-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              You&apos;re registered as a {registration?.involvement}
            </div>
          )}
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistration && hackathon && (
        <HackathonRegistrationForm
          hackathon={hackathon}
          onClose={() => setShowRegistration(false)}
          onRegistered={() => {
            setShowRegistration(false);
            fetchData();
            checkRegistration();
          }}
        />
      )}

      {/* Roles Section */}
      <section className="border-t border-gray-800 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold">Team Roles</h2>
          <p className="mb-8 text-center text-gray-400">
            Each team needs these roles to succeed
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hackathon.roles.map((role) => {
              const isRequired = hackathon.requiredRoles.includes(role);
              return (
                <div
                  key={role}
                  className={`group relative rounded-lg border p-4 transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${
                    isRequired
                      ? "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/15"
                      : "border-gray-700 bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {/* Electric border glow pulse on hover */}
                  <span className={`pointer-events-none absolute -inset-[2px] rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    isRequired
                      ? "shadow-[0_0_8px_2px_rgba(59,130,246,0.5),inset_0_0_8px_2px_rgba(59,130,246,0.1)] animate-pulse"
                      : "shadow-[0_0_8px_2px_rgba(168,85,247,0.4),inset_0_0_8px_2px_rgba(168,85,247,0.1)] animate-pulse"
                  }`} />
                  <div className="relative">
                    <div className="mb-1 flex items-center gap-2">
                      {isRequired ? (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                      ) : (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full border border-gray-500" />
                      )}
                      <span className="text-sm font-semibold">{role}</span>
                    </div>
                    {isRequired && (
                      <span className="mb-2 inline-block rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                        Required
                      </span>
                    )}
                    <p className="text-xs leading-relaxed text-gray-400">
                      {ROLE_DESCRIPTIONS[role] || "Contributes to the team in a specialized capacity."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Teams Section */}
      <section className="border-t border-gray-800 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold">Teams</h2>
          <p className="mb-8 text-center text-gray-400">
            {isRegistered
              ? "Join a team by clicking an open slot"
              : "Register to join a team"}
          </p>

          {teams.length === 0 ? (
            <div className="rounded-lg border border-gray-800 p-12 text-center">
              <p className="text-gray-400">
                Teams haven&apos;t been created yet. Check back soon!
              </p>
            </div>
          ) : (
            <TeamCardGrid
              teams={teams}
              hackathon={hackathon}
              isRegistered={isRegistered}
              currentUserId={user?.id}
              onRefresh={fetchData}
              slug={slug}
            />
          )}
        </div>
      </section>
    </div>
  );
}
