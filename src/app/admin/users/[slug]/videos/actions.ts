"use server";

import { revalidatePath } from "next/cache";
import { berlinDatetimeLocalToIso } from "@/lib/berlinDatetime";
import { isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { fetchPublishedVideosDetail } from "@/lib/fetchPublishedVideosDetail";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function checkAdminAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const emailWhitelisted = user.email === "info@oag-media.com";
  const isAdmin = profile?.role === "admin" || emailWhitelisted;
  if (!isAdmin) throw new Error("Nicht autorisiert");

  return { user, supabase };
}

async function resolveClientUserId(clientId: string) {
  const normalized = normalizeClientIdForUrl(clientId);
  if (!isValidClientIdFormat(normalized)) {
    throw new Error("Ungültige Nutzer-ID");
  }

  const supabase = getSupabaseAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, client_id, role")
    .eq("client_id", normalized)
    .maybeSingle();

  if (error || !profile?.client_id) {
    throw new Error("Nutzer nicht gefunden");
  }
  if (profile.role !== "client") {
    throw new Error("Nur Klienten haben Video-Freischaltungen");
  }

  return { userId: profile.user_id, clientId: profile.client_id, supabase };
}

async function logAudit(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  actorId: string,
  action: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity: "user_video_unlocks",
    entity_id: entityId,
    before: before as never,
    after: after as never,
  });

  if (error) {
    console.error("audit_logs insert failed:", error.message);
  }
}

export async function updateUserVideoUnlock(
  clientId: string,
  videoId: string,
  unlockAtLocal: string
) {
  const { user, supabase: adminSupabase } = await checkAdminAccess();
  const { userId, clientId: resolvedClientId, supabase } = await resolveClientUserId(clientId);

  const unlockAtIso = berlinDatetimeLocalToIso(unlockAtLocal);
  if (!unlockAtIso) {
    throw new Error("Ungültiges Datum/Uhrzeit-Format");
  }

  const videos = await fetchPublishedVideosDetail(supabase, userId);
  const video = videos.find((v) => v.id === videoId);
  if (!video) {
    throw new Error("Video nicht gefunden");
  }

  const { data: existing } = await supabase
    .from("user_video_unlocks")
    .select("unlock_at, source, global_position")
    .eq("user_id", userId)
    .eq("video_id", videoId)
    .maybeSingle();

  const before = existing
    ? {
        unlock_at: existing.unlock_at,
        source: existing.source,
        global_position: existing.global_position,
      }
    : null;

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

  await logAudit(adminSupabase, user.id, "unlock_at_updated", `${userId}:${videoId}`, before, {
    unlock_at: unlockAtIso,
    source: "manual",
    global_position: video.globalPosition,
  });

  revalidatePath(`/admin/users/${resolvedClientId}/videos`);
  revalidatePath(`/admin/users/${resolvedClientId}`);
  return { ok: true };
}

export async function reseedUserVideoUnlocks(clientId: string) {
  const { user, supabase: adminSupabase } = await checkAdminAccess();
  const { userId, clientId: resolvedClientId, supabase } = await resolveClientUserId(clientId);

  const { data: count, error } = await supabase.rpc("seed_user_video_unlocks", {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);

  await logAudit(adminSupabase, user.id, "unlock_schedule_reseeded", userId, null, {
    rows_seeded: count,
  });

  revalidatePath(`/admin/users/${resolvedClientId}/videos`);
  return { ok: true, count };
}
