"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import AppShell from "@/components/AppShell";

export default function VideoPage(props: unknown) {
  const { params } = props as { params: { id: string } };
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
    <AppShell title={title || "Video"}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <section>
          <div className="aspect-video w-full rounded-lg bg-black/60 flex items-center justify-center text-white/60">
            {/* TODO Bunny player integration */}
            <span>{bunnyId ? `Video-Quelle bereit (${bunnyId})` : "Video-Player Platzhalter"}</span>
          </div>
        </section>
        <aside>
          <h2 className="text-lg font-semibold mb-3">Aufgaben</h2>
          {requiresWorkbook ? (
            <div className="text-white/80">Workbook wird hier angezeigt (MVP folgt).</div>
          ) : (
            <div className="text-white/60">Kein Workbook für dieses Video.</div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}


