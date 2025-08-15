"use client";

import React from "react";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import { MobileNav } from "@/components/MobileNav";
import { FabSettings } from "@/components/FabSettings";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { ProgressBar } from "@/components/ProgressBar";
import type { CourseProgress } from "@/hooks/useVideoProgress";
import {
  HomeIcon,
  VideosIcon,
  RecordingsIcon,
  SelbstcheckIcon,
  FeedbackIcon,
  TherapyIcon,
  SettingsIcon,
  LogoutIcon,
  PlayIcon,
} from "@/components/icons/Icons";
import { LogoutButton } from "@/components/LogoutButton";

export default function Home() {
  const { courseProgress, loading, getOverallProgress } = useVideoProgress();
  const overallProgress = getOverallProgress();

  // Find the course with the most recent video progress
  let continueWatching: CourseProgress | null = null;
  if (courseProgress.size > 0) {
    let highestProgress = 0;
    courseProgress.forEach(course => {
      if (course.lastVideoId && course.lastVideoProgress !== null && course.lastVideoProgress > highestProgress) {
        highestProgress = course.lastVideoProgress;
        continueWatching = course;
      }
    });
  }

  return (
    <>
      {/* Full page light rays background */}
      <div className="page-light-rays">
        <LightRays raysColor="#63eca9" />
      </div>

      <FabSettings />
      <MobileNav />

      {/* Main content */}
      <main className="relative z-10 min-h-screen text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="sticky top-6 self-start rounded-[24px] border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hidden lg:block">
              <nav className="space-y-4 text-white/90">
                {[
                  { name: "Startseite", href: "/", icon: <HomeIcon size={18} /> },
                  { name: "Video-Section", href: "/courses", icon: <VideosIcon size={18} /> },
                  { name: "Sitzungsaufnahmen", href: "#", icon: <RecordingsIcon size={18} /> },
                  { name: "Selbstcheck", href: "#", icon: <SelbstcheckIcon size={18} /> },
                  { name: "Feedback", href: "#", icon: <FeedbackIcon size={18} /> },
                  { name: "1:1 Therapie", href: "#", icon: <TherapyIcon size={18} /> },
                  { name: "Einstellungen", href: "#", icon: <SettingsIcon size={18} /> },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-sm transition-all hover:bg-white/[0.08] hover:border-[#63eca9]/50 hover:shadow-[0_0_20px_rgba(99,236,169,0.3)] ${
                      idx === 0 ? "bg-gradient-to-r from-[#63eca9]/20 to-[#63eca9]/20 border-[#63eca9]/50 shadow-[0_0_20px_rgba(99,236,169,0.4)]" : ""
                    }`}
                  >
                    <span className="text-white">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                ))}
                <LogoutButton className="w-full">
                  <span className="text-white"><LogoutIcon size={18} /></span>
                  <span>Ausloggen</span>
                </LogoutButton>
              </nav>
            </aside>

            {/* Page Content */}
            <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
              {/* Page Title */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#63eca9]">
                  Startseite
                </h1>
              </div>

              {/* Overall Progress */}
              {!loading && (
                <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h2 className="text-xl font-semibold mb-4 text-white">Gesamtfortschritt</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70">Videos</span>
                        <span className="text-white font-medium">
                          {overallProgress.completedVideos} / {overallProgress.totalVideos}
                        </span>
                      </div>
                      <ProgressBar progress={overallProgress.videoProgress} size="lg" />
                    </div>
                    {overallProgress.totalWorkbooks > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/70">Workbooks</span>
                          <span className="text-white font-medium">
                            {overallProgress.completedWorkbooks} / {overallProgress.totalWorkbooks}
                          </span>
                        </div>
                        <ProgressBar progress={overallProgress.workbookProgress} size="lg" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Continue Watching */}
              {continueWatching && (continueWatching as CourseProgress).lastVideoId && (
                <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h2 className="text-xl font-semibold mb-4 text-white">Weiter schauen</h2>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#63eca9] to-[#53e0b6] flex items-center justify-center">
                      <PlayIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{(continueWatching as CourseProgress).lastVideoTitle}</h3>
                      <p className="text-white/60 text-sm mb-2">Fortsetzen wo du aufgehört hast</p>
                      <ProgressBar 
                        progress={(continueWatching as CourseProgress).lastVideoProgress || 0} 
                        size="sm" 
                        showPercentage 
                      />
                    </div>
                    <Link
                      href={`/video/${(continueWatching as CourseProgress).lastVideoId}`}
                      className="px-4 py-2 rounded-full bg-[#63eca9] text-black font-medium hover:bg-[#53e0b6] transition-colors"
                    >
                      Fortsetzen
                    </Link>
                  </div>
                </div>
              )}

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[
                  { title: "Insights", subtitle: "Analytics", icon: "📊", color: "from-blue-500 to-cyan-500" },
                  { title: "Overview", subtitle: "Dashboard", icon: "🎯", color: "from-purple-500 to-pink-500" },
                  { title: "Teamwork", subtitle: "Collaboration", icon: "🤝", color: "from-green-500 to-emerald-500" },
                  { title: "Efficiency", subtitle: "Automation", icon: "⚡", color: "from-yellow-500 to-orange-500" },
                  { title: "Connectivity", subtitle: "Integration", icon: "🔗", color: "from-indigo-500 to-purple-500" },
                  { title: "Protection", subtitle: "Security", icon: "🛡️", color: "from-red-500 to-pink-500" },
                ].map((card, i) => (
                  <div key={i} className="group relative rounded-[20px] border border-white/10 bg-black/60 p-6 min-h-48 transition-all hover:scale-105 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(164,69,255,0.3)]">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-2xl">{card.icon}</div>
                      <div className="h-2 w-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-60"></div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                    <p className="text-white/60 text-sm">{card.subtitle}</p>
                    <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${card.color}"></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
