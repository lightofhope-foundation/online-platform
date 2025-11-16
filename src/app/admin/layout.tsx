import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    // Log profile error but don't crash - allow email whitelist to work
    if (profileError) {
      console.error("Error fetching profile:", profileError);
    }

    const email = (user?.email ?? "").toLowerCase();
    const emailWhitelisted = ["info@oag-media.com"].includes(email);
    const isAdmin = (profile?.role === "admin") || emailWhitelisted;

    if (!isAdmin) {
      redirect("/");
    }

    return <AppShell>{children}</AppShell>;
  } catch (error) {
    console.error("Admin layout error:", error);
    redirect("/login");
  }
}


