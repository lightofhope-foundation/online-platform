"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type ProfileSelfSettingsInput = {
  displayName: string | null;
  phoneNumber: string | null;
};

export type StaffProfileSettingsInput = ProfileSelfSettingsInput & {
  zoomMeetingUrl: string | null;
  calendlyUrl: string | null;
  portalRole: "therapist" | "setter_closer" | "admin";
};

function normalizeUrl(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 512);
}

function normalizePhone(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed;
}

export async function updateProfileSelfSettings(input: ProfileSelfSettingsInput) {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht angemeldet");

  const supabase = getSupabaseAdminClient();
  const displayAlias = input.displayName?.trim() ?? "";
  const phoneNumber = normalizePhone(input.phoneNumber);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profil nicht gefunden");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_alias: displayAlias.length > 0 ? displayAlias.slice(0, 64) : null,
      phone_number: phoneNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "profile_self_settings_updated",
    entity: "profiles",
    entity_id: profile.client_id ?? user.id,
    before: null,
    after: {
      display_alias: displayAlias.length > 0 ? displayAlias.slice(0, 64) : null,
      phone_number: phoneNumber,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/therapist/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/einstellungen/profil");
  revalidatePath("/admin/users");
  revalidatePath("/admin/therapists");

  revalidatePath("/setter/settings");

  return { ok: true as const };
}

export async function updateStaffProfileSettings(input: StaffProfileSettingsInput) {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht angemeldet");

  const supabase = getSupabaseAdminClient();
  const displayAlias = input.displayName?.trim() ?? "";
  const phoneNumber = normalizePhone(input.phoneNumber);
  const zoomMeetingUrl = normalizeUrl(input.zoomMeetingUrl);
  const calendlyUrl = normalizeUrl(input.calendlyUrl);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Profil nicht gefunden");
  }

  const allowed =
    input.portalRole === "admin"
      ? profile.role === "admin"
      : profile.role === input.portalRole ||
        (await import("@/lib/userRoles")).userHasPortalRoleById(
          user.id,
          input.portalRole
        );

  if (!allowed) {
    throw new Error("Keine Berechtigung für diese Einstellungen");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_alias: displayAlias.length > 0 ? displayAlias.slice(0, 64) : null,
      phone_number: phoneNumber,
      zoom_meeting_url: zoomMeetingUrl,
      calendly_url: calendlyUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/therapist/settings");
  revalidatePath("/setter/settings");
  revalidatePath("/admin/einstellungen/profil");

  return { ok: true as const };
}
