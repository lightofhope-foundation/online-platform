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
    revalidatePath("/admin/therapists/tree");
    revalidatePath("/admin/therapists/board");
    for (const path of revalidatePaths) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Speichern fehlgeschlagen";
    return { ok: false, error: message };
  }
}

export async function updateClientTherapistAssignment(
  clientUserId: string,
  therapistUserId: string | null,
  revalidatePaths: string[] = []
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await checkAdminAccess();

    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("user_id, role, client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
    }

    if (therapistUserId) {
      const { data: therapistProfile } = await supabase
        .from("profiles")
        .select("user_id, role")
        .eq("user_id", therapistUserId)
        .maybeSingle();

      if (!therapistProfile || therapistProfile.role !== "therapist") {
        return { ok: false, error: "Ungültiger Therapeut." };
      }
    }

    const { data: existingClient } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    const now = new Date().toISOString();

    if (existingClient) {
      const { error } = await supabase
        .from("clients")
        .update({
          therapist_user_id: therapistUserId,
          updated_at: now,
        })
        .eq("user_id", clientUserId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert({
        user_id: clientUserId,
        therapist_user_id: therapistUserId,
        is_paid: false,
        access_revoked: false,
        created_at: now,
        updated_at: now,
      });

      if (error) throw error;
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/therapists");
    revalidatePath("/admin/therapists/tree");
    revalidatePath("/admin/therapists/board");
    if (therapistUserId) {
      revalidatePath(`/admin/therapists/${therapistUserId}`);
    }
    if (clientProfile.client_id) {
      revalidatePath(`/admin/users/${clientProfile.client_id.toLowerCase()}`);
    }
    for (const path of revalidatePaths) {
      revalidatePath(path);
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Zuweisung fehlgeschlagen";
    return { ok: false, error: message };
  }
}
