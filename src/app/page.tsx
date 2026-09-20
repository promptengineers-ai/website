import Link from "next/link";
import TopNavBar from "@/components/nav/TopNavBar";
import HeroSection from "@/sections/HeroSection";
import ChapterCard from "@/components/chapters/ChapterCard";
import MemberStrip from "@/components/members/MemberStrip";
import { getChapterSnapshot, getMeetupStats } from "@/lib/meetup";
import { CHAPTERS } from "@/config/chapters";

export default async function Home() {
  const [stats, snapshots] = await Promise.all([
    getMeetupStats(),
    Promise.all(CHAPTERS.map(getChapterSnapshot)),
  ]);

  return (
    <>
      <header>
        <TopNavBar />
      </header>
      <main>
        <HeroSection stats={stats} />
        <section
          aria-labelledby="chapters-heading"
          className="border-t border-white/15 bg-black px-4 py-16 text-white sm:px-6 lg:px-8"
        >
          <div className="container mx-auto">
            <h2
              id="chapters-heading"
              className="mb-8 text-2xl font-bold text-white sm:text-3xl"
            >
              Our chapters
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.chapter.slug}
                  className="flex h-full flex-col gap-3"
                >
                  <ChapterCard snapshot={snapshot} />
                  <Link
                    href={`/chapters/${snapshot.chapter.slug}`}
                    className="text-sm font-medium text-blue-400 hover:underline"
                  >
                    Visit the {snapshot.chapter.city}, {snapshot.chapter.state}{" "}
                    chapter page
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        <MemberStrip />
      </main>
    </>
  );
}
