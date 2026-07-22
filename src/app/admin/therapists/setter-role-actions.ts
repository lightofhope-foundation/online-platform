"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { setUserExtraRole } from "@/lib/userRoles";

export async function adminSetTherapistSetterRole(
  userId: string,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await checkAdminAccess();
    await setUserExtraRole(userId, "setter_closer", enabled);
    revalidatePath("/admin/therapists");
    revalidatePath(`/admin/therapists/${userId}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
