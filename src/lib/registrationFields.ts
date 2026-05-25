import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type RegistrationFieldDefinition = {
  id: string;
  field_key: string;
  label: string;
  required: boolean;
  sort_order: number;
  is_system: boolean;
};

const SYSTEM_PROFILE_KEYS = new Set([
  "first_name",
  "last_name",
  "date_of_birth",
  "street",
  "house_number",
]);

export function isSystemProfileField(fieldKey: string): boolean {
  return SYSTEM_PROFILE_KEYS.has(fieldKey);
}

export async function loadActiveRegistrationFields(): Promise<
  RegistrationFieldDefinition[]
> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("registration_field_definitions")
    .select("id, field_key, label, required, sort_order, is_system")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as RegistrationFieldDefinition[];
}

export function fieldKeyFromLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "feld";
}

export type ProfileFieldValues = {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  street: string | null;
  house_number: string | null;
};

export function mapValuesToProfile(
  fields: RegistrationFieldDefinition[],
  values: Record<string, string>
): { profile: ProfileFieldValues; custom: { field_id: string; value: string }[] } {
  const profile: ProfileFieldValues = {
    first_name: null,
    last_name: null,
    date_of_birth: null,
    street: null,
    house_number: null,
  };
  const custom: { field_id: string; value: string }[] = [];

  for (const field of fields) {
    const raw = values[field.field_key]?.trim() ?? "";
    if (isSystemProfileField(field.field_key)) {
      const key = field.field_key as keyof ProfileFieldValues;
      profile[key] = raw || null;
    } else if (raw) {
      custom.push({ field_id: field.id, value: raw });
    }
  }

  return { profile, custom };
}

export function validateRegistrationInput(
  fields: RegistrationFieldDefinition[],
  values: Record<string, string>,
  email: string,
  password: string
): string | null {
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Bitte eine gültige E-Mail-Adresse eingeben.";
  }
  if (password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen haben.";
  }

  for (const field of fields) {
    const v = values[field.field_key]?.trim() ?? "";
    if (field.required && !v) {
      return `„${field.label}“ ist ein Pflichtfeld.`;
    }
  }

  return null;
}
