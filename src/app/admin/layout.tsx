import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Get the authenticated user from the Supabase auth cookie
  const user = await getAuthUserFromCookie();
  if (!user) {
    redirect("/login");
  }

  // Always allow the main admin email, even if profile/role is missing or misconfigured.
  const emailWhitelisted = user.email === "info@oag-media.com";

  let isAdmin = emailWhitelisted;

  // If not the whitelisted email, fall back to checking the profile role.
  if (!isAdmin) {
    try {
      const admin = getSupabaseAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        isAdmin = true;
      }
    } catch (e) {
      // If the admin client/env is misconfigured, we still allow the whitelisted email only.
      console.error("AdminLayout profile check failed:", e);
    }
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}


