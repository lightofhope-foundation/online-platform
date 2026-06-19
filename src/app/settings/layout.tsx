import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getProfileRole, isAdminEmail } from "@/lib/authRoles";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  if (!isAdminEmail(user.email)) {
    const role = await getProfileRole(user.id);
    if (role === "therapist") redirect("/therapist");
    if (role === "admin") redirect("/admin");
  }

  return children;
}
