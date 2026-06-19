import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    redirect("/login");
  }

  const emailWhitelisted = user.email === "info@oag-media.com";

  let isAdmin = emailWhitelisted;
  let profileRole: string | null = null;

  if (!isAdmin) {
    try {
      const admin = getSupabaseAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      profileRole = profile?.role ?? null;
      if (profile?.role === "admin") {
        isAdmin = true;
      }
    } catch (e) {
      console.error("AdminLayout profile check failed:", e);
    }
  }

  if (!isAdmin) {
    if (profileRole === "therapist") {
      redirect("/therapist");
    }
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}
