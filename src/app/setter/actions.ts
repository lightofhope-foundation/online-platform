"use server";

import { revalidatePath } from "next/cache";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureTherapySessionsSeeded } from "@/lib/therapySessions";

export type SetterCreateClientInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  therapistUserId: string | null;
};

export async function setterCreateClient(
  input: SetterCreateClientInput
): Promise<{ ok: true; clientId: string | null } | { ok: false; error: string }> {
  try {
    const { user } = await checkSetterAccess();
    const supabase = getSupabaseAdminClient();

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!email || !input.password || input.password.length < 8) {
      return { ok: false, error: "E-Mail und Passwort (min. 8 Zeichen) erforderlich." };
    }
    if (!firstName || !lastName) {
      return { ok: false, error: "Vor- und Nachname sind Pflicht." };
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        return { ok: false, error: "Diese E-Mail ist bereits registriert." };
      }
      return { ok: false, error: authError.message };
    }

    const userId = authData.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      role: "client",
      first_name: firstName,
      last_name: lastName,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      return { ok: false, error: profileError.message };
    }

    if (input.therapistUserId) {
      const assign = await setterAssignTherapist(userId, input.therapistUserId);
      if (!assign.ok) {
        return { ok: false, error: assign.error };
      }
    }

    await ensureTherapySessionsSeeded(supabase, userId);

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("user_id", userId)
      .single();

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "setter_client_created",
      entity: "profiles",
      entity_id: refreshed?.client_id ?? userId,
      before: null,
      after: { email, therapist_user_id: input.therapistUserId },
    });

    revalidatePath("/setter/users");
    return { ok: true, clientId: refreshed?.client_id ?? null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Anlegen fehlgeschlagen",
    };
  }
}

export async function setterAssignTherapist(
  clientUserId: string,
  therapistUserId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await checkSetterAccess();

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

    const now = new Date().toISOString();
    const { data: existingClient } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (existingClient) {
      const { error } = await supabase
        .from("clients")
        .update({ therapist_user_id: therapistUserId, updated_at: now })
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

    revalidatePath("/setter/users");
    if (clientProfile.client_id) {
      revalidatePath(`/setter/users/${clientProfile.client_id.toLowerCase()}`);
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Zuweisung fehlgeschlagen",
    };
  }
}

export type ClientIntakeData = {
  setter_name?: string;
  closer_name?: string;
  payment_plan?: string;
  price_per_session?: string;
  phone?: string;
  email?: string;
  address?: string;
  therapist_name?: string;
  session_start?: string;
  agreement_signed?: boolean;
  platform_added?: boolean;
  problems?: string;
  goals?: string;
  expectations?: string;
  side_note?: string;
  consequences?: string;
  value_tags?: string[];
  free_notes?: string;
};

export async function setterSaveIntake(
  clientUserId: string,
  intake: ClientIntakeData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkSetterAccess();

    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
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
          intake_data: intake,
          updated_at: now,
        })
        .eq("user_id", clientUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert({
        user_id: clientUserId,
        intake_data: intake,
        is_paid: false,
        access_revoked: false,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "setter_intake_updated",
      entity: "clients",
      entity_id: clientUserId,
      before: null,
      after: { fields: Object.keys(intake) },
    });

    revalidatePath("/setter/users");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
