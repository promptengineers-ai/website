import { CHAPTERS, getChapter } from "@/config/chapters";
import type { Chapter } from "@/config/chapters";
import type { ChapterSnapshot, MeetupEvent, MeetupStats } from "@/types";

const DEFAULT_CHAPTER: Chapter = getChapter("plano") ?? CHAPTERS[0];

const REVALIDATE_SECONDS = 86400;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const FALLBACK_MEETUP_STATS: MeetupStats = {
  memberCount: 3983,
  pastEventCount: 27,
  averageRating: 4.67,
  ratingCount: 271,
  isFallback: true,
};

const MEMBER_COUNT = /"memberCounts":\{[^{}]*?"all":(\d+)/;
const EVENT_RATINGS =
  /"eventRatings":\{[^{}]*?"average":([\d.]+),"total":(\d+)/;
const PAST_EVENT_COUNT =
  /PAST[\s\S]{0,300}?"GroupEventConnection","totalCount":(\d+)/;
const UPCOMING_EVENT_REF =
  /\\"ACTIVE\\"[^)]{0,120}?\)":\{"__typename":"GroupEventConnection","totalCount":(\d+),"edges":\[(?:\{"__typename":"EventEdge","node":\{"__ref":"(Event:\d+)"\})?/;
const JSON_STRING = '"((?:[^"\\\\]|\\\\.)*)"';
const EVENT_RECORD_MAX_LENGTH = 20000;

export function parseMeetupStats(html: string): MeetupStats | null {
  const members = MEMBER_COUNT.exec(html);
  const ratings = EVENT_RATINGS.exec(html);
  const events = PAST_EVENT_COUNT.exec(html);

  if (!members || !ratings || !events) return null;

  const stats: MeetupStats = {
    memberCount: Number(members[1]),
    pastEventCount: Number(events[1]),
    averageRating: Number(ratings[1]),
    ratingCount: Number(ratings[2]),
    isFallback: false,
  };

  const sane =
    Number.isFinite(stats.memberCount) &&
    stats.memberCount > 0 &&
    Number.isFinite(stats.pastEventCount) &&
    stats.pastEventCount > 0 &&
    Number.isFinite(stats.averageRating) &&
    stats.averageRating > 0 &&
    stats.averageRating <= 5;

  return sane ? stats : null;
}

function decodeJsonString(raw: string): string | null {
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return null;
  }
}

export function parseNextEvent(html: string): MeetupEvent | null {
  const ref = UPCOMING_EVENT_REF.exec(html);
  if (!ref || !ref[2] || Number(ref[1]) < 1) return null;

  const start = html.indexOf(`"${ref[2]}":{`);
  if (start < 0) return null;
  const record = html.slice(start, start + EVENT_RECORD_MAX_LENGTH);

  const title = new RegExp(`"title":${JSON_STRING}`).exec(record);
  const url = new RegExp(`"eventUrl":${JSON_STRING}`).exec(record);
  const dateTime = /"dateTime":"([^"]+)"/.exec(record);
  if (!title || !url || !dateTime) return null;

  const decodedTitle = decodeJsonString(title[1]);
  const decodedUrl = decodeJsonString(url[1]);
  if (!decodedTitle || !decodedUrl) return null;

  return { title: decodedTitle, dateTime: dateTime[1], url: decodedUrl };
}

async function fetchGroupPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": BROWSER_USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

export async function getMeetupStats(
  chapter: Chapter = DEFAULT_CHAPTER,
): Promise<MeetupStats> {
  const html = await fetchGroupPage(chapter.meetupUrl);
  return (html && parseMeetupStats(html)) || FALLBACK_MEETUP_STATS;
}

export async function getChapterSnapshot(
  chapter: Chapter,
): Promise<ChapterSnapshot> {
  const empty: ChapterSnapshot = { chapter, stats: null, nextEvent: null };
  if (!chapter.meetupUrl) return empty;

  const html = await fetchGroupPage(chapter.meetupUrl);
  if (!html) return empty;

  return {
    chapter,
    stats: chapter.status === "established" ? parseMeetupStats(html) : null,
    nextEvent: parseNextEvent(html),
  };
}

export function formatMemberCount(count: number): string {
  return `${(Math.floor(count / 100) * 100).toLocaleString("en-US")}+`;
}

export function formatEventCount(count: number): string {
  return `${count}+`;
}

export function formatRating(average: number): string {
  return `${average.toFixed(1)}/5`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatEventDateTime(dateTime: string): string | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dateTime);
  if (!parts) return null;

  const [year, month, day, hour, minute] = parts.slice(1).map(Number);
  const weekday =
    WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? "AM" : "PM";
  const paddedMinute = String(minute).padStart(2, "0");

  return `${weekday}, ${MONTHS[month - 1]} ${day} · ${hour12}:${paddedMinute} ${meridiem}`;
}
