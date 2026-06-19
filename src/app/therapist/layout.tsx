import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function TherapistLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    redirect("/login");
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "therapist") {
      redirect("/");
    }
  } catch (e) {
    console.error("TherapistLayout profile check failed:", e);
    redirect("/");
  }

  return <AppShell>{children}</AppShell>;
}
