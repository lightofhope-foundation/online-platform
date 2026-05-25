"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import LightRays from "@/components/LightRays";
import { MobileNav } from "@/components/MobileNav";
import { FabSettings } from "@/components/FabSettings";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardOverallProgress } from "@/components/dashboard/DashboardOverallProgress";
import { DashboardQuickTile } from "@/components/dashboard/DashboardQuickTile";
import { VideoThumbnailPreview } from "@/components/dashboard/VideoThumbnailPreview";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import type { CourseProgress } from "@/hooks/useVideoProgress";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  courseDetailPath,
  fetchPrimaryPublishedCourse,
} from "@/lib/primaryCourse";
import {
  HomeIcon,
  VideosIcon,
  RecordingsIcon,
  SelbstcheckIcon,
  FeedbackIcon,
  TherapyIcon,
  SettingsIcon,
  LogoutIcon,
} from "@/components/icons/Icons";
import { LogoutButton } from "@/components/LogoutButton";
import {
  formatPlaybackTimestamp,
  getRemainingSeconds,
} from "@/lib/formatPlaybackTime";

export default function Home() {
  const supabase = getSupabaseBrowserClient();
  const { courseProgress, loading, getOverallProgress, progress } = useVideoProgress();
  const overallProgress = getOverallProgress();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [videoSectionHref, setVideoSectionHref] = useState("/courses");
  const [continueBunnyId, setContinueBunnyId] = useState<string | null>(null);
  const [continueDurationSeconds, setContinueDurationSeconds] = useState<
    number | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled && profile?.first_name) {
        setFirstName(profile.first_name);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      let preferredCourseId: string | null = null;
      let mostRecent = 0;
      courseProgress.forEach((course) => {
        if (!course.lastVideoId) return;
        const videoProgress = progress.get(course.lastVideoId);
        if (videoProgress?.updated_at) {
          const t = new Date(videoProgress.updated_at).getTime();
          if (t > mostRecent) {
            mostRecent = t;
            preferredCourseId = course.courseId;
          }
        }
      });

      const primary = await fetchPrimaryPublishedCourse(
        supabase,
        preferredCourseId
      );
      if (!cancelled && primary?.slug) {
        setVideoSectionHref(courseDetailPath(primary.slug));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, supabase, courseProgress, progress]);

  let continueWatching: CourseProgress | null = null;
  let mostRecentContinueTime = 0;
  for (const course of courseProgress.values()) {
    if (!course.lastVideoId || course.lastVideoProgress === null) continue;
    const videoProgress = progress.get(course.lastVideoId);
    if (!videoProgress?.updated_at) continue;
    const updatedTime = new Date(videoProgress.updated_at).getTime();
    if (updatedTime > mostRecentContinueTime) {
      mostRecentContinueTime = updatedTime;
      continueWatching = course;
    }
  }

  const continueVideoId = continueWatching?.lastVideoId ?? null;
  const continueVideoProgress = continueVideoId
    ? progress.get(continueVideoId)
    : null;
  const continueLastSecond = continueVideoProgress?.last_second ?? 0;
  const continuePercent = continueWatching?.lastVideoProgress ?? 0;
  const continuePositionLabel =
    continueLastSecond > 0
      ? formatPlaybackTimestamp(continueLastSecond)
      : null;
  const continueRemainingSeconds = getRemainingSeconds(
    continueLastSecond,
    continuePercent,
    continueDurationSeconds
  );
  const continueRemainingLabel =
    continueRemainingSeconds != null
      ? formatPlaybackTimestamp(continueRemainingSeconds)
      : null;

  useEffect(() => {
    if (!continueVideoId) {
      setContinueBunnyId(null);
      setContinueDurationSeconds(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("videos")
        .select("bunny_video_id, duration_seconds")
        .eq("id", continueVideoId)
        .maybeSingle();
      if (!cancelled) {
        setContinueBunnyId(data?.bunny_video_id ?? null);
        setContinueDurationSeconds(data?.duration_seconds ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continueVideoId, supabase]);

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
                  { name: "Einstellungen", href: "/settings", icon: <SettingsIcon size={18} /> },
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
              <DashboardGreeting firstName={firstName} />

              {!loading && (
                <DashboardOverallProgress
                  videoProgress={overallProgress.videoProgress}
                  completedVideos={overallProgress.completedVideos}
                  totalVideos={overallProgress.totalVideos}
                  workbookProgress={overallProgress.workbookProgress}
                  completedWorkbooks={overallProgress.completedWorkbooks}
                  totalWorkbooks={overallProgress.totalWorkbooks}
                />
              )}

              {/* Continue Watching */}
              {continueWatching?.lastVideoId && (
                <div className="mb-8 p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <h2 className="text-xl font-semibold mb-4 text-white">Weiter schauen</h2>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <VideoThumbnailPreview
                      bunnyVideoId={continueBunnyId}
                      title={continueWatching.lastVideoTitle ?? "Video"}
                      href={continueVideoId ? `/video/${continueVideoId}` : null}
                      className="h-20 w-36 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/video/${continueVideoId}`}
                        className="font-medium text-white mb-1 block hover:text-[#63eca9] transition-colors"
                      >
                        {continueWatching.lastVideoTitle}
                      </Link>
                      <p className="text-white/60 text-sm mb-2">
                        Fortsetzen wo du aufgehört hast
                        {continuePositionLabel ? ` bei ${continuePositionLabel}` : ""}
                      </p>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#63eca9] to-[#53e0b6] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${continueWatching.lastVideoProgress || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-white/50">
                        <span>
                          {continueWatching.lastVideoProgress || 0}%
                          {" "}
                          abgeschlossen
                          {continueRemainingLabel
                            ? ` · ${continueRemainingLabel} verbleibend`
                            : ""}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/video/${continueWatching.lastVideoId}`}
                      className="px-4 py-2 rounded-full bg-[#63eca9] text-black font-medium hover:bg-[#53e0b6] transition-colors"
                    >
                      Fortsetzen
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 lg:max-w-none">
                <DashboardQuickTile
                  title="Video-Section"
                  subtitle="Zum Kurs"
                  href={videoSectionHref}
                  icon={<VideosIcon size={20} />}
                />
                <DashboardQuickTile
                  title="Sitzungsaufnahmen"
                  subtitle="Demnächst"
                  icon={<RecordingsIcon size={20} />}
                />
                <DashboardQuickTile
                  title="Selbstcheck"
                  subtitle="Demnächst"
                  icon={<SelbstcheckIcon size={20} />}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
