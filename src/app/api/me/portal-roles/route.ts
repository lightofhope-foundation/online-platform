import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles, resolveRoleViewOptions } from "@/lib/userRoles";

export async function GET() {
  const user = await getAuthUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = await getUserPortalRoles(user.id);
  return NextResponse.json({
    roles,
    views: resolveRoleViewOptions(roles),
  });
}
