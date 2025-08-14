"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import LockIcon from "@/components/LockIcon";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: course } = await supabase.from("courses").select("id").eq("slug", slug).is("deleted_at", null).single();
      if (cancelled || !course) return;
      const { data: vids } = await supabase
        .from("videos")
        .select("id,title,position,requires_workbook,chapters(course_id)")
        .eq("chapters.course_id", course.id)
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
    <main className="relative z-10 min-h-screen text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-white/70 hover:text-white">← Zurück</button>
        </div>
        <h1 className="text-3xl font-bold mb-6">Kurs</h1>
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
                {unlocked ? (
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
    </main>
  );
}


