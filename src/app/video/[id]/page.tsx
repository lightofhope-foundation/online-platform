"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Hls from "hls.js";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function VideoPage({ params }: PageProps) {
  const { id } = use(params);
  const supabase = getSupabaseBrowserClient();
  const { updateProgress, getVideoProgress, refreshProgress, loading: progressLoading } = useVideoProgress();
  const [bunnyId, setBunnyId] = useState<string | null>(null);
  const [requiresWorkbook, setRequiresWorkbook] = useState<boolean>(false);
  const [course, setCourse] = useState<{ title: string; slug: string } | null>(null);
  const [video, setVideo] = useState<{ title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextVideoId, setNextVideoId] = useState<string | null>(null);
  const [savedProgress, setSavedProgress] = useState<{ last_second: number; percent: number } | null>(null);
  const [hasAttemptedResume, setHasAttemptedResume] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedProgressRef = useRef<{ last_second: number; percent: number } | null>(null);
  const updateProgressRef = useRef(updateProgress);
  const refreshProgressRef = useRef(refreshProgress);
  const getVideoProgressRef = useRef(getVideoProgress);
  const hasAttemptedResumeRef = useRef(false);
  const MIN_RESUME_TIME = 240; // 4 minutes in seconds

  // Keep refs in sync
  useEffect(() => {
    updateProgressRef.current = updateProgress;
  }, [updateProgress]);

  useEffect(() => {
    refreshProgressRef.current = refreshProgress;
  }, [refreshProgress]);

  useEffect(() => {
    getVideoProgressRef.current = getVideoProgress;
  }, [getVideoProgress]);

  // Load progress when available
  useEffect(() => {
    if (!progressLoading) {
      const progressFetcher = getVideoProgressRef.current;
      const existingProgress = progressFetcher(id);
      if (existingProgress) {
        const progressPayload = {
          last_second: existingProgress.last_second || 0,
          percent: existingProgress.percent || 0
        };
        savedProgressRef.current = progressPayload;
        setSavedProgress(progressPayload);
        if (existingProgress.completed_at) {
          setIsCompleted(true);
        }
      } else {
        savedProgressRef.current = null;
        setSavedProgress(null);
        setIsCompleted(false);
      }
    }
  }, [progressLoading, id]);

  useEffect(() => {
    savedProgressRef.current = savedProgress;
  }, [savedProgress]);

  useEffect(() => {
    hasAttemptedResumeRef.current = hasAttemptedResume;
  }, [hasAttemptedResume]);

  // Initialize Video.js player (wait until element is connected)
  useEffect(() => {
    if (!bunnyId) return;

    let cancelled = false;
    let rafId: number | null = null;

    const cleanup = () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
        saveProgressTimeoutRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };

    const initialize = () => {
      if (cancelled) return;

      const el = videoRef.current;
      if (!el || !el.isConnected) {
        rafId = requestAnimationFrame(initialize);
        return;
      }

      if (playerRef.current) {
        return;
      }

      const hlsUrl = `https://vz-f7a686f2-d74.b-cdn.net/${bunnyId}/playlist.m3u8`;
      console.log('Initializing player with HLS URL:', hlsUrl);

      const player = videojs(el, {
        controls: true,
        fluid: true,
        preload: 'metadata',
        playbackRates: [0.5, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            overrideNative: false
          }
        }
      });

      playerRef.current = player;

      player.on('error', () => {
        const error = player.error();
        if (error) {
          console.error('Video.js error:', error);
          setError(`Video playback error: ${error.message || 'Unknown error'}`);
        }
      });

      const attemptResume = () => {
        if (hasAttemptedResumeRef.current) return;
        const currentProgress = savedProgressRef.current;
        if (!currentProgress) return;
        const lastPosition = currentProgress.last_second || 0;
        const shouldResume = lastPosition >= MIN_RESUME_TIME;
        if (shouldResume && lastPosition > 0 && playerRef.current) {
          const duration = playerRef.current.duration();
          if (typeof duration === 'number' && duration > 0 && lastPosition < duration - 2) {
            console.log(`Resuming from ${lastPosition} seconds`);
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.currentTime(lastPosition);
              }
            }, 500);
            setHasAttemptedResume(true);
          }
        }
      };

      if (Hls.isSupported()) {
        console.log('Using Hls.js for HLS playback');
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(el);
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError('Video playback error');
                break;
            }
          }
        });
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS support');
        el.src = hlsUrl;
      } else {
        setError('HLS is not supported in this browser');
        return;
      }

      const onLoadedMeta = () => {
        const duration = player.duration();
        console.log('Video metadata loaded, duration:', duration);
        attemptResume();
      };

      const saveProgress = async () => {
        if (!playerRef.current) return;
        const currentTime = playerRef.current.currentTime();
        const duration = playerRef.current.duration();
        if (typeof currentTime === 'number' && typeof duration === 'number' && duration > 0) {
          const percent = Math.round((currentTime / duration) * 100);
          await updateProgressRef.current(id, currentTime, percent, percent >= 90);
          const progressState = { last_second: currentTime, percent };
          savedProgressRef.current = progressState;
          setSavedProgress(progressState);
        }
      };

      player.on('loadedmetadata', onLoadedMeta);
      player.on('play', () => {
        console.log('Video playing');
      });
      player.on('pause', () => {
        saveProgress();
      });
      player.on('ended', () => {
        if (playerRef.current) {
          const duration = playerRef.current.duration();
          if (typeof duration === 'number' && duration > 0) {
            updateProgressRef.current(id, duration, 100, true);
            setIsCompleted(true);
            refreshProgressRef.current();
            const progressState = { last_second: duration, percent: 100 };
            savedProgressRef.current = progressState;
            setSavedProgress(progressState);
          }
        }
      });

      let lastSavedTime = 0;
      player.on('timeupdate', () => {
        const currentTime = player.currentTime();
        if (typeof currentTime === 'number' && Math.abs(currentTime - lastSavedTime) >= 5) {
          lastSavedTime = currentTime;
          if (saveProgressTimeoutRef.current) {
            clearTimeout(saveProgressTimeoutRef.current);
          }
          saveProgressTimeoutRef.current = setTimeout(saveProgress, 2000);
        }
      });

      console.log('Player initialized successfully');
    };

    initialize();

    return () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      cleanup();
    };
  }, [bunnyId, id]);

  // Listen for progress updates and attempt resume
  useEffect(() => {
    if (playerRef.current && savedProgress && !hasAttemptedResume) {
      const player = playerRef.current;
      const handleLoadedMetadata = () => {
        const lastPosition = savedProgress.last_second || 0;
        const shouldResume = lastPosition >= MIN_RESUME_TIME;
        
        if (shouldResume && lastPosition > 0) {
          const duration = player.duration();
          if (typeof duration === 'number' && duration > 0 && lastPosition < duration) {
            console.log(`Resuming from ${lastPosition} seconds (progress loaded after player init)`);
            player.currentTime(lastPosition);
            setHasAttemptedResume(true);
          }
        }
      };
      
      if (player.readyState() >= 1) {
        // Metadata already loaded
        handleLoadedMetadata();
      } else {
        player.on('loadedmetadata', handleLoadedMetadata);
      }
      
      return () => {
        player.off('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [savedProgress, hasAttemptedResume]);

  // Reset progress for testing
  const resetProgress = async () => {
    try {
      await updateProgress(id, 0, 0, false);
      console.log('Progress reset for testing');
      refreshProgress();
      // Reload page to reset video position
      window.location.reload();
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  // Mark video as completed
  const markAsCompleted = async () => {
    if (playerRef.current) {
      const duration = playerRef.current.duration();
      if (typeof duration === 'number' && duration > 0) {
        console.log('Marking video as completed:', id);
        try {
          const result = await updateProgress(id, duration, 100, true);
          console.log('Update progress result:', result);
          setIsCompleted(true);
          refreshProgress();
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }
    }
  };

  // Undo completion
  const undoCompletion = async () => {
    console.log('Undoing video completion:', id);
    const currentProgress = savedProgress || getVideoProgress(id);
    const lastSecond = currentProgress?.last_second || 0;
    const percent = currentProgress?.percent || 0;
    await updateProgress(id, lastSecond, percent, false);
    setIsCompleted(false);
    refreshProgress();
  };

  // Load video data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching video with ID:", id);
        
        const { data: v, error: videoError } = await supabase
          .from("videos")
          .select("title,bunny_video_id,requires_workbook,chapter_id,position")
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
          
          // Find next video in the same chapter
          if (v.chapter_id) {
            const { data: nextVideo } = await supabase
              .from("videos")
              .select("id")
              .eq("chapter_id", v.chapter_id)
              .gt("position", v.position || 0)
              .is("deleted_at", null)
              .order("position", { ascending: true })
              .limit(1)
              .maybeSingle();
              
            if (nextVideo) {
              setNextVideoId(nextVideo.id);
            }
          }
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
            <div className="aspect-video w-full rounded-lg bg-black/60 overflow-hidden relative z-10 pointer-events-auto">
              <video
                id={`videojs-player-${id}`}
                ref={videoRef}
                className="video-js vjs-big-play-centered"
                style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
                playsInline
              />
            </div>

            {/* Resume notification */}
            {savedProgress && savedProgress.last_second >= MIN_RESUME_TIME && savedProgress.last_second > 0 && (
              <div className="mt-4 p-3 rounded-lg border border-[#63eca9]/50 bg-[#63eca9]/10 text-[#63eca9] text-sm">
                Video wird bei {Math.floor(savedProgress.last_second / 60)}:{(savedProgress.last_second % 60).toFixed(0).padStart(2, '0')} fortgesetzt
              </div>
            )}

            {/* Video Controls */}
            <div className="mt-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-4 flex-wrap">
                {!isCompleted ? (
                  <button
                    onClick={markAsCompleted}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
                  >
                    Als abgeschlossen markieren
                  </button>
                ) : (
                  <button
                    onClick={undoCompletion}
                    className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Abgeschlossen rückgängig machen
                  </button>
                )}
                
                {/* Reset Progress Button for Testing */}
                <button
                  onClick={resetProgress}
                  className="px-4 py-2 rounded-lg border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-colors"
                >
                  🔄 Progress zurücksetzen (Test)
                </button>
                
                {isCompleted && nextVideoId && (
                  <Link 
                    href={`/video/${nextVideoId}`}
                    className="px-4 py-2 rounded-lg bg-[#63eca9] text-black font-medium hover:bg-[#53e0b6] transition-colors"
                  >
                    Nächstes Video
                  </Link>
                )}
                {isCompleted && !nextVideoId && (
                  <Link 
                    href={`/courses/${course?.slug || ''}`}
                    className="px-4 py-2 rounded-lg bg-[#63eca9] text-black font-medium hover:bg-[#53e0b6] transition-colors"
                  >
                    Zurück zum Kurs
                  </Link>
                )}
              </div>
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
