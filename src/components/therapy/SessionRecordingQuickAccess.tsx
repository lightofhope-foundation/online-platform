"use client";

import { useState } from "react";
import Link from "next/link";
import { VideoThumbnailPreview } from "@/components/dashboard/VideoThumbnailPreview";
import { PlayIcon } from "@/components/icons/Icons";
import { BunnyVideoModal } from "@/components/video/BunnyVideoModal";

type SessionRecordingQuickAccessProps = {
  sessionNumber: number;
  sessionLabel: string;
  recordingTitle: string | null;
  bunnyVideoId: string;
  bunnyLibraryId: string;
};

export function SessionRecordingQuickAccess({
  sessionNumber,
  sessionLabel,
  recordingTitle,
  bunnyVideoId,
  bunnyLibraryId,
}: SessionRecordingQuickAccessProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const trimmedRecordingTitle = recordingTitle?.trim();
  const showRecordingTitle =
    trimmedRecordingTitle &&
    trimmedRecordingTitle.toLowerCase() !== sessionLabel.toLowerCase();

  return (
    <>
      <div className="mt-6 rounded-2xl border border-[#63eca9]/25 bg-[#63eca9]/[0.05] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#63eca9]/80">
          Sitzungsaufnahme
        </p>
        <p className="mt-1 text-sm text-white/70">
          Für diese Sitzung liegt eine Aufnahme bereit.
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <VideoThumbnailPreview
            bunnyVideoId={bunnyVideoId}
            title={sessionLabel}
            href={`/sitzungsaufnahmen/${sessionNumber}`}
            className="aspect-video w-full sm:max-w-[220px] shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {showRecordingTitle && (
              <p className="text-sm font-medium text-white">{trimmedRecordingTitle}</p>
            )}
            <Link
              href={`/sitzungsaufnahmen/${sessionNumber}`}
              className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.08] sm:justify-start"
            >
              Zur Sitzungsaufnahme
            </Link>
            <button
              type="button"
              onClick={() => setShowPlayer(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-3 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25 sm:justify-start"
            >
              <PlayIcon size={16} />
              hier abspielen
            </button>
          </div>
        </div>
      </div>

      <BunnyVideoModal
        open={showPlayer}
        onClose={() => setShowPlayer(false)}
        bunnyLibraryId={bunnyLibraryId}
        bunnyVideoId={bunnyVideoId}
        title={sessionLabel}
        subtitle={showRecordingTitle ? trimmedRecordingTitle : undefined}
      />
    </>
  );
}
