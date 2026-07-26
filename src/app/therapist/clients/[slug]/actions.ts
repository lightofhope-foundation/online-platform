"use server";

import { revalidatePath } from "next/cache";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import type { LeadIntakeView } from "@/lib/leadVault";

export async function therapistSaveClientIntake(
  clientId: string,
  intake: LeadIntakeView
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkTherapistAccess();
    const resolved = await resolveClientProfileByClientId(supabase, clientId);
    await assertTherapistOwnsClient(supabase, user.id, resolved.userId);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("clients")
      .update({
        intake_data: intake,
        updated_at: now,
      })
      .eq("user_id", resolved.userId);

    if (error) return { ok: false, error: error.message };

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "therapist_intake_updated",
      entity: "clients",
      entity_id: resolved.userId,
      before: null,
      after: { fields: Object.keys(intake) },
    });

    const slug = resolved.clientId.toLowerCase();
    revalidatePath(`/therapist/clients/${slug}`);
    revalidatePath("/therapist/clients");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
