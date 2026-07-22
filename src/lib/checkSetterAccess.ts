import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/authRoles";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";

export async function checkSetterAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  if (isAdminEmail(user.email)) {
    const supabase = getSupabaseAdminClient();
    return { user, supabase, roles: await getUserPortalRoles(user.id) };
  }

  const roles = await getUserPortalRoles(user.id);
  if (!userHasPortalRole(roles, "setter_closer")) {
    throw new Error("Nicht autorisiert");
  }

  const supabase = getSupabaseAdminClient();
  return { user, supabase, roles };
}
