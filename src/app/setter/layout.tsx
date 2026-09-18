import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles, userHasPortalRole, userHasSalesAccess } from "@/lib/userRoles";

export const dynamic = "force-dynamic";

export default async function SetterLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const roles = await getUserPortalRoles(user.id);
  const allowed =
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasSalesAccess(roles);
  if (!allowed) {
    redirect("/");
  }

  return <AppShell contentWidth="wide">{children}</AppShell>;
}
