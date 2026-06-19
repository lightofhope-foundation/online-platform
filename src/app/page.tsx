import { redirect } from "next/navigation";
import { getProfileRole, isAdminEmail } from "@/lib/authRoles";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthUserFromCookie();
  if (user && !isAdminEmail(user.email)) {
    const role = await getProfileRole(user.id);
    if (role === "therapist") redirect("/therapist");
    if (role === "admin") redirect("/admin");
  }

  return <HomeClient />;
}
