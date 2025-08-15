"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LockIcon from "@/components/LockIcon";
import AppShell from "@/components/AppShell";

type VideoRow = {
  id: string;
  title: string;
  position: number;
  requires_workbook: boolean;
};

export default function CourseDetailPage(props: unknown) {
  const { params } = props as { params: { slug: string } };
  const { slug } = params;
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [course, setCourse] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: me } = await supabase.auth.getUser();
      if (me?.user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("user_id", me.user.id).single();
        if (prof?.role === "admin") setIsAdmin(true);
      }
      const { data: courseData } = await supabase.from("courses").select("id,title,slug").eq("slug", slug).is("deleted_at", null).single();
      if (cancelled || !courseData) return;
      setCourse(courseData);
      const { data: chapterRows } = await supabase
        .from("chapters")
        .select("id")
        .eq("course_id", courseData.id);
      const chapterIds = (chapterRows || []).map((c: { id: string }) => c.id);
      const { data: vids } = await supabase
        .from("videos")
        .select("id,title,position,requires_workbook,chapter_id")
        .in("chapter_id", chapterIds)
        .is("deleted_at", null)
        .order("position", { ascending: true });
      if (!cancelled && vids) setVideos((vids as { id: string; title: string; position: number; requires_workbook: boolean }[]).map(v => ({ id: v.id, title: v.title, position: v.position, requires_workbook: v.requires_workbook })) as VideoRow[]);

      const { data: progress } = await supabase
        .from("video_progress")
        .select("video_id,percent,completed_at")
        .in("video_id", (vids || []).map((v: { id: string }) => v.id));
      if (!cancelled && progress) setCompletedVideoIds(new Set(progress.filter(p => p.completed_at != null || Number(p.percent) >= 95).map(p => p.video_id)));
    })();
    return () => { cancelled = true; };
  }, [slug, supabase]);

  const unlockMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    let previousCompleted = true;
    const ordered = [...videos].sort((a, b) => a.position - b.position);
    for (const v of ordered) {
      const done = completedVideoIds.has(v.id);
      map[v.id] = previousCompleted;
      previousCompleted = done;
    }
    return map;
  }, [videos, completedVideoIds]);

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
        </div>
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white">← Zurück</button>
        </div>
        <div className="space-y-3">
          {videos.map((v) => {
            const unlocked = unlockMap[v.id];
            return (
              <div key={v.id} className="flex items-center justify-between rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  {!unlocked ? (
                    <span className="text-white/60" title="Dieses Video wird freigeschaltet, sobald das vorherige abgeschlossen ist."><LockIcon /></span>
                  ) : null}
                  <div>
                    <div className="font-medium">{v.title}</div>
                    {!unlocked ? (
                      <div className="text-xs text-white/60">Wird freigeschaltet, sobald das vorherige Video abgeschlossen ist.</div>
                    ) : null}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <Link href={`/video/${v.id}`} className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]">Bearbeiten</Link>
                  </div>
                ) : unlocked ? (
                  <Link href={`/video/${v.id}`} className="rounded-full border border-white/10 px-3 py-2 text-sm hover:bg-white/[0.08]">Öffnen</Link>
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


