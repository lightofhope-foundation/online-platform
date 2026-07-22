"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { LOH_SESSION_PATH_DEFAULT_BG } from "@/lib/branding";

function isAllowedBackgroundUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/session-path/")) return true;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

export async function saveSessionPathBackgroundUrl(
  clientUserId: string,
  clientId: string,
  backgroundUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, user } = await checkAdminAccess();
    const trimmed = backgroundUrl.trim() || LOH_SESSION_PATH_DEFAULT_BG;

    if (!isAllowedBackgroundUrl(trimmed)) {
      return { ok: false, error: "Ungültige Bild-URL (https://… oder /session-path/…)." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, role, client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!profile || profile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
    }

    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("clients")
        .update({
          session_path_background_url: trimmed,
          updated_at: now,
        })
        .eq("user_id", clientUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert({
        user_id: clientUserId,
        session_path_background_url: trimmed,
        is_paid: false,
        access_revoked: false,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "session_path_background_updated",
      entity: "clients",
      entity_id: clientUserId,
      before: null,
      after: { session_path_background_url: trimmed },
    });

    const slug = clientId.toLowerCase();
    revalidatePath(`/admin/users/${slug}/sitzungen`);
    revalidatePath(`/therapist/clients/${slug}/sitzungen`);
    revalidatePath("/sitzungen");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
