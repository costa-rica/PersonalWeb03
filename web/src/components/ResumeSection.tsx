"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Globe, Github, Linkedin } from "lucide-react";
import ModalDisplayPicture from "./ModalDisplayPicture";

export default function ResumeSection() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const headshotThumbnailSrc = `${API_BASE_URL}/downloads/headshotNRodriguezCrop.jpg`;
  const headshotFullSrc = `${API_BASE_URL}/downloads/headshotNRodriguez.jpg`;
  const [isHeadshotModalOpen, setIsHeadshotModalOpen] = useState(false);

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

  const experience = [
    {
      company: "Dashboards and Databases",
      title: "Software Engineer",
      dates: "Nov 2020 - Present",
      descriptions: [
        "Building production software end-to-end, independently, for paying clients, equity-stake partners, and personal products. Stack spans full-stack web, mobile, AI integration, and DevOps.",
        "Encipher Systems (enciphersystems.com): Built and deployed the company marketing website end-to-end. Took a client-provided Figma design, added custom animations, coded it from scratch in Next.js 16 / React 19, and deployed to the client's custom domain. Includes a hardened contact workflow: Zod validation, honeypot, process-level rate limiting, and Nodemailer SMTP delivery with structured failure logging.",
        "News Nexus (news-nexus-lite.dashanddata.com): Sole builder and operator of a 5-service production platform supporting a US federal contract with the Consumer Product Safety Commission via Kinetic Metrics. Ingests news from multiple sources into Postgres 16 via a shared Sequelize model package; runs deduplication, semantic and location scoring, OpenAI state classification, and content scraping through Node and Python workers; serves a Next.js review portal for human-in-the-loop clip approval and weekly PDF/Excel contract delivery. Completed SQLite to Postgres migration.",
        "Tastermonial (tastermonial.com): Partnered with the founder to add Oura sleep tracking across their stack: Elixir (Phoenix) and Python (FastAPI) backends, new PostgreSQL schemas, Junction webhook ingestion, and Flutter mobile UI. Stood up an isolated parallel ecosystem outside Tastermonial's prod/dev environments and shipped an auth-enabled Flutter web build so test users could trial it safely.",
        "Go Lightly (go-lightly.love): Guided-meditation creation platform where users compose meditations from ordered elements: text synthesized via ElevenLabs, uploaded sounds, and timed pauses. Built as a TypeScript monorepo: a Next.js 16 / React 19 / Redux Toolkit web app, an Express 5 API with JWT and Google OAuth, and a job-queue audio worker that assembles the final MP3 with ffmpeg over Sequelize 6 models on PostgreSQL, served through authenticated byte-range streaming.",
        "Kyber Vision (kybervision.eu): Built the React Native mobile app for a European volleyball analytics product. Handles auth, team and player admin, live match scripting via a custom court-zone tap and swipe-wheel gesture system, video upload and review, action-to-video timeline sync, and highlight montage requests. Integrates with an Express API, shared Sequelize models, and a BullMQ + Redis + ffmpeg worker that uploads to YouTube and generates montages.",
        "What Sticks (what-sticks.com): Sleep and weather tracking web app. Daily API calls pull Oura Ring sleep scores and weather conditions; computes per-user temperature-to-sleep correlations over time.",
      ],
    },
    {
      company: "US Federal Government",
      title: "Economist",
      dates: "2012 - 2020",
      descriptions: [
        "Eight years as a federal economist focused on supply-chain analytics, price-growth analysis, and vendor proposal evaluation. Team lead on multiple engagements. Tools: regression, uncertainty analysis, forecasting, BLS price-index methodology, VBA, SAS JMP.",
        "Ship Construction Price-Growth Negotiation: Built the Government's analytical position for a major proposal negotiation. For each part, ran regressions against historical purchases, mapped to a BLS price index via qualitative-similarity and growth-range checks, combined third-party BLS forecasts into a Government-position forecast, and produced uncertainty bounds. Implemented in VBA and SAS JMP.",
        "NATO Inflation History: Authored a 40-year history of US inflation covering drivers and policy context; presented at a NATO conference.",
        "VBA Tooling for External Data Ingest: Built Excel/VBA tools that automated extraction from external sources to feed recurring team analyses, replacing manual workflows.",
      ],
    },
    {
      company: "ICF International",
      title: "Associate",
      dates: "2009 - 2012",
      descriptions: [
        "Three years in ICF's energy practice delivering forecasting and analytics for US electricity market clients including utilities, RTOs, and federal agencies. Tools: linear programming, econometric/regression modeling, large database management.",
        "US Electricity Market Forecasting: Used ICF's proprietary LP model of US electricity markets to deliver power-plant valuations, energy-price forecasts, and market-share forecasts for utility and RTO clients.",
        "NREL Cross-Model Comparison Study: Lead on database development and major contributor to the published report comparing technology costs and performance across seven energy market models.",
        "ARRA Federal Grants Advisory: Advised regional governments on applying for ARRA funding for energy-efficiency infrastructure including public transit and building upgrades.",
      ],
    },
    {
      company: "HDR | HLB Decision Economics",
      title: "Economist",
      dates: "Nov 2007 - Dec 2008",
      descriptions: [
        "Economic and risk modeling for infrastructure clients across the US, spanning public-sector evaluation and private-sector market assessment. Tools: cost-benefit analysis, Monte Carlo cost-risk methods, regression for market sizing.",
        "Southeastern US Construction Market Assessment: For a large US contractor, assessed market potential across water/wastewater, power, seaports, rail, and airports. Led areas involving risk and statistical modeling. Output shaped the client's resource-allocation strategy.",
        "Transportation Infrastructure Project Evaluations: Cost-benefit modeling for public-entity clients; reports informed how clients prioritized public funding awards.",
        "Cost and Schedule Risk Modeling: Built Monte Carlo cost-risk analyses estimating total cost and approximate schedule under uncertainty, used to size contingency and set baselines.",
      ],
    },
    {
      company: "US Department of Energy / EIA",
      title: "Industry Economist",
      dates: "Jun 2005 - Nov 2007",
      descriptions: [
        "Industry economist at the US Energy Information Administration focused on retail electricity. Tools: survey-data methodology and edit-check design, energy-model interpretation, web data-product development, analytical writing.",
        "Electricity Sales and Revenue Survey: Developed and analyzed edit checks, improving data-collection efficiency and surfacing trends for EIA reports.",
        "OAIF Detail: Summarized energy-model results during a detail focused on economic effects of a potential new policy.",
        "EIA Web Data Products: Developed, improved, and maintained EIA's retail electricity web data products, working with IT to take products to production. Led projects.",
      ],
    },
  ];

  const education = [
    {
      degree: "La Capsule JavaScript Full-Stack Web Developer Bootcamp",
      level: "Certified Full-Stack Web & Mobile Developer (JavaScript)",
      location: "Paris, France",
      dates: "Sep 2024 - Dec 2024",
    },
    {
      degree: "George Mason University",
      level: "M.A., Economics",
      location: "Fairfax, VA",
      dates: "2005 - 2007",
    },
    {
      degree: "George Mason University",
      level: "B.A., Economics",
      location: "Fairfax, VA",
      dates: "1999 - 2004",
    },
  ];

  return (
    <section id="resume" className="min-h-screen py-12 px-6">
      <div className="border-2 border-black rounded-3xl p-6 lg:p-12 bg-white">
        {/* Top Personal Info Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left Side - Name, Title, Objective, Skills */}
          <div className="flex-1 grid gap-6 lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-start">
            <button
              type="button"
              onClick={() => setIsHeadshotModalOpen(true)}
              aria-label="Open headshot"
              className="self-start shrink-0 cursor-pointer transition-opacity hover:opacity-95"
            >
              <Image
                src={headshotThumbnailSrc}
                alt="Nick Rodriguez headshot"
                width={160}
                height={160}
                className="block w-40 h-40 object-cover rounded-lg border-2 border-black"
              />
            </button>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <h1 className="text-4xl font-bold font-mono">
                  Nick Rodriguez
                </h1>
                <Link
                  href={`${API_BASE_URL}/downloads/resumeNRodriguez.pdf`}
                  className="px-6 py-2 bg-black text-white font-mono rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  Download PDF
                </Link>
              </div>

              <h3 className="text-xl font-mono font-semibold text-gray-700">
                Founding Engineer | Full-Stack TypeScript & Python | AI
                Integration
              </h3>

              <p className="text-gray-700">
                Problem solver who builds software end-to-end. For 5+ years has
                shipped production systems independently, including News Nexus,
                a 5-service platform delivering weekly news-clip reports under
                a US federal contract, and Kyber Vision, a volleyball-analytics
                mobile app for a European sports-tech product. Prior 15 years
                as a federal economist. Open to founding-engineer and
                early-stage roles where breadth, ownership, and shipping matter
                more than specialization.
              </p>
            </div>

            <div className="bg-gray-100 border-2 border-black rounded-lg p-4 lg:col-span-2">
              <span className="font-mono font-semibold text-yellow-600">
                Technical skills:{" "}
              </span>
              <span className="text-gray-700">
                JavaScript, TypeScript, React, React Native (Expo), Next.js,
                Redux Toolkit, Tailwind, Python, Flask, FastAPI, Node.js,
                ExpressJS, REST API design, JWT auth, Postgres, Sequelize,
                schema migration, SQLite, SQL, MySQL, MongoDb, BullMQ, Redis,
                custom FIFO with cooperative cancellation, OpenAI, HuggingFace,
                sentence-transformers, Langflow, ffmpeg, YouTube API,
                Playwright scraping, Ubuntu, AWS, Linux Server, reverse proxy,
                GitHub, Kivy, Swift, HTML/CSS, Restful API,{" "}
                {"Host Web Applications"}, architecture, build, ops,
                stakeholders
              </span>
            </div>

            <div className="bg-gray-100 border-2 border-black rounded-lg p-4 lg:col-span-2">
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
                {job.descriptions.map((description, descriptionIndex) => (
                  <p key={descriptionIndex} className="text-gray-700">
                    {description}
                  </p>
                ))}
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

        <hr className="border-t-2 border-black my-8" />

        {/* Interests Section */}
        <div>
          <h2 className="text-2xl font-bold font-mono mb-6">Interests</h2>
          <p className="text-gray-700">Guitar, Reading, French</p>
        </div>
      </div>

      <ModalDisplayPicture
        isOpen={isHeadshotModalOpen}
        onClose={() => setIsHeadshotModalOpen(false)}
        src={headshotFullSrc}
        alt="Nick Rodriguez headshot"
        imageClassName="rounded-2xl"
        containerClassName="w-[90vmin] h-[90vmin]"
      />
    </section>
  );
}
