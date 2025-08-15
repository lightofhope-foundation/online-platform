"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { CircularProgress } from "@/components/CircularProgress";
import AppShell from "@/components/AppShell";

type Course = { id: string; title: string; slug: string };
type Profile = { role: "admin" | "therapist" | "patient" };

export default function CoursesPage() {
  const supabase = getSupabaseBrowserClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [role, setRole] = useState<Profile["role"] | null>(null);
  const { courseProgress, loading: progressLoading } = useVideoProgress();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: me } = await supabase.auth.getUser();
      if (me?.user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", me.user.id).single();
        if (!cancelled && prof) setRole(prof.role as Profile["role"]);
      }
      const { data } = await supabase.from("courses").select("id,title,slug").eq("published", true).is("deleted_at", null).order("title", { ascending: true });
      if (!cancelled && data) setCourses(data as Course[]);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const getCourseProgress = (courseId: string) => {
    return courseProgress.get(courseId);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Kurse
          </h1>
        </div>

        {/* Content */}
        {courses.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#63eca9] mb-4"></div>
              <p className="text-white/70 text-lg">Lade Kurse...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => {
              const progress = getCourseProgress(c.id);
              const videoProgress = progress ? Math.round((progress.completedVideos / progress.totalVideos) * 100) : 0;
              const hasWorkbooks = progress && progress.totalWorkbooks > 0;
              const workbookCompleted = progress && progress.completedWorkbooks === progress.totalWorkbooks;

              return (
                <Link key={c.id} href={`/courses/${c.slug}`} className="group">
                  <div className="rounded-[16px] border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.06] transition-all hover:scale-105">
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-lg font-semibold text-white">{c.title}</div>
                      {!progressLoading && progress && (
                        <CircularProgress 
                          progress={videoProgress} 
                          size={50} 
                          strokeWidth={3}
                          showPercentage={false}
                        />
                      )}
                    </div>

                    {/* Progress Info */}
                    {!progressLoading && progress && (
                      <div className="space-y-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-[#63eca9] mb-1">
                            {videoProgress}%
                          </div>
                          <div className="text-sm text-white/70">
                            {progress.completedVideos} von {progress.totalVideos} Videos abgeschlossen
                          </div>
                        </div>

                        {/* Workbook Status */}
                        {hasWorkbooks && (
                          <div className="text-center p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                            <div className="text-sm text-white/70 mb-1">
                              {workbookCompleted ? "✅ Workbook abgeschlossen" : "📝 Workbook muss noch abgeschlossen werden"}
                            </div>
                            {!workbookCompleted && (
                              <div className="text-xs text-white/50">
                                {progress.completedWorkbooks} von {progress.totalWorkbooks} Workbooks
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin View */}
                    {role === "admin" && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <div className="text-xs text-white/60">Admin-Ansicht: Klicke zum Verwalten von Videos</div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}


