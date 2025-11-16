"use client";

import React, { useEffect, useMemo, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LockIcon from "@/components/LockIcon";
import AppShell from "@/components/AppShell";
import { useVideoProgress } from "@/hooks/useVideoProgress";

type VideoRow = {
  id: string;
  title: string;
  position: number;
  requires_workbook: boolean;
};

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CourseDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [course, setCourse] = useState<{ id: string; title: string; slug: string } | null>(null);
  const { getVideoProgress, refreshProgress } = useVideoProgress();

  // Load course data and progress
  const loadCourseData = async () => {
    let cancelled = false;
    (async () => {
      // Skip admin check for now to avoid profiles table error
      // const { data: me } = await supabase.auth.getUser();
      // if (me?.user) {
      //   const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", me.user.id).single();
      //   if (!cancelled && prof) {
      //     if (prof.role === "admin") setIsAdmin(true);
      //   }
      // }
      // Get course data first
      const { data: courseData } = await supabase.from("courses").select("id,title,slug").eq("slug", slug).is("deleted_at", null).single();
      if (cancelled || !courseData) return;
      setCourse(courseData);
      
      // Get chapters for this course
      const { data: chapterRows } = await supabase
        .from("chapters")
        .select("id")
        .eq("course_id", courseData.id);
      const chapterIds = (chapterRows || []).map((c: { id: string }) => c.id);
      
      // Get videos for these chapters
      const { data: vids } = await supabase
        .from("videos")
        .select("id,title,position,requires_workbook,chapter_id")
        .in("chapter_id", chapterIds)
        .is("deleted_at", null)
        .order("position", { ascending: true });
        
      if (!cancelled && vids) {
        setVideos(vids as VideoRow[]);
        
        // Check completion status for each video
        const completedIds = new Set<string>();
        vids.forEach(video => {
          const progress = getVideoProgress(video.id);
          if (progress && progress.completed_at) {
            completedIds.add(video.id);
          }
        });
        setCompletedVideoIds(completedIds);
      }
    })();
    return () => { cancelled = true; };
  };

  useEffect(() => {
    loadCourseData();
  }, [supabase, slug, getVideoProgress]);

  // Refresh when component mounts (user navigates back)
  useEffect(() => {
    const refreshData = async () => {
      await refreshProgress();
      setTimeout(() => {
        loadCourseData();
      }, 100);
    };
    refreshData();
  }, []);

  // Refresh when page becomes visible (user navigates back from video)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing progress...');
        refreshProgress();
        loadCourseData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshProgress]);

  // Calculate which videos are unlocked
  const getUnlockMap = () => {
    const unlockMap: Record<string, boolean> = {};
    let lastCompletedIndex = -1;
    
    // Find the last completed video
    videos.forEach((video, index) => {
      if (completedVideoIds.has(video.id)) {
        lastCompletedIndex = index;
      }
    });
    
    // Videos are unlocked if previous video is completed (N+1 unlocks if N is completed)
    videos.forEach((video, index) => {
      unlockMap[video.id] = index === 0 || index <= lastCompletedIndex + 1;
    });
    
    return unlockMap;
  };

  const unlockMap = getUnlockMap();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumbs */}
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

        {/* Course Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            {course?.title}
          </h1>
          {/* Course Progress */}
          <div className="mt-4 p-4 rounded-lg border border-white/10 bg-white/[0.02] max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">Kursfortschritt</span>
              <span className="text-white font-medium text-sm">
                {Math.round((completedVideoIds.size / videos.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#63eca9] to-[#53e0b6] h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedVideoIds.size / videos.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-white/50">
              <span>{completedVideoIds.size} von {videos.length} Videos abgeschlossen</span>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white">← Zurück</button>
        </div>
        <div className="space-y-3">
          {videos.map((v) => {
            const unlocked = unlockMap[v.id];
            const isCompleted = completedVideoIds.has(v.id);
            const progress = getVideoProgress(v.id);
            return (
              <div key={v.id} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  {!unlocked ? (
                    <span className="text-white/60" title="Dieses Video wird freigeschaltet, sobald das vorherige abgeschlossen ist."><LockIcon /></span>
                  ) : isCompleted ? (
                    <span className="text-[#63eca9]" title="Video abgeschlossen">✓</span>
                  ) : null}
                  <div>
                    <div className="font-medium">{v.title}</div>
                    {!unlocked ? (
                      <div className="text-xs text-white/60">Wird freigeschaltet, sobald das vorherige Video abgeschlossen ist.</div>
                    ) : isCompleted ? (
                      <div className="text-xs text-[#63eca9]">Abgeschlossen</div>
                    ) : progress ? (
                      <div className="text-xs text-white/60">{Math.round(progress.percent)}% abgeschlossen</div>
                    ) : null}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Link href={`/video/${v.id}`} className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]">Bearbeiten</Link>
                  </div>
                ) : unlocked ? (
                  <Link href={`/video/${v.id}`} className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]">
                    {isCompleted ? 'Wiederholen' : 'Öffnen'}
                  </Link>
                ) : (
                  <button className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/60 cursor-not-allowed" disabled>
                    Gesperrt
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}


