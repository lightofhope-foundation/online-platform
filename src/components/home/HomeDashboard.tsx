"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardOverallProgress } from "@/components/dashboard/DashboardOverallProgress";
import { DashboardQuickTile } from "@/components/dashboard/DashboardQuickTile";
import { VideoThumbnailPreview } from "@/components/dashboard/VideoThumbnailPreview";
import { GlassPanel } from "@/components/layout/GlassPanel";
import { VideosIcon, RecordingsIcon, TherapyIcon } from "@/components/icons/Icons";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import type { CourseProgress } from "@/hooks/useVideoProgress";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  courseDetailPath,
  fetchPrimaryPublishedCourse,
} from "@/lib/primaryCourse";
import {
  formatPlaybackTimestamp,
  getRemainingSeconds,
} from "@/lib/formatPlaybackTime";

export function HomeDashboard() {
  const supabase = getSupabaseBrowserClient();
  const { courseProgress, loading, getOverallProgress, progress } =
    useVideoProgress();
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

      {continueWatching?.lastVideoId && (
        <GlassPanel className="mb-8 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Weiter schauen
          </h2>
          <GlassPanel className="flex items-center gap-4 p-4">
            <VideoThumbnailPreview
              bunnyVideoId={continueBunnyId}
              title={continueWatching.lastVideoTitle ?? "Video"}
              href={continueVideoId ? `/video/${continueVideoId}` : null}
              className="h-20 w-36 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/video/${continueVideoId}`}
                className="mb-1 block font-medium text-white transition-colors hover:text-[#63eca9]"
              >
                {continueWatching.lastVideoTitle}
              </Link>
              <p className="mb-2 text-sm text-white/60">
                Fortsetzen wo du aufgehört hast
                {continuePositionLabel ? ` bei ${continuePositionLabel}` : ""}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#63eca9] to-[#53e0b6] transition-all duration-300"
                  style={{
                    width: `${continueWatching.lastVideoProgress || 0}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-white/50">
                <span>
                  {continueWatching.lastVideoProgress || 0}% abgeschlossen
                  {continueRemainingLabel
                    ? ` · ${continueRemainingLabel} verbleibend`
                    : ""}
                </span>
              </div>
            </div>
            <Link
              href={`/video/${continueWatching.lastVideoId}`}
              className="rounded-full bg-[#63eca9] px-4 py-2 font-medium text-black transition-colors hover:bg-[#53e0b6]"
            >
              Fortsetzen
            </Link>
          </GlassPanel>
        </GlassPanel>
      )}

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardQuickTile
          title="Video-Section"
          subtitle="Zum Kurs"
          href={videoSectionHref}
          icon={<VideosIcon size={20} />}
        />
        <DashboardQuickTile
          title="Sitzungsaufnahmen"
          subtitle="Demnächst"
          href="/sitzungsaufnahmen"
          icon={<RecordingsIcon size={20} />}
        />
        <DashboardQuickTile
          title="Sitzungen"
          subtitle="Demnächst"
          href="/sitzungen"
          icon={<TherapyIcon size={20} />}
        />
      </div>
    </>
  );
}
