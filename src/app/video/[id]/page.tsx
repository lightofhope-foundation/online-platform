"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import AppShell from "@/components/AppShell";
import Link from "next/link";

export default function VideoPage(props: unknown) {
  const { params } = props as { params: { id: string } };
  const { id } = params;
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { updateProgress, getVideoProgress } = useVideoProgress();
  const [title, setTitle] = useState<string>("");
  const [bunnyId, setBunnyId] = useState<string | null>(null);
  const [requiresWorkbook, setRequiresWorkbook] = useState<boolean>(false);
  const [course, setCourse] = useState<{ title: string; slug: string } | null>(null);
  const [video, setVideo] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Get existing progress
  const existingProgress = getVideoProgress(id);

  // Update progress periodically
  useEffect(() => {
    if (!bunnyId || !duration) return;

    const interval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        const percent = (currentTime / duration) * 100;
        setCurrentProgress(percent);
        
        // Update progress every 5 seconds or when significant change
        if (Math.abs(percent - (existingProgress?.percent || 0)) > 5) {
          updateProgress(id, currentTime, percent, percent >= 90);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bunnyId, currentTime, duration, id, updateProgress, existingProgress]);

  // Handle iframe message for progress
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://iframe.mediadelivery.net') return;
      
      try {
        const data = event.data;
        if (data.type === 'video-progress') {
          setCurrentTime(data.currentTime || 0);
          setDuration(data.duration || 0);
        }
      } catch (error) {
        console.warn('Error parsing iframe message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize progress on mount
  useEffect(() => {
    if (existingProgress) {
      setCurrentProgress(existingProgress.percent);
      setCurrentTime(existingProgress.last_second);
    }
  }, [existingProgress]);

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
          .select("title,bunny_video_id,requires_workbook,chapter_id")
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

          // Fetch course details via chapter
          if (v.chapter_id) {
            const { data: chapterData, error: chapterError } = await supabase
              .from("chapters")
              .select("course_id")
              .eq("id", v.chapter_id)
              .single();
              
            if (chapterError) {
              console.error("Chapter fetch error:", chapterError);
            } else if (chapterData && chapterData.course_id) {
              const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("title,slug")
                .eq("id", chapterData.course_id)
                .single();
                
              if (courseError) {
                console.error("Course fetch error:", courseError);
              } else if (courseData) {
                setCourse({
                  title: courseData.title,
                  slug: courseData.slug
                });
              }
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
            <div className="aspect-video w-full rounded-lg bg-black/60 overflow-hidden relative">
              <iframe 
                src={`https://iframe.mediadelivery.net/embed/423953/${bunnyId}?autoplay=false&loop=false&muted=false&preload=false&responsive=true`}
                loading="lazy"
                className="w-full h-full absolute inset-0"
                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                allowFullScreen={true}
              />
            </div>

            {/* Progress Display */}
            {existingProgress && (
              <div className="mt-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Fortschritt</span>
                  <span className="text-white font-medium text-sm">
                    {Math.round(currentProgress)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#63eca9] to-[#53e0b6] h-full rounded-full transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-white/50">
                  <span>Letzte Position: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                  {existingProgress.completed_at && (
                    <span className="text-[#63eca9]">✅ Abgeschlossen</span>
                  )}
                </div>
              </div>
            )}
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


