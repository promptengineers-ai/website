import TopNavBar from "@/components/nav/TopNavBar";
import HeroSection from "@/sections/HeroSection";
import ContactSection from "@/sections/ContactSection";
import WaitlistButton from "@/components/buttons/WaitlistButton";

export default function Home() {
  return (
    <>
      <header>
        <TopNavBar />
      </header>
      <main>
        <HeroSection />

        {/* <ProjectSection /> */}
        {/* <AboutSection /> */}
        <ContactSection />
      </main>
      {/* <footer>
				<FooterSection />
			</footer> */}
      <WaitlistButton />
    </>
  );
}
