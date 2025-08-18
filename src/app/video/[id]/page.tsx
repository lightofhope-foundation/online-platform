"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import AppShell from "@/components/AppShell";
import Link from "next/link";

export default function VideoPage(props: unknown) {
  const { params } = props as { params: { id: string } };
  const { id } = params;
  const supabase = getSupabaseBrowserClient();
  const { updateProgress, getVideoProgress } = useVideoProgress();
  const [bunnyId, setBunnyId] = useState<string | null>(null);
  const [requiresWorkbook, setRequiresWorkbook] = useState<boolean>(false);
  const [course, setCourse] = useState<{ title: string; slug: string } | null>(null);
  const [video, setVideo] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get existing progress
  const existingProgress = getVideoProgress(id);

  // Manual progress tracking
  useEffect(() => {
    if (!bunnyId || !duration) return;

    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = Math.min(prev + 1, duration);
          const percent = (newTime / duration) * 100;
          setCurrentProgress(percent);
          
          // Update progress every 10 seconds or when significant change
          if (Math.abs(percent - (existingProgress?.percent || 0)) > 10) {
            updateProgress(id, newTime, percent, percent >= 90);
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bunnyId, duration, isPlaying, id, updateProgress, existingProgress]);

  // Handle iframe load and setup
  useEffect(() => {
    if (!bunnyId) return;

    const handleIframeLoad = () => {
      // Try to communicate with Bunny iframe
      const iframe = document.querySelector('iframe[src*="mediadelivery.net"]') as HTMLIFrameElement;
      if (iframe) {
        // Set up message listener for iframe communication
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== 'https://iframe.mediadelivery.net') return;
          
          try {
            const data = event.data;
            if (data.type === 'video-progress' || data.currentTime) {
              setCurrentTime(data.currentTime || 0);
              setDuration(data.duration || 0);
              setIsPlaying(data.isPlaying || false);
            }
          } catch (error) {
            console.warn('Error parsing iframe message:', error);
          }
        };

        window.addEventListener('message', handleMessage);
        
        // Try to get video duration from iframe
        setTimeout(() => {
          if (duration === 0) {
            // Fallback: estimate duration based on video ID or set a default
            setDuration(600); // 10 minutes default
          }
        }, 2000);

        return () => window.removeEventListener('message', handleMessage);
      }
    };

    // Wait for iframe to load
    setTimeout(handleIframeLoad, 1000);
  }, [bunnyId, duration]);

  // Manual progress controls
  const updateManualProgress = (newTime: number) => {
    if (duration > 0) {
      setCurrentTime(newTime);
      const percent = (newTime / duration) * 100;
      setCurrentProgress(percent);
      updateProgress(id, newTime, percent, percent >= 90);
    }
  };

  // Initialize progress on mount
  useEffect(() => {
    if (existingProgress) {
      setCurrentProgress(existingProgress.percent);
      setCurrentTime(existingProgress.last_second);
    }
  }, [existingProgress]);

  // Set default duration if not available
  useEffect(() => {
    if (duration === 0) {
      setDuration(600); // 10 minutes default
    }
  }, [duration]);

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

                {/* Manual Progress Controls */}
                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-2 rounded-lg bg-[#63eca9] text-black font-medium hover:bg-[#53e0b6] transition-colors"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  <button
                    onClick={() => updateManualProgress(Math.min(currentTime + 60, duration))}
                    className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    +1 Min
                  </button>
                  <button
                    onClick={() => updateManualProgress(Math.min(currentTime + 300, duration))}
                    className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    +5 Min
                  </button>
                  <button
                    onClick={() => updateManualProgress(duration)}
                    className="px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    Als abgeschlossen markieren
                  </button>
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


