"use client";

import { useEffect, useId, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import Hls from "hls.js";
import { getBunnyHlsPlaylistUrl } from "@/lib/bunnyCDN";

type BunnyStreamPlayerProps = {
  bunnyVideoId: string;
  autoPlay?: boolean;
  className?: string;
};

export function BunnyStreamPlayer({
  bunnyVideoId,
  autoPlay = false,
  className = "",
}: BunnyStreamPlayerProps) {
  const reactId = useId();
  const playerDomId = `bunny-stream-${reactId.replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let rafId: number | null = null;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch {
          /* already disposed */
        }
        playerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.replaceChildren();
      }
    };

    const resizePlayer = (player: ReturnType<typeof videojs>) => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        player.dimensions(w, h);
      }
      player.trigger("resize");
    };

    const initialize = () => {
      if (cancelled) return;

      const container = containerRef.current;
      if (!container || !container.isConnected) {
        rafId = requestAnimationFrame(initialize);
        return;
      }

      if (playerRef.current) return;

      const videoEl = document.createElement("video");
      videoEl.id = playerDomId;
      videoEl.className = "video-js vjs-big-play-centered";
      videoEl.setAttribute("playsinline", "true");
      videoEl.style.width = "100%";
      videoEl.style.height = "100%";
      container.appendChild(videoEl);

      const hlsUrl = getBunnyHlsPlaylistUrl(bunnyVideoId);
      const player = videojs(videoEl, {
        controls: true,
        fluid: false,
        preload: "metadata",
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: { overrideNative: false },
        },
      });

      playerRef.current = player;

      player.on("error", () => {
        const playerError = player.error();
        if (playerError) {
          setError(playerError.message || "Wiedergabefehler");
        }
      });

      const onReady = () => {
        if (cancelled) return;
        resizePlayer(player);
        window.setTimeout(() => {
          if (!cancelled && playerRef.current) {
            resizePlayer(playerRef.current);
            if (autoPlay) {
              void playerRef.current.play()?.catch(() => {});
            }
          }
        }, 150);
      };

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, onReady);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError("Video konnte nicht geladen werden.");
              break;
          }
        });
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = hlsUrl;
        player.one("loadedmetadata", onReady);
      } else {
        setError("HLS wird in diesem Browser nicht unterstützt.");
        return;
      }

      player.on("loadedmetadata", () => resizePlayer(player));
    };

    setError(null);
    initialize();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      cleanup();
    };
  }, [bunnyVideoId, autoPlay, playerDomId]);

  if (error) {
    return (
      <div
        className={`flex aspect-video items-center justify-center rounded-xl bg-black/60 px-4 text-center text-sm text-red-300 ${className}`}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video w-full min-h-[220px] overflow-hidden rounded-xl bg-black ${className}`}
      data-vjs-player
    />
  );
}
