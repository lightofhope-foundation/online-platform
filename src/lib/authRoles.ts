import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { UserRole } from "@/lib/profileRole";

export type { UserRole } from "@/lib/profileRole";

const ADMIN_EMAIL_WHITELIST = "info@oag-media.com";

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === ADMIN_EMAIL_WHITELIST;
}

export async function getProfileRole(userId: string): Promise<UserRole | null> {
  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  return (profile?.role as UserRole | undefined) ?? null;
}

export async function resolvePostLoginPath(
  userId: string,
  email: string
): Promise<string> {
  if (isAdminEmail(email)) return "/admin";

  const role = await getProfileRole(userId);
  if (role === "admin") return "/admin";
  if (role === "therapist") return "/therapist";
  return "/";
}

export async function checkTherapistAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "therapist") {
    throw new Error("Nicht autorisiert");
  }

  return { user, supabase, profile };
}
