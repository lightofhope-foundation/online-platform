import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";

/** True if the user has the admin portal role (profile or extras). No email whitelist. */
export async function userIsAdmin(userId: string): Promise<boolean> {
  const roles = await getUserPortalRoles(userId);
  return userHasPortalRole(roles, "admin");
}

export async function checkAdminAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const supabase = getSupabaseAdminClient();
  if (!(await userIsAdmin(user.id))) {
    throw new Error("Nicht autorisiert");
  }

  return { user, supabase };
}
