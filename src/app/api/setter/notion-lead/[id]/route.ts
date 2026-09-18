import { NextResponse } from "next/server";

import { fetchMetaLeadById } from "@/lib/notion/metaLeads";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import {
  getUserPortalRoles,
  userHasPortalRole,
  userHasSalesAccess,
} from "@/lib/userRoles";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const roles = await getUserPortalRoles(user.id);
  const allowed =
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasSalesAccess(roles);
  if (!allowed) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Ungültige ID" }, { status: 400 });
  }

  const { lead, error, fetchedAt } = await fetchMetaLeadById(id);
  if (error) {
    return NextResponse.json({ error, fetchedAt }, { status: 502 });
  }
  if (!lead) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ lead, fetchedAt });
}
