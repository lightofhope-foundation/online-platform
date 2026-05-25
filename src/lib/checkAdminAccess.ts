import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export async function checkAdminAccess() {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const emailWhitelisted = user.email === "info@oag-media.com";
  const isAdmin = profile?.role === "admin" || emailWhitelisted;
  if (!isAdmin) throw new Error("Nicht autorisiert");

  return { user, supabase };
}
