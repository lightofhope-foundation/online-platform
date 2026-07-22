"use client";

import { useState } from "react";
import Link from "next/link";
import { VideoThumbnailPreview } from "@/components/dashboard/VideoThumbnailPreview";
import { PlayIcon } from "@/components/icons/Icons";
import { BunnyVideoModal } from "@/components/video/BunnyVideoModal";
import {
  formatTherapySessionLabel,
  type TherapySessionRow,
} from "@/lib/therapySessions";

export type SessionRecordingCard = Pick<
  TherapySessionRow,
  | "session_number"
  | "recording_title"
  | "recording_bunny_video_id"
  | "released_to_client"
  | "topic"
  | "is_special"
>;

type SessionRecordingsGridProps = {
  sessions: SessionRecordingCard[];
  bunnyLibraryId: string;
};

type ActiveRecording = {
  bunnyVideoId: string;
  sessionLabel: string;
  videoTitle?: string;
};

export function SessionRecordingsGrid({
  sessions,
  bunnyLibraryId,
}: SessionRecordingsGridProps) {
  const [active, setActive] = useState<ActiveRecording | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sessions.map((session) => {
          const hasRecording = Boolean(session.recording_bunny_video_id?.trim());
          const canWatch = hasRecording && session.released_to_client;
          const sessionLabel = formatTherapySessionLabel(
            session.session_number,
            session.topic,
            session.is_special
          );
          const recordingTitle = session.recording_title?.trim();
          const showRecordingTitle =
            recordingTitle &&
            recordingTitle.toLowerCase() !== sessionLabel.toLowerCase();

          const openPlayer = () => {
            if (!session.recording_bunny_video_id) return;
            setActive({
              bunnyVideoId: session.recording_bunny_video_id,
              sessionLabel,
              videoTitle: showRecordingTitle ? recordingTitle : undefined,
            });
          };

          return (
            <article
              key={session.session_number}
              className={`flex flex-col overflow-hidden rounded-[20px] border backdrop-blur-sm ${
                canWatch
                  ? session.is_special
                    ? "border-red-400/35 bg-red-500/[0.06]"
                    : "border-[#63eca9]/30 bg-[#63eca9]/[0.06]"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span
                  className={`text-sm font-semibold leading-snug ${
                    canWatch
                      ? session.is_special
                        ? "text-red-300"
                        : "text-[#63eca9]"
                      : "text-white/70"
                  }`}
                >
                  {sessionLabel}
                </span>
                {!session.released_to_client && (
                  <span className="text-[10px] uppercase tracking-wide text-white/35">
                    Gesperrt
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                {canWatch ? (
                  <>
                    {showRecordingTitle && (
                      <p className="text-xs text-white/50">{recordingTitle}</p>
                    )}

                    <VideoThumbnailPreview
                      bunnyVideoId={session.recording_bunny_video_id}
                      title={sessionLabel}
                      href={`/sitzungsaufnahmen/${session.session_number}`}
                      className="aspect-video w-full"
                    />

                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        href={`/sitzungen?sitzung=${session.session_number}`}
                        className="inline-flex justify-center rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.08]"
                      >
                        Zur Sitzung
                      </Link>
                      <button
                        type="button"
                        onClick={openPlayer}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-3 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25"
                      >
                        <PlayIcon size={16} />
                        hier abspielen
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                    <p className="text-sm text-white/35">
                      {hasRecording && !session.released_to_client
                        ? "Aufnahme wird freigegeben, sobald Ihr Therapeut die Sitzung freischaltet."
                        : "Noch keine Aufnahme hinterlegt."}
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {active && (
        <BunnyVideoModal
          open
          onClose={() => setActive(null)}
          bunnyLibraryId={bunnyLibraryId}
          bunnyVideoId={active.bunnyVideoId}
          title={active.sessionLabel}
          subtitle={active.videoTitle}
        />
      )}
    </>
  );
}
