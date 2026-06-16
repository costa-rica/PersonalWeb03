"use client";

import { useEffect, useState } from "react";
import Navigation from "./Navigation";
import Image from "next/image";
import ModalDisplayPicture from "./ModalDisplayPicture";

interface UpToLately {
  text: string;
  datetime_summary: string;
}

interface TogglEntry {
  project_name: string;
  total_hours: number;
}

export default function HeroSection() {
  // Check if hours table should be displayed (from env variable)
  const shouldDisplayHours = process.env.NEXT_PUBLIC_DISPLAY_HOURS_SPENT === 'true';

  const [upToLately, setUpToLately] = useState<UpToLately | null>(null);
  const [togglTable, setTogglTable] = useState<TogglEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${baseUrl}/hero-section/data`);

        if (!response.ok) {
          throw new Error(`Failed to fetch hero data: ${response.status}`);
        }

        const data = await response.json();
        setUpToLately(data.up_to_lately);
        setTogglTable(data.toggl_table || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
        console.error("Error fetching hero section data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  return (
    <section className="min-h-screen lg:h-screen flex flex-col border-2 border-black rounded-3xl overflow-hidden bg-white">
      <Navigation />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Text content */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-1">
          <div className="space-y-8">
            {/* Intro */}
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold text-black">
                hi, I&apos;m <span className="font-mono">Nick</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-700">
                a problem solver and engineer
              </p>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4 order-3 lg:order-2">
              <h2 className="text-lg font-mono text-gray-800">
                What I&apos;ve been up to lately
              </h2>

              {/* Up to Lately Text Section */}
              {loading && (
                <div className="flex items-center gap-2 text-gray-600 font-mono text-sm">
                  <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading latest updates...</span>
                </div>
              )}

              {error && (
                <div className="p-4 border-2 border-red-500 rounded-2xl bg-red-50">
                  <p className="text-sm text-red-700 font-mono">{error}</p>
                </div>
              )}

              {!loading && !error && upToLately && (
                <div className="p-4 border-2 border-black rounded-2xl bg-gray-50">
                  <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                    {upToLately.text.split('\n').map((line, index) => {
                      if (line.trim().startsWith('- ')) {
                        return (
                          <ul key={index} className="list-disc list-inside">
                            <li className="text-gray-800">
                              {line.trim().substring(2)}
                            </li>
                          </ul>
                        );
                      } else if (line.trim()) {
                        return (
                          <p key={index} className="text-gray-800">
                            {line}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {!loading && !error && shouldDisplayHours && togglTable.length > 0 && upToLately && (
                <div className="border-2 border-black rounded-2xl overflow-hidden bg-gray-50">
                  <table className="w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-100">
                        <th className="text-left p-3 font-bold">project</th>
                        <th className="text-left p-3 font-bold">hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {togglTable.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-300 last:border-0"
                        >
                          <td className="p-3">{item.project_name}</td>
                          <td className="p-3 text-gray-600">
                            {item.total_hours.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Last Updated Date */}
              {!loading && !error && upToLately && (
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-mono">
                    (updated {upToLately.datetime_summary.split(" ")[0]})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Photo */}
        <div 
          className="w-3/5 mx-auto mb-8 rounded-2xl overflow-hidden aspect-[4/3] lg:w-auto lg:mx-0 lg:mb-0 lg:flex-1 lg:aspect-auto lg:h-auto relative lg:border-l-2 border-black order-2 lg:order-2 cursor-pointer transition-opacity hover:opacity-95"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src="/montmartre2021.jpg"
            alt="Nick's portrait"
            fill
            className="object-cover rounded-2xl"
            priority
          />
        </div>
      </div>
      
      <ModalDisplayPicture 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        src="/montmartre2021.jpg" 
        alt="Nick's portrait" 
      />
    </section>
  );
}
