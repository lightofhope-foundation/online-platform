import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";
import { isAdminEmail } from "@/lib/authRoles";

export const dynamic = "force-dynamic";

export default async function SetterLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  if (!isAdminEmail(user.email)) {
    const roles = await getUserPortalRoles(user.id);
    if (!userHasPortalRole(roles, "setter_closer")) {
      redirect("/");
    }
  }

  return <AppShell contentWidth="wide">{children}</AppShell>;
}
