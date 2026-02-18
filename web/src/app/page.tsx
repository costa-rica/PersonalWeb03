import HeroSection from "@/components/HeroSection";
import ProjectsSection from "@/components/ProjectsSection";
import ResumeSection from "@/components/ResumeSection";
import BlogSection from "@/components/BlogSection";
import BooksSection from "@/components/BooksSection";

export default function HomePage() {
  return (
    <main className="bg-white">
      <HeroSection />
      <ProjectsSection />
      <BlogSection />
      <BooksSection />
      <ResumeSection />
    </main>
  );
}
