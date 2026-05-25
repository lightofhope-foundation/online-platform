"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type UnlockDefaultsInput = {
  first_gated_video_position: number;
  first_unlock_offset_days: number;
  subsequent_unlock_interval_days: number;
};

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

function parseDefaults(input: UnlockDefaultsInput): UnlockDefaultsInput {
  const first_gated_video_position = Math.max(1, Math.floor(input.first_gated_video_position));
  const first_unlock_offset_days = Math.max(0, Math.floor(input.first_unlock_offset_days));
  const subsequent_unlock_interval_days = Math.max(
    0,
    Math.floor(input.subsequent_unlock_interval_days)
  );
  return {
    first_gated_video_position,
    first_unlock_offset_days,
    subsequent_unlock_interval_days,
  };
}

async function logDefaultsAudit(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  actorId: string,
  entity: string,
  entityId: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown>
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action: "update",
    entity,
    entity_id: entityId,
    before: before as never,
    after: after as never,
  });
  if (error) console.error("audit_logs:", error.message);
}

export async function saveGlobalUnlockDefaults(
  input: UnlockDefaultsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkAdminAccess();
    const values = parseDefaults(input);

    const { data: existing } = await supabase
      .from("platform_unlock_defaults")
      .select("id, first_gated_video_position, first_unlock_offset_days, subsequent_unlock_interval_days")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      ...values,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("platform_unlock_defaults")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
      await logDefaultsAudit(
        supabase,
        user.id,
        "platform_unlock_defaults",
        existing.id,
        {
          first_gated_video_position: existing.first_gated_video_position,
          first_unlock_offset_days: existing.first_unlock_offset_days,
          subsequent_unlock_interval_days: existing.subsequent_unlock_interval_days,
        },
        values
      );
    } else {
      const { data: inserted, error } = await supabase
        .from("platform_unlock_defaults")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      await logDefaultsAudit(
        supabase,
        user.id,
        "platform_unlock_defaults",
        inserted.id,
        null,
        values
      );
    }

    revalidatePath("/admin/einstellungen/videos");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}

export async function saveLevelUnlockDefaults(
  accessLevel: number,
  input: UnlockDefaultsInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkAdminAccess();
    const values = parseDefaults(input);

    const { data: levelMeta } = await supabase
      .from("platform_access_levels")
      .select("access_level")
      .eq("access_level", accessLevel)
      .is("deleted_at", null)
      .maybeSingle();

    if (!levelMeta) {
      return { ok: false, error: "Stufe nicht gefunden" };
    }

    const { data: existing } = await supabase
      .from("platform_unlock_defaults_by_level")
      .select("access_level, first_gated_video_position, first_unlock_offset_days, subsequent_unlock_interval_days")
      .eq("access_level", accessLevel)
      .maybeSingle();

    const payload = {
      access_level: accessLevel,
      ...values,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const { error } = await supabase
      .from("platform_unlock_defaults_by_level")
      .upsert(payload, { onConflict: "access_level" });

    if (error) throw error;

    await logDefaultsAudit(
      supabase,
      user.id,
      "platform_unlock_defaults_by_level",
      String(accessLevel),
      existing
        ? {
            first_gated_video_position: existing.first_gated_video_position,
            first_unlock_offset_days: existing.first_unlock_offset_days,
            subsequent_unlock_interval_days: existing.subsequent_unlock_interval_days,
          }
        : null,
      values
    );

    revalidatePath("/admin/einstellungen/videos");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
