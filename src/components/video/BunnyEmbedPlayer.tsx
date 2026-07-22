"use client";

import { getBunnyEmbedUrl } from "@/lib/bunnyCDN";

type BunnyEmbedPlayerProps = {
  libraryId: string;
  bunnyVideoId: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
};

export function BunnyEmbedPlayer({
  libraryId,
  bunnyVideoId,
  title,
  autoPlay = false,
  className = "",
}: BunnyEmbedPlayerProps) {
  const src = getBunnyEmbedUrl(libraryId, bunnyVideoId, { autoplay: autoPlay });

  return (
    <div
      className={`relative aspect-video w-full min-h-[220px] overflow-hidden rounded-xl bg-black ${className}`}
    >
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
