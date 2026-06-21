"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { revalidatePath } from "next/cache";

export type ClientProfileInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  street: string | null;
  houseNumber: string | null;
};

export async function updateClientProfile(input: ClientProfileInput) {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht angemeldet");

  const supabase = getSupabaseAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profil nicht gefunden");
  }

  if (profile.role !== "client") {
    throw new Error("Diese Seite ist nur für Klienten verfügbar.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName.trim() || null,
      last_name: input.lastName.trim() || null,
      date_of_birth: input.dateOfBirth?.trim() || null,
      street: input.street?.trim() || null,
      house_number: input.houseNumber?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  const { error: auditError } = await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "client_profile_updated",
    entity: "profiles",
    entity_id: profile.client_id ?? user.id,
    before: null,
    after: {
      first_name: input.firstName.trim() || null,
      last_name: input.lastName.trim() || null,
      date_of_birth: input.dateOfBirth?.trim() || null,
      street: input.street?.trim() || null,
      house_number: input.houseNumber?.trim() || null,
    },
  });

  if (auditError) {
    console.error("audit_logs insert failed:", auditError.message);
  }

  revalidatePath("/settings");
  return { ok: true };
}
