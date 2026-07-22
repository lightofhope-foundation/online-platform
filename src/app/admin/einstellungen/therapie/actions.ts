"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { updateStandardSessionCount } from "@/lib/platformTherapyConfig";

export async function saveTherapySessionCount(
  count: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase, user } = await checkAdminAccess();
    await updateStandardSessionCount(supabase, count, user.id);

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "therapy_session_count_updated",
      entity: "platform_therapy_config",
      entity_id: "1",
      before: null,
      after: { standard_session_count: count },
    });

    revalidatePath("/admin/einstellungen/therapie");
    revalidatePath("/admin/users");
    revalidatePath("/therapist");
    revalidatePath("/setter");

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
