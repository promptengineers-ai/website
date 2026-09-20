export type ChapterStatus = "established" | "launching";

export type Chapter = {
  slug: string;
  name: string;
  city: string;
  state: string;
  status: ChapterStatus;
  meetupUrl: string;
  organizers: string[];
  venue?: string;
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "plano",
    name: "Plano",
    city: "Plano",
    state: "TX",
    status: "established",
    meetupUrl: "https://www.meetup.com/plano-prompt-engineers/",
    organizers: [],
  },
  {
    slug: "st-george",
    name: "St. George",
    city: "St. George",
    state: "UT",
    status: "launching",
    meetupUrl: "",
    organizers: ["Ryan Eggleston"],
    venue: "Atwood Innovation Plaza",
  },
];

export const CHAPTER_SLUGS = CHAPTERS.map((chapter) => chapter.slug);

export function getChapter(slug: string): Chapter | undefined {
  return CHAPTERS.find((chapter) => chapter.slug === slug);
}

export function isChapterSlug(value: unknown): value is string {
  return typeof value === "string" && CHAPTER_SLUGS.includes(value);
}

export function chapterLabel(slug: string): string {
  const chapter = getChapter(slug);
  return chapter ? `${chapter.city}, ${chapter.state}` : slug;
}
