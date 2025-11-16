import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const email = (user?.email ?? "").toLowerCase();
  const emailWhitelisted = ["info@oag-media.com"].includes(email);
  const isAdmin = (profile?.role === "admin") || emailWhitelisted;

  if (!isAdmin) {
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}


