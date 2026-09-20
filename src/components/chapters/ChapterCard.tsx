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
    <article className="flex h-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-gray-900">
          {chapter.city}, {chapter.state}
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            launching
              ? "bg-amber-100 text-amber-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {launching ? "Launching" : "Established"}
        </span>
      </header>

      {chapter.venue && (
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <FaMapMarkerAlt className="h-3 w-3 shrink-0" />
          <span>{chapter.venue}</span>
        </p>
      )}

      {chapter.organizers.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <FaUsers className="h-3 w-3 shrink-0" />
          <span>{chapter.organizers.join(", ")}</span>
        </p>
      )}

      {stats && (
        <p className="text-sm text-gray-600">
          {formatMemberCount(stats.memberCount)} members
        </p>
      )}

      <div className="flex-1 rounded-lg bg-gray-50 p-4">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <FaCalendarAlt className="h-3 w-3 shrink-0" />
          Next event
        </p>
        {nextEvent ? (
          <>
            <a
              href={nextEvent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-medium text-gray-900 hover:underline"
            >
              {nextEvent.title}
            </a>
            <time
              dateTime={nextEvent.dateTime}
              className="mt-1 block text-sm text-gray-600"
            >
              {formatEventDateTime(nextEvent.dateTime) ?? nextEvent.dateTime}
            </time>
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-600">
            {launching ? "First event to be announced" : "No upcoming event"}
          </p>
        )}
      </div>

      {chapter.meetupUrl && (
        <a
          href={chapter.meetupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View on Meetup
        </a>
      )}
    </article>
  );
}
