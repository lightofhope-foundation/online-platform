"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  clearRegistrationGateCookie,
  hasRegistrationGateCookie,
  normalizeInviteCode,
  setRegistrationGateCookie,
} from "@/lib/registrationGate";
import {
  loadActiveRegistrationFields,
  mapValuesToProfile,
  validateRegistrationInput,
} from "@/lib/registrationFields";

export async function verifyRegistrationInviteCode(
  rawCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeInviteCode(rawCode);
  if (!code) {
    return { ok: false, error: "Bitte den Zugangscode eingeben." };
  }

  const supabase = getSupabaseAdminClient();
  await supabase.rpc("ensure_registration_invite_row");

  const { data: row, error } = await supabase
    .from("platform_registration_invite")
    .select("current_code")
    .eq("id", 1)
    .maybeSingle();

  if (error || !row?.current_code) {
    return { ok: false, error: "Zugangscode konnte nicht geprüft werden." };
  }

  const stored = normalizeInviteCode(row.current_code);
  if (code !== stored) {
    return { ok: false, error: "Ungültiger Zugangscode." };
  }

  await setRegistrationGateCookie();
  return { ok: true };
}

export type RegisterClientInput = {
  email: string;
  password: string;
  values: Record<string, string>;
};

export async function registerClient(
  input: RegisterClientInput
): Promise<
  | { ok: true; clientId: string | null }
  | { ok: false; error: string }
> {
  const hasGate = await hasRegistrationGateCookie();
  if (!hasGate) {
    return {
      ok: false,
      error: "Bitte zuerst den gültigen Zugangscode eingeben.",
    };
  }

  const fields = await loadActiveRegistrationFields();
  const validationError = validateRegistrationInput(
    fields,
    input.values,
    input.email,
    input.password
  );
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const supabase = getSupabaseAdminClient();
  const email = input.email.trim().toLowerCase();

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
  const { profile, custom } = mapValuesToProfile(fields, input.values);

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: userId,
    role: "client",
    first_name: profile.first_name,
    last_name: profile.last_name,
    date_of_birth: profile.date_of_birth,
    street: profile.street,
    house_number: profile.house_number,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  if (custom.length > 0) {
    const { error: customError } = await supabase
      .from("profile_registration_values")
      .insert(
        custom.map((c) => ({
          user_id: userId,
          field_id: c.field_id,
          value: c.value,
        }))
      );
    if (customError) {
      console.error("profile_registration_values insert:", customError.message);
    }
  }

  const { data: refreshed } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("user_id", userId)
    .single();

  await supabase.rpc("rotate_registration_invite_code", { p_actor_id: null });

  await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "client_registered",
    entity: "profiles",
    entity_id: refreshed?.client_id ?? userId,
    before: null,
    after: { email, via: "registrierung" },
  });

  await clearRegistrationGateCookie();

  return { ok: true, clientId: refreshed?.client_id ?? null };
}

export async function redirectAfterRegistration(clientId: string | null) {
  redirect(clientId ? `/login?registered=1&id=${clientId}` : "/login?registered=1");
}
