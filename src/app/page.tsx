import TopNavBar from "@/components/nav/TopNavBar";
import HeroSection from "@/sections/HeroSection";
import ContactSection from "@/sections/ContactSection";
import ServiceSection from "@/sections/ServiceSection";
import FooterSection from "@/sections/FooterSection";
import ProjectSection from "@/sections/ProjectSection";

export default function Home() {
  return (
    <>
			<header>
				<TopNavBar />
			</header>
			<main>
				<HeroSection />
				<ServiceSection />
				<ProjectSection />
				<ContactSection />
			</main>
			<footer>
				<FooterSection />
			</footer>
		</>
  );
}
