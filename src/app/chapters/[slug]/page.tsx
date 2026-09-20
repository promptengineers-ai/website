import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TopNavBar from "@/components/nav/TopNavBar";
import ChapterCard from "@/components/chapters/ChapterCard";
import { CHAPTER_SLUGS, getChapter } from "@/config/chapters";
import type { Chapter } from "@/config/chapters";
import { getChapterSnapshot } from "@/lib/meetup";
import type { ChapterSnapshot } from "@/types";

const PRODUCTION_URL = "https://promptengineers.ai/";
const SLACK_INVITE_URL =
  "https://join.slack.com/t/promptengineersai/shared_invite/zt-3t4w1meid-10gQHbgoWO~UYPJprH~Cyw";

const MEETUP_TIME_WINDOW: Record<string, string> = {
  "st-george": "6–9 PM",
};

const LAUNCHING_COPY = {
  lead: "A casual monthly meetup for people making things with AI. Bring a laptop, or just bring questions.",
  format:
    "No talk, no agenda. Some people work on a project in the corner, some people come to figure out what any of this even is. Both are the point.",
  audience: "Developers, founders, students, and the AI-curious.",
  emphasis: "You don't need to code.",
  firstEvent: "First event to be announced",
};

type ChapterPageProps = {
  params: { slug: string };
};

type ChapterCopy = {
  title: string;
  heading: string;
  description: string;
};

function chapterCopy(chapter: Chapter): ChapterCopy {
  const place = `${chapter.city}, ${chapter.state}`;

  if (chapter.status === "launching") {
    return {
      title: `AI Build Night — ${place}`,
      heading: `AI Build Night — ${chapter.name}`,
      description: `A casual monthly meetup in ${place} for people making things with AI. Bring a laptop, or just bring questions. ${LAUNCHING_COPY.emphasis}`,
    };
  }

  return {
    title: `${place} Chapter`,
    heading: place,
    description: `The Prompt Engineers AI chapter in ${place}. Monthly meetups for developers and builders exploring LLMs, agents, and applied AI. RSVP on Meetup.`,
  };
}

function requireChapter(slug: string): Chapter {
  const chapter = getChapter(slug);
  if (!chapter) notFound();
  return chapter;
}

export function generateStaticParams() {
  return CHAPTER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const chapter = requireChapter(params.slug);
  const copy = chapterCopy(chapter);
  const ogImage = `/images/og-chapter-${chapter.slug}.png`;
  const url = `${PRODUCTION_URL}chapters/${chapter.slug}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: copy.title,
      description: copy.description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: copy.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [ogImage],
    },
  };
}

function LaunchingDetails({ chapter }: { chapter: Chapter }) {
  const segments = [
    LAUNCHING_COPY.firstEvent,
    chapter.venue ? `Planned venue: ${chapter.venue}` : null,
    MEETUP_TIME_WINDOW[chapter.slug] ?? null,
  ].filter((segment): segment is string => segment !== null);

  return (
    <div className="space-y-6 text-lg leading-relaxed text-gray-200">
      <p>{LAUNCHING_COPY.lead}</p>
      <p>{LAUNCHING_COPY.format}</p>
      <p>
        {LAUNCHING_COPY.audience}{" "}
        <strong className="font-semibold text-white">
          {LAUNCHING_COPY.emphasis}
        </strong>
      </p>
      <p className="text-base text-gray-400">{segments.join(" · ")}</p>
    </div>
  );
}

function LaunchingActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="rounded-md bg-white px-6 py-3 text-base font-medium text-black transition-colors hover:bg-gray-200"
      >
        Create a free account
      </Link>
      <a
        href={SLACK_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-gray-600 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white"
      >
        Say hi on Slack
      </a>
    </div>
  );
}

function EstablishedActions({ snapshot }: { snapshot: ChapterSnapshot }) {
  const rsvpUrl = snapshot.nextEvent?.url ?? snapshot.chapter.meetupUrl;

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={rsvpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-white px-6 py-3 text-base font-medium text-black transition-colors hover:bg-gray-200"
      >
        RSVP on Meetup
      </a>
      <Link
        href="/signup"
        className="rounded-md border border-gray-600 px-6 py-3 text-base font-medium text-white transition-colors hover:border-white"
      >
        Create a free account
      </Link>
    </div>
  );
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const chapter = requireChapter(params.slug);
  const snapshot = await getChapterSnapshot(chapter);
  const copy = chapterCopy(chapter);
  const launching = chapter.status === "launching";

  return (
    <>
      <header>
        <TopNavBar />
      </header>
      <main className="min-h-screen bg-black px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
        <div className="container mx-auto grid max-w-5xl gap-12 lg:grid-cols-[3fr_2fr] lg:items-start">
          <section aria-labelledby="chapter-heading" className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-widest text-blue-400">
                Prompt Engineers AI · {chapter.city}, {chapter.state}
              </p>
              <h1
                id="chapter-heading"
                className="text-4xl font-bold sm:text-5xl"
              >
                {copy.heading}
              </h1>
            </div>

            {launching ? (
              <LaunchingDetails chapter={chapter} />
            ) : (
              <p className="text-lg leading-relaxed text-gray-200">
                Event details, the group description, and RSVPs live on Meetup.
              </p>
            )}

            {launching ? (
              <LaunchingActions />
            ) : (
              <EstablishedActions snapshot={snapshot} />
            )}
          </section>

          <aside aria-label="Chapter details">
            <ChapterCard snapshot={snapshot} />
          </aside>
        </div>
      </main>
    </>
  );
}
