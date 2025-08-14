"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type Params = { params: { id: string } };

export default function VideoPage({ params }: Params) {
  const { id } = params;
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [title, setTitle] = useState<string>("");
  const [bunnyId, setBunnyId] = useState<string | null>(null);
  const [requiresWorkbook, setRequiresWorkbook] = useState<boolean>(false);

  // Placeholder: we will integrate Bunny player next step

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: v } = await supabase
        .from("videos")
        .select("title,bunny_video_id,requires_workbook")
        .eq("id", id)
        .single();
      if (!cancelled && v) {
        setTitle(v.title || "Video");
        const idOrNull = v.bunny_video_id || null;
        setBunnyId(idOrNull);
        setRequiresWorkbook(!!v.requires_workbook);
      }
    })();
    return () => { cancelled = true; };
  }, [id, supabase]);

  return (
    <main className="relative z-10 min-h-screen text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <section className="rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3">
            <button onClick={() => router.back()} className="text-white/70 hover:text-white">← Zurück</button>
          </div>
          <h1 className="text-2xl font-semibold mb-4">{title}</h1>
          <div className="aspect-video w-full rounded-lg bg-black/60 flex items-center justify-center text-white/60">
            {/* TODO Bunny player integration */}
            <span>Video-Player Platzhalter</span>
          </div>
        </section>
        <aside className="rounded-[16px] border border-white/10 bg-white/[0.02] p-4">
          <h2 className="text-lg font-semibold mb-3">Aufgaben</h2>
          {requiresWorkbook ? (
            <div className="text-white/80">Workbook wird hier angezeigt (MVP folgt).</div>
          ) : (
            <div className="text-white/60">Kein Workbook für dieses Video.</div>
          )}
        </aside>
      </div>
    </main>
  );
}


