"use client";

import React, { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LockIcon from "@/components/LockIcon";
import AppShell from "@/components/AppShell";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoUnlockSchedule } from "@/hooks/useVideoUnlockSchedule";
import { PreviousVideoStatusBadge } from "@/components/PreviousVideoStatusBadge";
import {
  canWatchVideo,
  getPreviousVideoStatus,
  getUnlockedSinceMessage,
  getVideoAccessState,
  type VideoProgressRow,
} from "@/lib/videoUnlock";
import { sortVideosByChapterOrder } from "@/lib/courseContentOrder";

type ChapterRow = {
  id: string;
  title: string;
  position: number;
};

type VideoRow = {
  id: string;
  title: string;
  position: number;
  requires_workbook: boolean;
  chapter_id: string;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [isAdmin] = useState<boolean>(false);
  const [course, setCourse] = useState<{ id: string; title: string; slug: string } | null>(null);
  const { getVideoProgress, refreshProgress, progress, loading: progressLoading } =
    useVideoProgress();
  const { unlockByVideoId, loading: unlockLoading, refreshUnlocks } =
    useVideoUnlockSchedule();

  const progressByVideoId = useMemo(() => {
    const map = new Map<string, VideoProgressRow>();
    progress.forEach((p, videoId) => {
      map.set(videoId, {
        video_id: videoId,
        percent: p.percent,
        completed_at: p.completed_at,
      });
    });
    return map;
  }, [progress]);

  const loadCourseData = async () => {
    const { data: courseData } = await supabase
      .from("courses")
      .select("id,title,slug")
      .eq("slug", slug)
      .eq("published", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (!courseData) {
      router.replace("/courses");
      return;
    }
    setCourse(courseData);

    const { data: chapterRows } = await supabase
      .from("chapters")
      .select("id, title, position")
      .eq("course_id", courseData.id)
      .is("deleted_at", null)
      .order("position", { ascending: true });

    const chapterList = (chapterRows ?? []) as ChapterRow[];
    setChapters(chapterList);

    const chapterIds = chapterList.map((c) => c.id);
    if (chapterIds.length === 0) {
      setVideos([]);
      return;
    }

    const { data: vids } = await supabase
      .from("videos")
      .select("id,title,position,requires_workbook,chapter_id")
      .in("chapter_id", chapterIds)
      .is("deleted_at", null);

    if (vids) {
      setVideos(
        sortVideosByChapterOrder(chapterList, vids as VideoRow[])
      );
    }
  };

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const refreshData = async () => {
      await Promise.all([refreshProgress(), refreshUnlocks()]);
      await loadCourseData();
    };
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProgress();
        refreshUnlocks();
        loadCourseData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedCount = videos.filter((v) => {
    const p = progressByVideoId.get(v.id);
    return p?.completed_at != null;
  }).length;

  const orderedVideos = videos.map((v) => ({ id: v.id, position: v.position }));
  const titleByVideoId = useMemo(
    () => new Map(videos.map((v) => [v.id, v.title])),
    [videos]
  );
  const listLoading = progressLoading || unlockLoading;

  return (
    <AppShell>
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">
            Startseite
          </Link>
          <span>/</span>
          <Link href="/courses" className="hover:text-white transition-colors">
            Kurse
          </Link>
          <span>/</span>
          <span className="text-white">{course?.title}</span>
        </nav>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">{course?.title}</h1>
          <div className="mt-4 p-4 rounded-lg border border-white/10 bg-white/[0.02] max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Kursfortschritt</span>
              <span className="text-white font-medium text-sm">
                {videos.length > 0
                  ? Math.round((completedCount / videos.length) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#63eca9] to-[#53e0b6] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    videos.length > 0 ? (completedCount / videos.length) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/50">
              <span>
                {completedCount} von {videos.length} Videos abgeschlossen
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white">
            ← Zurück
          </button>
        </div>

        <div className="space-y-8">
          {chapters.map((chapter) => {
            const chapterVideos = videos.filter((v) => v.chapter_id === chapter.id);
            if (chapterVideos.length === 0) return null;

            return (
              <section key={chapter.id} className="space-y-3">
                <h2 className="border-b border-white/10 pb-2 text-lg font-semibold text-white">
                  Kapitel {chapter.position}: {chapter.title}
                </h2>
                {chapterVideos.map((v) => {
                  const index = videos.findIndex((row) => row.id === v.id);
                  const access = getVideoAccessState(
                    index,
                    v.id,
                    orderedVideos,
                    progressByVideoId,
                    unlockByVideoId
                  );
                  const canOpen =
                    !listLoading &&
                    canWatchVideo(
                      index,
                      v.id,
                      orderedVideos,
                      progressByVideoId,
                      unlockByVideoId
                    );
                  const progressRow = getVideoProgress(v.id);
                  const isCompleted = access.status === "completed";
                  const isLocked = !canOpen && !isCompleted;
                  const prevStatus = isLocked
                    ? getPreviousVideoStatus(
                        index,
                        orderedVideos,
                        progressByVideoId,
                        titleByVideoId
                      )
                    : null;
                  const unlockedSince =
                    canOpen && !isCompleted
                      ? getUnlockedSinceMessage(v.id, unlockByVideoId)
                      : null;

                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center gap-3">
                        {isLocked ? (
                          <span className="text-white/60">
                            <LockIcon />
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[#63eca9]" title="Video abgeschlossen">
                            ✓
                          </span>
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{v.title}</div>
                          {access.status === "locked_schedule" ? (
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                              <span className="text-xs text-white/60">{access.message}</span>
                              {prevStatus && (
                                <PreviousVideoStatusBadge
                                  previousTitle={prevStatus.previousTitle}
                                  completed={prevStatus.completed}
                                />
                              )}
                            </div>
                          ) : access.status === "locked_sequence" ? (
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                              <span className="text-xs text-white/60">{access.message}</span>
                              {prevStatus && (
                                <PreviousVideoStatusBadge
                                  previousTitle={prevStatus.previousTitle}
                                  completed={prevStatus.completed}
                                />
                              )}
                            </div>
                          ) : isCompleted ? (
                            <div className="text-xs text-[#63eca9]">Abgeschlossen</div>
                          ) : unlockedSince ? (
                            <div className="text-xs text-[#63eca9]">{unlockedSince}</div>
                          ) : progressRow && progressRow.percent > 0 ? (
                            <div className="text-xs text-white/60">
                              {Math.round(progressRow.percent)}% abgeschlossen
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {isAdmin ? (
                        <Link
                          href={`/video/${v.id}`}
                          className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]"
                        >
                          Bearbeiten
                        </Link>
                      ) : canOpen ? (
                        <Link
                          href={`/video/${v.id}`}
                          className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]"
                        >
                          {isCompleted ? "Wiederholen" : "Öffnen"}
                        </Link>
                      ) : (
                        <button
                          className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/60 cursor-not-allowed"
                          disabled
                        >
                          Gesperrt
                        </button>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
