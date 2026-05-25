import { formatGermanUnlockAt } from "@/lib/clientId";

export type UnlockScheduleSource = "default" | "manual" | "override";

export type VideoUnlockRow = {
  video_id: string;
  global_position: number;
  unlock_at: string;
  source: UnlockScheduleSource;
};

export type VideoProgressRow = {
  video_id: string;
  percent: number;
  completed_at: string | null;
};

export type OrderedVideo = {
  id: string;
  position: number;
};

export type VideoAccessState =
  | { status: "available" }
  | { status: "completed" }
  | {
      status: "locked_sequence";
      message: string;
    }
  | {
      status: "locked_schedule";
      unlockAt: string;
      message: string;
    };

const SEQUENCE_MESSAGE =
  "Wird freigeschaltet, sobald das vorherige Video abgeschlossen ist.";

export function isVideoCompleted(progress: VideoProgressRow | undefined): boolean {
  if (!progress) return false;
  if (progress.completed_at) return true;
  return progress.percent >= 95;
}

/** Sequential rule: video 0 open; video i open if previous completed. */
export function isSequentialEligible(
  videoIndex: number,
  orderedVideos: OrderedVideo[],
  progressByVideoId: Map<string, VideoProgressRow>
): boolean {
  if (videoIndex <= 0) return true;
  const prev = orderedVideos[videoIndex - 1];
  return isVideoCompleted(progressByVideoId.get(prev.id));
}

/** Schedule rule: no row or unlock_at <= now */
export function isScheduleEligible(
  videoId: string,
  unlockByVideoId: Map<string, VideoUnlockRow>,
  now: Date = new Date()
): { eligible: boolean; unlockAt?: string } {
  const row = unlockByVideoId.get(videoId);
  if (!row) return { eligible: true };
  const unlockAt = new Date(row.unlock_at);
  if (unlockAt.getTime() <= now.getTime()) return { eligible: true };
  return { eligible: false, unlockAt: row.unlock_at };
}

export function getVideoAccessState(
  videoIndex: number,
  videoId: string,
  orderedVideos: OrderedVideo[],
  progressByVideoId: Map<string, VideoProgressRow>,
  unlockByVideoId: Map<string, VideoUnlockRow>,
  now: Date = new Date()
): VideoAccessState {
  const progress = progressByVideoId.get(videoId);
  if (isVideoCompleted(progress)) {
    return { status: "completed" };
  }

  const schedule = isScheduleEligible(videoId, unlockByVideoId, now);
  if (!schedule.eligible && schedule.unlockAt) {
    return {
      status: "locked_schedule",
      unlockAt: schedule.unlockAt,
      message: `Freigeschaltet ab ${formatGermanUnlockAt(schedule.unlockAt)}`,
    };
  }

  if (!isSequentialEligible(videoIndex, orderedVideos, progressByVideoId)) {
    return { status: "locked_sequence", message: SEQUENCE_MESSAGE };
  }

  return { status: "available" };
}

export function canWatchVideo(
  videoIndex: number,
  videoId: string,
  orderedVideos: OrderedVideo[],
  progressByVideoId: Map<string, VideoProgressRow>,
  unlockByVideoId: Map<string, VideoUnlockRow>,
  now: Date = new Date()
): boolean {
  const state = getVideoAccessState(
    videoIndex,
    videoId,
    orderedVideos,
    progressByVideoId,
    unlockByVideoId,
    now
  );
  return state.status === "available" || state.status === "completed";
}

/** Build legacy boolean unlock map for course list (Phase 2 will use full state). */
/** Client label when schedule unlock time has passed (video is time-unlocked). */
export function getUnlockedSinceMessage(
  videoId: string,
  unlockByVideoId: Map<string, VideoUnlockRow>,
  now: Date = new Date()
): string | null {
  const row = unlockByVideoId.get(videoId);
  if (!row) return null;
  const unlockAt = new Date(row.unlock_at);
  if (unlockAt.getTime() > now.getTime()) return null;
  return `Freigeschalten seit ${formatGermanUnlockAt(row.unlock_at)}`;
}

export function getPreviousVideoStatus(
  videoIndex: number,
  orderedVideos: OrderedVideo[],
  progressByVideoId: Map<string, VideoProgressRow>,
  titleByVideoId?: Map<string, string>
): { previousTitle: string; completed: boolean } | null {
  if (videoIndex <= 0) return null;
  const prev = orderedVideos[videoIndex - 1];
  const completed = isVideoCompleted(progressByVideoId.get(prev.id));
  const previousTitle = titleByVideoId?.get(prev.id) ?? `Video ${videoIndex}`;
  return { previousTitle, completed };
}

export function buildUnlockMap(
  orderedVideos: OrderedVideo[],
  progressByVideoId: Map<string, VideoProgressRow>,
  unlockByVideoId: Map<string, VideoUnlockRow>,
  now: Date = new Date()
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  orderedVideos.forEach((video, index) => {
    map[video.id] = canWatchVideo(
      index,
      video.id,
      orderedVideos,
      progressByVideoId,
      unlockByVideoId,
      now
    );
  });
  return map;
}
