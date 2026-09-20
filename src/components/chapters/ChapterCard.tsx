import { FaCalendarAlt, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { formatEventDateTime, formatMemberCount } from "@/lib/meetup";
import type { ChapterSnapshot } from "@/types";

type ChapterCardProps = {
  snapshot: ChapterSnapshot;
};

export default function ChapterCard({ snapshot }: ChapterCardProps) {
  const { chapter, stats, nextEvent } = snapshot;
  const launching = chapter.status === "launching";

  return (
    <article className="flex h-full flex-col gap-4 rounded-xl border border-white/15 bg-white/5 p-6 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">
          {chapter.city}, {chapter.state}
        </h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            launching
              ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
              : "border-green-400/40 bg-green-500/20 text-green-200"
          }`}
        >
          {launching ? "Launching" : "Established"}
        </span>
      </header>

      {chapter.venue && (
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <FaMapMarkerAlt className="h-3 w-3 shrink-0" />
          <span>{chapter.venue}</span>
        </p>
      )}

      {chapter.organizers.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-gray-300">
          <FaUsers className="h-3 w-3 shrink-0" />
          <span>{chapter.organizers.join(", ")}</span>
        </p>
      )}

      {stats && (
        <p className="text-sm text-gray-300">
          {formatMemberCount(stats.memberCount)} members
        </p>
      )}

      <div className="flex-1 rounded-lg bg-white/10 p-4">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-300">
          <FaCalendarAlt className="h-3 w-3 shrink-0" />
          Next event
        </p>
        {nextEvent ? (
          <>
            <a
              href={nextEvent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-medium text-white hover:underline"
            >
              {nextEvent.title}
            </a>
            <time
              dateTime={nextEvent.dateTime}
              className="mt-1 block text-sm text-gray-300"
            >
              {formatEventDateTime(nextEvent.dateTime) ?? nextEvent.dateTime}
            </time>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-300">
            {launching ? "First event to be announced" : "No upcoming event"}
          </p>
        )}
      </div>

      {chapter.meetupUrl && (
        <a
          href={chapter.meetupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-400 hover:underline"
        >
          View on Meetup
        </a>
      )}
    </article>
  );
}
