import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPublishedVideosDetail } from "@/lib/fetchPublishedVideosDetail";
import {
  getVideoAccessState,
  type VideoProgressRow,
  type VideoUnlockRow,
} from "@/lib/videoUnlock";
import { isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import type { Database } from "@/lib/database.types";

export type UserVideoTableRow = {
  videoId: string;
  globalPosition: number;
  title: string;
  chapterTitle: string;
  watchPercent: number;
  completedAt: string | null;
  unlockAt: string | null;
  unlockSource: string | null;
  accessState: ReturnType<typeof getVideoAccessState>;
};

type AdminClient = SupabaseClient<Database>;

export async function resolveClientProfileByClientId(
  supabase: AdminClient,
  clientId: string
) {
  const normalized = normalizeClientIdForUrl(clientId);
  if (!isValidClientIdFormat(normalized)) {
    throw new Error("Ungültige Nutzer-ID");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, client_id, role, created_at, first_name, last_name")
    .eq("client_id", normalized)
    .maybeSingle();

  if (error || !profile?.client_id) {
    throw new Error("Nutzer nicht gefunden");
  }
  if (profile.role !== "client") {
    throw new Error("Nur Klienten haben Video-Freischaltungen");
  }

  return {
    userId: profile.user_id,
    clientId: profile.client_id,
    profile,
  };
}

export async function assertTherapistOwnsClient(
  supabase: AdminClient,
  therapistUserId: string,
  clientUserId: string
) {
  const { data: assignment } = await supabase
    .from("clients")
    .select("therapist_user_id")
    .eq("user_id", clientUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assignment || assignment.therapist_user_id !== therapistUserId) {
    throw new Error("Nicht autorisiert");
  }
}

export async function loadUserVideoTableRows(
  supabase: AdminClient,
  userId: string
): Promise<UserVideoTableRow[]> {
  const videos = await fetchPublishedVideosDetail(supabase, userId);
  const orderedVideos = videos.map((v) => ({ id: v.id, position: v.position }));

  const { data: progressRows } = await supabase
    .from("video_progress")
    .select("video_id, percent, completed_at, last_second")
    .eq("user_id", userId);

  const progressByVideoId = new Map<string, VideoProgressRow>();
  (progressRows ?? []).forEach((row) => {
    progressByVideoId.set(row.video_id, {
      video_id: row.video_id,
      percent: row.percent ?? 0,
      completed_at: row.completed_at,
    });
  });

  const { data: unlockRows } = await supabase
    .from("user_video_unlocks")
    .select("video_id, global_position, unlock_at, source")
    .eq("user_id", userId);

  const unlockByVideoId = new Map<string, VideoUnlockRow>();
  (unlockRows ?? []).forEach((row) => {
    unlockByVideoId.set(row.video_id, {
      video_id: row.video_id,
      global_position: row.global_position,
      unlock_at: row.unlock_at,
      source: row.source,
    });
  });

  return videos.map((video, index) => {
    const progress = progressByVideoId.get(video.id);
    const unlock = unlockByVideoId.get(video.id);
    const accessState = getVideoAccessState(
      index,
      video.id,
      orderedVideos,
      progressByVideoId,
      unlockByVideoId
    );

    return {
      videoId: video.id,
      globalPosition: video.globalPosition,
      title: video.title,
      chapterTitle: video.chapterTitle,
      watchPercent: progress?.percent ?? 0,
      completedAt: progress?.completed_at ?? null,
      unlockAt: unlock?.unlock_at ?? null,
      unlockSource: unlock?.source ?? null,
      accessState,
    };
  });
}

export async function upsertUserVideoUnlock(
  supabase: AdminClient,
  userId: string,
  videoId: string,
  unlockAtIso: string
) {
  const videos = await fetchPublishedVideosDetail(supabase, userId);
  const video = videos.find((v) => v.id === videoId);
  if (!video) {
    throw new Error("Video nicht gefunden");
  }

  const row = {
    user_id: userId,
    video_id: videoId,
    global_position: video.globalPosition,
    unlock_at: unlockAtIso,
    source: "manual" as const,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_video_unlocks").upsert(row, {
    onConflict: "user_id,video_id",
  });

  if (error) throw new Error(error.message);
}

export async function reseedUserVideoUnlockSchedule(
  supabase: AdminClient,
  userId: string
) {
  const { data: count, error } = await supabase.rpc("seed_user_video_unlocks", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return count ?? 0;
}
