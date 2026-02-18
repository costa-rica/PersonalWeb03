"use client";

import Image from "next/image";
import Link from "next/link";

interface Project {
  name: string;
  description: string;
  image: string;
  url: string;
}

export default function ProjectsSection() {
  const projects: Project[] = [
    {
      name: "News Nexus",
      description:
        "Article collecting and analysis of news articles from various sources. The Consumer Product Safety Commission (CPSC) has hired Kinetic Metrics to collect articles on hazards caused by consumer products in the United States.",
      image: "/logo-news-nexus.png",
      url: "https://news-nexus.kineticmetrics.com",
    },
    {
      name: "Kyber Vision",
      description:
        "Kyber Vision turns volleyball into a playful, data-driven experience. It’s not just about numbers—it’s about making the game easier to understand, more fun to track, and better for team development.",
      image: "/logo-kyber-vision.png",
      url: "https://kybervision.eu/",
    },
    {
      name: "What Sticks",
      description:
        "The wellness application that provides insights on sleep and exercise based on data already collected by your devices. ",
      image: "/logo-what-sticks.png",
      url: "https://what-sticks.com/",
    },
  ];

  return (
    <section id="projects" className="min-h-screen py-12 px-6">
      <div className="border-2 border-black rounded-3xl p-8 lg:p-12 bg-white">
        <h2 className="text-3xl font-bold font-mono mb-8 text-black">
          projects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className={`border-2 border-black rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors ${
                index === 0 && projects.length % 2 !== 0 ? "md:col-span-2" : ""
              }`}
            >
              <Link
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="relative h-48 mb-4 rounded-xl overflow-hidden border-2 border-black hover:border-4 transition-all cursor-pointer">
                  <Image
                    src={project.image || "/placeholder.svg"}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>
              <h3 className="text-xl font-bold font-mono mb-2 text-black">
                {project.name}
              </h3>
              <p className="text-gray-700">{project.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
