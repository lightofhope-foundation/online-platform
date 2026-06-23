"use server";

import { revalidatePath } from "next/cache";
import { berlinDatetimeLocalToIso } from "@/lib/berlinDatetime";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  reseedUserVideoUnlockSchedule,
  resolveClientProfileByClientId,
  upsertUserVideoUnlock,
} from "@/lib/clientVideoUnlock";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

async function checkTherapistClientAccess(clientId: string) {
  const { user, supabase } = await checkTherapistAccess();
  const resolved = await resolveClientProfileByClientId(supabase, clientId);
  await assertTherapistOwnsClient(supabase, user.id, resolved.userId);
  return { user, supabase, ...resolved };
}

async function logAudit(
  actorId: string,
  action: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
) {
  const adminSupabase = getSupabaseAdminClient();
  const { error } = await adminSupabase.from("audit_logs").insert({
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

function revalidateTherapistClientPaths(clientId: string) {
  const slug = clientId.toLowerCase();
  revalidatePath(`/therapist/clients/${slug}`);
  revalidatePath(`/therapist/clients/${slug}/videos`);
}

export async function updateTherapistClientVideoUnlock(
  clientId: string,
  videoId: string,
  unlockAtLocal: string
) {
  const { user, supabase, userId, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);

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

  await logAudit(user.id, "therapist_unlock_at_updated", `${userId}:${videoId}`, before, {
    unlock_at: unlockAtIso,
    source: "manual",
  });

  revalidateTherapistClientPaths(resolvedClientId);
  return { ok: true as const };
}

export async function reseedTherapistClientVideoUnlocks(clientId: string) {
  const { user, supabase, userId, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);

  const count = await reseedUserVideoUnlockSchedule(supabase, userId);

  await logAudit(user.id, "therapist_unlock_schedule_reseeded", userId, null, {
    rows_seeded: count,
  });

  revalidateTherapistClientPaths(resolvedClientId);
  return { ok: true as const, count };
}
