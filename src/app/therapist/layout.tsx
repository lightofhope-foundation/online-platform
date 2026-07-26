import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";

export const dynamic = "force-dynamic";

export default async function TherapistLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    redirect("/login");
  }

  try {
    const roles = await getUserPortalRoles(user.id);
    if (!userHasPortalRole(roles, "therapist")) {
      redirect("/");
    }
  } catch (e) {
    console.error("TherapistLayout profile check failed:", e);
    redirect("/");
  }

  return <AppShell contentWidth="wide">{children}</AppShell>;
}
