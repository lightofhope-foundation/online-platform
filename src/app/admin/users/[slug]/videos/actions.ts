"use server";

import { revalidatePath } from "next/cache";
import { berlinDatetimeLocalToIso } from "@/lib/berlinDatetime";
import {
  reseedUserVideoUnlockSchedule,
  resolveClientProfileByClientId,
  upsertUserVideoUnlock,
} from "@/lib/clientVideoUnlock";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

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
  const { user, supabase } = await checkAdminAccess();
  const { userId, clientId: resolvedClientId } = await resolveClientProfileByClientId(
    supabase,
    clientId
  );

  const unlockAtIso = berlinDatetimeLocalToIso(unlockAtLocal);
  if (!unlockAtIso) {
    throw new Error("Ungültiges Datum/Uhrzeit-Format");
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

  await upsertUserVideoUnlock(supabase, userId, videoId, unlockAtIso);

  await logAudit(supabase, user.id, "unlock_at_updated", `${userId}:${videoId}`, before, {
    unlock_at: unlockAtIso,
    source: "manual",
  });

  revalidatePath(`/admin/users/${resolvedClientId}/videos`);
  revalidatePath(`/admin/users/${resolvedClientId}`);
  return { ok: true as const };
}

export async function reseedUserVideoUnlocks(clientId: string) {
  const { user, supabase } = await checkAdminAccess();
  const { userId, clientId: resolvedClientId } = await resolveClientProfileByClientId(
    supabase,
    clientId
  );

  const count = await reseedUserVideoUnlockSchedule(supabase, userId);

  await logAudit(supabase, user.id, "unlock_schedule_reseeded", userId, null, {
    rows_seeded: count,
  });

  revalidatePath(`/admin/users/${resolvedClientId}/videos`);
  return { ok: true as const, count };
}
