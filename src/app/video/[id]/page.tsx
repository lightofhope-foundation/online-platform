"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import AppShell from "@/components/AppShell";
import Link from "next/link";

export default function VideoPage(props: unknown) {
  const { params } = props as { params: { id: string } };
  const { id } = params;
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [title, setTitle] = useState<string>("");
  const [bunnyId, setBunnyId] = useState<string | null>(null);
  const [requiresWorkbook, setRequiresWorkbook] = useState<boolean>(false);
  const [course, setCourse] = useState<{ title: string; slug: string } | null>(null);
  const [video, setVideo] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Placeholder: we will integrate Bunny player next step

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching video with ID:", id);
        
        const { data: v, error: videoError } = await supabase
          .from("videos")
          .select("title,bunny_video_id,requires_workbook,course_id")
          .eq("id", id)
          .single();
          
        if (videoError) {
          console.error("Video fetch error:", videoError);
          setError(`Video nicht gefunden: ${videoError.message}`);
          return;
        }
        
        if (!cancelled && v) {
          console.log("Video data:", v);
          setTitle(v.title || "Video");
          const idOrNull = v.bunny_video_id || null;
          setBunnyId(idOrNull);
          setRequiresWorkbook(!!v.requires_workbook);

          // Fetch course details
          if (v.course_id) {
            const { data: courseData, error: courseError } = await supabase
              .from("courses")
              .select("title,slug")
              .eq("id", v.course_id)
              .single();
              
            if (courseError) {
              console.error("Course fetch error:", courseError);
            } else if (courseData) {
              setCourse(courseData);
            }
          }

          setVideo({ title: v.title || "Video" });
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Ein unerwarteter Fehler ist aufgetreten");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, supabase]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#63eca9] mb-4"></div>
            <p className="text-white/70 text-lg">Lade Video...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <div className="text-red-400 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Video nicht verfügbar</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <Link href="/courses" className="inline-block rounded-full border border-[#63eca9] px-6 py-3 text-[#63eca9] hover:bg-[#63eca9]/10 transition-colors">
            Zurück zu den Kursen
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!bunnyId) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <div className="text-yellow-400 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Video nicht verknüpft</h2>
          <p className="text-white/70 mb-6">Dieses Video ist noch nicht mit Bunny verknüpft.</p>
          <Link href="/courses" className="inline-block rounded-full border border-[#63eca9] px-6 py-3 text-[#63eca9] hover:bg-[#63eca9]/10 transition-colors">
            Zurück zu den Kursen
          </Link>
        </div>
      </AppShell>
    );
  }

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
          <Link href={`/courses/${course?.slug || '#'}`} className="hover:text-white transition-colors">
            {course?.title || 'Kurs'}
          </Link>
          <span>/</span>
          <span className="text-white">{video?.title || 'Video'}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="aspect-video w-full rounded-lg bg-black/60 overflow-hidden">
              <iframe 
                src={`https://iframe.mediadelivery.net/embed/423953/${bunnyId}?autoplay=false&loop=false&muted=false&preload=false&responsive=true`}
                loading="lazy"
                style={{ border: 0, position: 'absolute', top: 0, height: '100%', width: '100%' }}
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen={true}
                className="w-full h-full"
              />
            </div>
          </div>
          <aside>
            <h2 className="text-lg font-semibold mb-3">Aufgaben</h2>
            {requiresWorkbook ? (
              <div className="text-white/80">Workbook wird hier angezeigt (MVP folgt).</div>
            ) : (
              <div className="text-white/60">Kein Workbook für dieses Video.</div>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}


