import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { resolvePostLoginPath } from "@/lib/authRoles";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

/** Persistent shell + background for all client routes (avoids white flash on navigation). */
export default async function ClientAreaLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUserFromCookie();
  if (!user) redirect("/login");

  const dest = await resolvePostLoginPath(user.id, user.email ?? "");
  if (dest !== "/") redirect(dest);

  return <AppShell>{children}</AppShell>;
}
