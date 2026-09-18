import { redirect } from "next/navigation";
import { resolvePostLoginPath } from "@/lib/authRoles";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthUserFromCookie();
  if (user) {
    const dest = await resolvePostLoginPath(user.id, user.email ?? "");
    if (dest !== "/") redirect(dest);
  }

  return <HomeClient />;
}
