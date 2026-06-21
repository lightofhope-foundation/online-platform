import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getProfileRole, isAdminEmail } from "@/lib/authRoles";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/** Persistent shell + background for all client routes (avoids white flash on navigation). */
export default async function ClientAreaLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  if (!isAdminEmail(user.email)) {
    const role = await getProfileRole(user.id);
    if (role === "therapist") redirect("/therapist");
    if (role === "admin") redirect("/admin");
  }

  return <AppShell>{children}</AppShell>;
}
