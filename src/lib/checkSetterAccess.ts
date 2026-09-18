import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getUserPortalRoles, userHasPortalRole, userHasSalesAccess } from "@/lib/userRoles";

export async function checkSetterAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const roles = await getUserPortalRoles(user.id);
  const isAdmin = userHasPortalRole(roles, "admin");
  if (!isAdmin && !userHasSalesAccess(roles)) {
    throw new Error("Nicht autorisiert");
  }

  const supabase = getSupabaseAdminClient();
  return { user, supabase, roles };
}
