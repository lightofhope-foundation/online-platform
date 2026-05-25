"use server";

import { revalidatePath } from "next/cache";
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

async function assertAccessLevelExists(supabase: ReturnType<typeof getSupabaseAdminClient>, level: number) {
  const { data } = await supabase
    .from("platform_access_levels")
    .select("access_level")
    .eq("access_level", level)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) {
    throw new Error("Ungültige Stufe");
  }
}

export async function updateUserAccessLevel(
  userId: string,
  accessLevel: number,
  clientId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await checkAdminAccess();
    await assertAccessLevelExists(supabase, accessLevel);

    const { error } = await supabase
      .from("profiles")
      .update({ access_level: accessLevel, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    if (clientId) {
      revalidatePath(`/admin/users/${clientId.toLowerCase()}`);
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Speichern fehlgeschlagen";
    return { ok: false, error: message };
  }
}

export async function bulkUpdateUserAccessLevel(
  userIds: string[],
  accessLevel: number
): Promise<{ ok: true; updated: number } | { ok: false; error: string }> {
  try {
    if (!userIds.length) {
      return { ok: false, error: "Keine Nutzer ausgewählt" };
    }

    const { supabase } = await checkAdminAccess();
    await assertAccessLevelExists(supabase, accessLevel);

    const { data, error } = await supabase
      .from("profiles")
      .update({ access_level: accessLevel, updated_at: new Date().toISOString() })
      .in("user_id", userIds)
      .eq("role", "client")
      .select("user_id");

    if (error) throw error;

    revalidatePath("/admin/users");
    return { ok: true, updated: data?.length ?? 0 };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Speichern fehlgeschlagen";
    return { ok: false, error: message };
  }
}
