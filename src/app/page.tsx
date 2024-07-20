import TopNavBar from "@/components/nav/TopNavBar";
import HeroSection from "@/sections/HeroSection";
import ContactSection from "@/sections/ContactSection";
import FooterSection from "@/sections/FooterSection";
import ProjectSection from "@/sections/ProjectSection";
import AboutSection from "@/sections/AboutSection";
import SuggestionSection from "@/sections/SuggestionSection";
import WaitlistButton from "@/components/buttons/WaitlistButton";

export default function Home() {
  return (
    <>
      <header>
        <TopNavBar />
      </header>
      <main>
        <HeroSection />
        <AboutSection />
        <SuggestionSection />
        <ProjectSection />
        <ContactSection />
      </main>
      {/* <footer>
				<FooterSection />
			</footer> */}
      <WaitlistButton />
    </>
  );
}
