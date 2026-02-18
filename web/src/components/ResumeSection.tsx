"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Globe, Github, Linkedin } from "lucide-react";

export default function ResumeSection() {
  const contactInfo = [
    {
      icon: Mail,
      text: "nrodrig1@gmail.com",
      href: "mailto:nrodrig1@gmail.com",
    },
    // { icon: Phone, text: "+1(415) 406-9480", href: "tel:+14154069480" },
    { icon: MapPin, text: "San Francisco, CA USA" },
    { icon: Globe, text: "nick-rodriguez.info", href: "https://iamnick.info" },
    {
      icon: Github,
      text: "github.com/costa-rica",
      href: "https://github.com/costa-rica",
    },
    {
      icon: Linkedin,
      text: "Nick Rodriguez",
      href: "https://www.linkedin.com/in/nick-rodriguez-0a31a133",
    },
  ];

  const projects = [
    {
      title: "News Nexus",
      url: "https://news-nexus.kineticmetrics.com/",
      description:
        "News Nexus — A suite of applications featuring a web-based user interface connected through an API to a centralized database. The system integrates JavaScript and Python microservices that run Hugging Face models to analyze, categorize, and track news articles related to hazardous commercial products.",
      technologies:
        "JavaScript, restful API, SQLite database, HuggingFace, Python.",
    },
    {
      title: "Kyber Vision",
      url: "https://kybervision.eu/",
      description:
        "Kyber vision is a React Native mobile application for Kyber Vision, a platform providing the volleyball community with advanced training and statistics tools. The app enables players, trainers, and supporters to access videos, record actions, and analyze performance in real-time. It is supported by an Express.js API, ensuring seamless data management and interaction.",
      technologies: "JavaScript, restful API, and SQLite database.",
      demo: {
        text: "Demo Version 0.6.1",
        url: "https://expo.dev/preview/update?message=version%200.6.1%20-%20fixed%20action%20recording%20and%20quality%20change%20bugs&updateRuntimeVersion=1.0.0&createdAt=2025-01-18T09%3A58%3A25.002Z&slug=exp&projectId=19bda6d6-1261-4ffc-9425-4e157bd11f4b&group=43ea1e69-076f-4567-bec6-05bb784f6508",
      },
    },
    {
      title: "Open Mindset",
      url: "https://github.com/amwebexpert/poc-mobile-python",
      description:
        "Lead the conversion of 'Open Mindset', a Python-based multi-platform application, into Xcode. Actively contributed to codebase enhancements and bug fixes, leading to successful pull requests; played a pivotal role in the deployment process for the Apple App Store.",
      technologies: "Python, Xcode, Github, kivy-ios toolchain.",
      appStore: {
        text: "open mindset",
        url: "https://apps.apple.com/us/app/open-mindset/id6467103164",
      },
    },
    {
      title: "What-Sticks",
      url: "https://what-sticks.com/",
      description:
        "Personal data storage platform with statistical feedback to measure user tendencies.",
      technologies: "Swift, Python, HTML/CSS, restful API, and MySQL database.",
      appStore: {
        text: "What Sticks",
        url: "https://apps.apple.com/us/app/what-sticks/id6670183165",
      },
    },
  ];

  const experience = [
    {
      company: "Freelance (Dashboards and Databases)",
      title: "Software Engineer",
      dates: "2020 - Present",
      description:
        "Designed, developed, and deployed mobile and web applications from concept to production, including architecting and integrating AI-driven workflows that enhanced automation, analytics, and overall system performance.",
    },
    {
      company: "US Department of Navy",
      title: "Economist",
      dates: "2012 - 2020",
      description:
        "In my latest role I was an integral part of a small team modernizing the Navy's negotiating tactics - using large data model of millions of parts to contest and negotiate contractor proposal estimates. Built and modified large data models. Industry analysis forecasting price growth. Developed indices used Navy wide to estimate cost growth and ultimately used in US Federal budget.",
    },
    {
      company: "ICF International",
      title: "Economist",
      dates: "2009 - 2012",
      description:
        "Forecasted electricity markets using ICF International's proprietary linear program model of US electricity markets. I led in various modeling preparation efforts, contributed to the analysis of results, and wrote reports. Client projects included power plant valuations, energy price forecasts, market share forecasts, and various other indicators. Contributed to testing of model upgrade to .net framework.",
    },
    {
      company: "HDR",
      title: "Economist",
      dates: "2007 - 2008",
      description: "Modeled cost and risk of public infrastructure projects.",
    },
    {
      company: "Department of Energy (Energy Information Administration)",
      title: "Economist",
      dates: "2005 - 2007",
      description:
        'Assisted data collection of electricity retail sales. Worked on special projects analyzing the impact of "deregulation" of US wholesale and retail electricity markets.',
    },
  ];

  const education = [
    {
      degree: "La Capsule JavaScript Full-Stack Web Developer Bootcamp",
      level: "BAC +3 / Bachelor's equivalent",
      location: "Paris, France",
      dates: "2024",
    },
    {
      degree: "BA and MA Economics George Mason University",
      location: "Fairfax, VA",
      dates: "1999-2006",
    },
  ];

  return (
    <section id="resume" className="min-h-screen py-12 px-6">
      <div className="border-2 border-black rounded-3xl p-6 lg:p-12 bg-white">
        {/* Top Personal Info Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left Side - Name, Title, Objective, Skills */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-4xl font-bold font-mono">Nick Rodriguez</h1>
              <Link
                href="/resumeNRodriguez.pdf"
                className="px-6 py-2 bg-black text-white font-mono rounded-lg hover:bg-gray-800 transition-colors text-sm"
                target="_blank"
              >
                Download PDF
              </Link>
            </div>

            <h3 className="text-xl font-mono font-semibold text-gray-700">
              Software Engineer
            </h3>

            <p className="text-gray-700">
              Full-stack developer specializing in the integration of AI into
              production workflows. Experienced in architecting and deploying
              data-driven web and mobile applications, automating processes with
              AI, and applying statistical and analytical methods to improve
              system efficiency and user experience.
            </p>

            <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
              <span className="font-mono font-semibold text-yellow-600">
                Programmer and DevOps skills:{" "}
              </span>
              <span className="text-gray-700">
                JavaScript, React, Python, Kivy, Swift, HTML/CSS, SQL, MySQL,
                MongoDb, AWS, Linux Server, Restful API, Host Web Applications,
                GitHub, HuggingFace, Langflow
              </span>
            </div>

            <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
              <span className="font-mono font-semibold text-yellow-600">
                Video and image editing skills:{" "}
              </span>
              <span className="text-gray-700">
                Shotcut, Flixier, iMovie, Krita
              </span>
            </div>
          </div>

          {/* Right Side - Contact Details */}
          <div className="lg:w-80 space-y-3">
            {contactInfo.map((contact, index) => (
              <div key={index} className="flex items-center gap-3">
                <contact.icon className="h-5 w-5 text-gray-700 flex-shrink-0" />
                {contact.href ? (
                  <Link
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-black transition-colors text-sm"
                  >
                    {contact.text}
                  </Link>
                ) : (
                  <span className="text-gray-700 text-sm">{contact.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <hr className="border-t-2 border-black my-8" />

        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-mono mb-6">Projects</h2>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <div key={index} className="space-y-2">
                <Link
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-bold font-mono text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  {project.title}
                </Link>
                <p className="text-gray-700">{project.description}</p>
                <p className="text-gray-600 text-sm">
                  Technologies used: {project.technologies}
                </p>
                {project.demo && (
                  <p className="text-sm">
                    <span className="underline">Expo Go</span>:{" "}
                    <Link
                      href={project.demo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-green-600 hover:text-green-700"
                    >
                      {project.demo.text}
                    </Link>
                    .
                  </p>
                )}
                {project.appStore && (
                  <p className="text-sm">
                    <span className="underline">Apple App Store search</span>:{" "}
                    <Link
                      href={project.appStore.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-green-600 hover:text-green-700"
                    >
                      {project.appStore.text}
                    </Link>
                    .
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <hr className="border-t-2 border-black my-8" />

        {/* Work Experience Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-mono mb-6">Work Experience</h2>
          <div className="space-y-6">
            {experience.map((job, index) => (
              <div key={index} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="text-lg">
                    {job.company} <em className="text-gray-600">{job.title}</em>
                  </div>
                  <div className="text-gray-600">{job.dates}</div>
                </div>
                <p className="text-gray-700">{job.description}</p>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-t-2 border-black my-8" />

        {/* Education Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-mono mb-6">Education</h2>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
              >
                <div>
                  {edu.degree}{" "}
                  {edu.level && (
                    <em className="text-gray-600">({edu.level})</em>
                  )}{" "}
                  <span className="text-gray-600">({edu.location})</span>
                </div>
                <div className="text-gray-600">{edu.dates}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
