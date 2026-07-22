"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBunnyThumbnailCandidates } from "@/lib/bunnyCDN";
import { PlayIcon } from "@/components/icons/Icons";

type VideoThumbnailPreviewProps = {
  bunnyVideoId: string | null | undefined;
  title: string;
  href?: string | null;
  onPlay?: () => void;
  className?: string;
};

export function VideoThumbnailPreview({
  bunnyVideoId,
  title,
  href,
  onPlay,
  className = "h-20 w-32 shrink-0",
}: VideoThumbnailPreviewProps) {
  const candidates = useMemo(
    () => (bunnyVideoId ? getBunnyThumbnailCandidates(bunnyVideoId, 480) : []),
    [bunnyVideoId]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setAllFailed(false);
  }, [bunnyVideoId]);

  const src = allFailed ? null : candidates[candidateIndex];
  const hasMoreCandidates = candidateIndex < candidates.length - 1;

  const handleImageError = () => {
    if (hasMoreCandidates) {
      setCandidateIndex((i) => i + 1);
    } else {
      setAllFailed(true);
    }
  };

  const interactive = Boolean(href || onPlay);

  const frame = (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/10 bg-black/60 ${className} ${
        interactive ? "transition hover:border-[#63eca9]/40 hover:opacity-95" : ""
      }`}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={src}
            src={src}
            alt={title}
            className="h-full w-full object-cover"
            onError={handleImageError}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="rounded-full bg-black/55 p-2 text-white shadow-lg">
              <PlayIcon size={22} />
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-black/80 text-white/50">
          <PlayIcon size={20} />
          <span className="text-[10px]">Vorschau</span>
        </div>
      )}
    </div>
  );

  if (onPlay) {
    return (
      <button
        type="button"
        onClick={onPlay}
        className="block w-full shrink-0 text-left"
        aria-label={`${title} abspielen`}
      >
        {frame}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="block shrink-0" aria-label={`${title} ansehen`}>
        {frame}
      </Link>
    );
  }

  return frame;
}
