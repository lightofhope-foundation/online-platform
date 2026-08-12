"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";

export type UpdateOrbitClientLayoutInput = {
  therapistUserId: string;
  clientUserId: string;
  posY: number;
  side: "left" | "right";
};

async function assertOrbitWriteAccess(therapistUserId: string) {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const roles = await getUserPortalRoles(user.id);
  const isAdmin =
    userHasPortalRole(roles, "admin") || user.email === "info@oag-media.com";
  const isOwnTherapist =
    userHasPortalRole(roles, "therapist") && user.id === therapistUserId;

  if (!isAdmin && !isOwnTherapist) {
    throw new Error("Nicht autorisiert");
  }

  return { user, supabase: getSupabaseAdminClient() };
}

export async function updateOrbitClientLayout(
  input: UpdateOrbitClientLayoutInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await assertOrbitWriteAccess(input.therapistUserId);

    const posY = Math.min(1, Math.max(0, Number(input.posY)));
    if (Number.isNaN(posY)) {
      return { ok: false, error: "Ungültige Position" };
    }
    if (input.side !== "left" && input.side !== "right") {
      return { ok: false, error: "Ungültige Seite" };
    }

    const { data: assignment } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", input.clientUserId)
      .eq("therapist_user_id", input.therapistUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!assignment) {
      return { ok: false, error: "Klient nicht diesem Therapeuten zugeordnet" };
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from("therapist_orbit_layout").upsert(
      {
        therapist_user_id: input.therapistUserId,
        client_user_id: input.clientUserId,
        pos_y: posY,
        side: input.side,
        updated_at: now,
      },
      { onConflict: "therapist_user_id,client_user_id" }
    );

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/admin/therapists/${input.therapistUserId}/orbit`);
    revalidatePath(`/admin/therapists/${input.therapistUserId}`);
    revalidatePath("/admin/therapists/orbit");
    revalidatePath("/therapist/orbit");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
