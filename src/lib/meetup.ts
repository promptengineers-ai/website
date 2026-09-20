import type { MeetupStats } from "@/types";

const GROUP_URL = "https://www.meetup.com/plano-prompt-engineers/";

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

export async function getMeetupStats(): Promise<MeetupStats> {
  try {
    const response = await fetch(GROUP_URL, {
      headers: { "user-agent": BROWSER_USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return FALLBACK_MEETUP_STATS;

    return parseMeetupStats(await response.text()) ?? FALLBACK_MEETUP_STATS;
  } catch {
    return FALLBACK_MEETUP_STATS;
  }
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
