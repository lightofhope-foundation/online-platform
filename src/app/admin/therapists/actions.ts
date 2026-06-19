"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";

export async function updateDisplayAlias(
  userId: string,
  displayAlias: string,
  revalidatePaths: string[] = []
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await checkAdminAccess();
    const trimmed = displayAlias.trim();

    const { error } = await supabase
      .from("profiles")
      .update({
        display_alias: trimmed.length > 0 ? trimmed : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    revalidatePath("/admin/therapists");
    for (const path of revalidatePaths) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Speichern fehlgeschlagen";
    return { ok: false, error: message };
  }
}
