import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { UserRole } from "@/lib/profileRole";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";

export type { UserRole } from "@/lib/profileRole";

/** @deprecated Email whitelist removed — admin is profile-based only. */
export function isAdminEmail(_email: string | null | undefined): boolean {
  return false;
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
  _email: string
): Promise<string> {
  const roles = await getUserPortalRoles(userId);
  if (userHasPortalRole(roles, "admin")) return "/admin";
  if (userHasPortalRole(roles, "teamlead")) return "/teamlead";
  if (userHasPortalRole(roles, "therapist")) return "/therapist";
  if (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "setter_closer")
  ) {
    return "/setter";
  }
  return "/";
}

export async function checkTherapistAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const roles = await getUserPortalRoles(user.id);
  if (!userHasPortalRole(roles, "therapist") && !userHasPortalRole(roles, "admin")) {
    throw new Error("Nicht autorisiert");
  }

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, supabase, profile, roles };
}
