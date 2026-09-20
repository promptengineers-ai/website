import TopNavBar from "@/components/nav/TopNavBar";
import HeroSection from "@/sections/HeroSection";
import { getMeetupStats } from "@/lib/meetup";

export default async function Home() {
  const stats = await getMeetupStats();

  return (
    <>
      <header>
        <TopNavBar />
      </header>
      <main>
        <HeroSection stats={stats} />
      </main>
    </>
  );
}
