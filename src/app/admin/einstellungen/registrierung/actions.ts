"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import {
  fieldKeyFromLabel,
  loadActiveRegistrationFields,
  type RegistrationFieldDefinition,
} from "@/lib/registrationFields";

export async function listRegistrationFields(): Promise<RegistrationFieldDefinition[]> {
  await checkAdminAccess();
  return loadActiveRegistrationFields();
}

export async function createRegistrationField(
  label: string,
  required: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkAdminAccess();
    const trimmed = label.trim();
    if (!trimmed) return { ok: false, error: "Bezeichnung fehlt" };

    let fieldKey = fieldKeyFromLabel(trimmed);
    const { data: existing } = await supabase
      .from("registration_field_definitions")
      .select("field_key")
      .ilike("field_key", `${fieldKey}%`)
      .is("deleted_at", null);

    const keys = new Set((existing ?? []).map((r) => r.field_key));
    if (keys.has(fieldKey)) {
      let n = 2;
      while (keys.has(`${fieldKey}_${n}`)) n++;
      fieldKey = `${fieldKey}_${n}`;
    }

    const { data: maxRow } = await supabase
      .from("registration_field_definitions")
      .select("sort_order")
      .is("deleted_at", null)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sortOrder = (maxRow?.sort_order ?? 0) + 10;

    const { error } = await supabase.from("registration_field_definitions").insert({
      field_key: fieldKey,
      label: trimmed,
      required,
      sort_order: sortOrder,
      is_system: false,
      updated_by: user.id,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/einstellungen/registrierung");
    revalidatePath("/registrierung");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fehler beim Anlegen",
    };
  }
}

export async function updateRegistrationField(
  id: string,
  input: { label?: string; required?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkAdminAccess();
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    if (input.label !== undefined) {
      const trimmed = input.label.trim();
      if (!trimmed) return { ok: false, error: "Bezeichnung fehlt" };
      patch.label = trimmed;
    }
    if (input.required !== undefined) patch.required = input.required;

    const { error } = await supabase
      .from("registration_field_definitions")
      .update(patch)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/einstellungen/registrierung");
    revalidatePath("/registrierung");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fehler beim Speichern",
    };
  }
}

export async function deleteRegistrationField(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkAdminAccess();

    const { data: field } = await supabase
      .from("registration_field_definitions")
      .select("is_system, field_key")
      .eq("id", id)
      .maybeSingle();

    if (!field) return { ok: false, error: "Feld nicht gefunden" };
    if (field.is_system) {
      return { ok: false, error: "Systemfelder können nicht gelöscht werden." };
    }

    const { error } = await supabase
      .from("registration_field_definitions")
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin/einstellungen/registrierung");
    revalidatePath("/registrierung");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fehler beim Löschen",
    };
  }
}
