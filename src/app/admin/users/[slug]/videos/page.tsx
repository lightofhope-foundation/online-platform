import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  AdminUserVideosTable,
  type AdminUserVideoRow,
} from "@/components/admin/AdminUserVideosTable";
import { fetchPublishedVideosDetail } from "@/lib/fetchPublishedVideosDetail";
import {
  formatGermanDateTime,
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import {
  getVideoAccessState,
  type VideoProgressRow,
  type VideoUnlockRow,
} from "@/lib/videoUnlock";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function AdminUserVideosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  const admin = getSupabaseAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("user_id, role, created_at, first_name, last_name, client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (profileError || !profile?.client_id || profile.role !== "client") {
    notFound();
  }

  const { data: authUserRes } = await admin.auth.admin.getUserById(profile.user_id);
  const authUser = authUserRes?.user;
  if (!authUser) {
    notFound();
  }

  const videos = await fetchPublishedVideosDetail(admin);
  const orderedVideos = videos.map((v) => ({ id: v.id, position: v.position }));

  const { data: progressRows } = await admin
    .from("video_progress")
    .select("video_id, percent, completed_at, last_second")
    .eq("user_id", profile.user_id);

  const progressByVideoId = new Map<string, VideoProgressRow>();
  (progressRows ?? []).forEach((row) => {
    progressByVideoId.set(row.video_id, {
      video_id: row.video_id,
      percent: row.percent ?? 0,
      completed_at: row.completed_at,
    });
  });

  const { data: unlockRows } = await admin
    .from("user_video_unlocks")
    .select("video_id, global_position, unlock_at, source")
    .eq("user_id", profile.user_id);

  const unlockByVideoId = new Map<string, VideoUnlockRow>();
  (unlockRows ?? []).forEach((row) => {
    unlockByVideoId.set(row.video_id, {
      video_id: row.video_id,
      global_position: row.global_position,
      unlock_at: row.unlock_at,
      source: row.source,
    });
  });

  const tableRows: AdminUserVideoRow[] = videos.map((video, index) => {
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

  const displayName =
    formatFullName(profile.first_name, profile.last_name) !== "—"
      ? formatFullName(profile.first_name, profile.last_name)
      : (authUser.email ?? "Nutzer");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/users/${profile.client_id}`}
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zum Nutzer
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Video-Fortschritt & Freischaltung</h1>
        <p className="mt-1 text-sm text-white/60">
          {displayName} · Nutzer-ID{" "}
          <span className="font-mono text-white/80">{profile.client_id}</span>
        </p>
        <p className="mt-1 text-xs text-white/40">
          Registriert: {formatGermanDateTime(profile.created_at)} · Letzter Login:{" "}
          {formatGermanDateTime(authUser.last_sign_in_at)}
        </p>
      </div>

      <AdminUserVideosTable clientId={profile.client_id} rows={tableRows} />
    </div>
  );
}
