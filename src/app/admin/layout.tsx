import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { userIsAdmin } from "@/lib/checkAdminAccess";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    redirect("/login");
  }

  if (!(await userIsAdmin(user.id))) {
    redirect("/");
  }

  return <AppShell contentWidth="wide">{children}</AppShell>;
}
