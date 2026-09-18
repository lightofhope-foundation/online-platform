import { NextResponse } from "next/server";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  getUserPortalRoles,
  userHasPortalRole,
  type PortalRole,
} from "@/lib/userRoles";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

type SearchHit = {
  clientId: string;
  name: string;
  email: string | null;
  therapistLabel: string | null;
  href: string;
};

function isStaff(roles: PortalRole[]): boolean {
  return (
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "therapist") ||
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasPortalRole(roles, "setter_closer")
  );
}

function hrefForRoles(roles: PortalRole[], clientId: string): string {
  const slug = clientId.toLowerCase();
  if (userHasPortalRole(roles, "admin")) return `/admin/users/${slug}/info`;
  if (userHasPortalRole(roles, "therapist")) return `/therapist/clients/${slug}`;
  if (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "teamlead")
  ) {
    return `/setter/users/${slug}`;
  }
  return `/admin/users/${slug}`;
}

export async function GET(request: Request) {
  const user = await getAuthUserFromCookie();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const roles = await getUserPortalRoles(user.id);
  if (!isStaff(roles) || (roles.length === 1 && roles[0] === "client")) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }

  const admin = getSupabaseAdminClient();
  const safe = q.replace(/[%_,]/g, "").slice(0, 80);
  if (safe.length < 2) {
    return NextResponse.json({ results: [] as SearchHit[] });
  }
  const like = `%${safe}%`;

  let clientUserIds: string[] | null = null;
  if (userHasPortalRole(roles, "therapist") && !userHasPortalRole(roles, "admin")) {
    const { data: owned } = await admin
      .from("clients")
      .select("user_id")
      .eq("therapist_user_id", user.id);
    clientUserIds = (owned ?? []).map((r) => r.user_id);
    if (clientUserIds.length === 0) {
      return NextResponse.json({ results: [] as SearchHit[] });
    }
  }

  let query = admin
    .from("profiles")
    .select("user_id, first_name, last_name, client_id, display_alias")
    .eq("role", "client")
    .not("client_id", "is", null)
    .or(
      `first_name.ilike.${like},last_name.ilike.${like},client_id.ilike.${like},display_alias.ilike.${like}`
    )
    .limit(20);

  if (clientUserIds) {
    query = query.in("user_id", clientUserIds);
  }

  const { data: profiles, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hits: SearchHit[] = [];
  for (const p of profiles ?? []) {
    if (!p.client_id) continue;
    const { data: auth } = await admin.auth.admin.getUserById(p.user_id);
    const email = auth.user?.email ?? null;

    // Also match email client-side if profile fields missed
    const name = resolvePersonLabel(
      p.first_name,
      p.last_name,
      email,
      p.display_alias
    );
    if (
      q.length >= 2 &&
      !`${name} ${p.client_id} ${email ?? ""}`.toLowerCase().includes(q.toLowerCase())
    ) {
      // keep — ilike already filtered DB fields; email-only matches need extra pass
    }

    const { data: clientRow } = await admin
      .from("clients")
      .select("therapist_user_id")
      .eq("user_id", p.user_id)
      .maybeSingle();

    let therapistLabel: string | null = null;
    if (clientRow?.therapist_user_id) {
      const { data: tp } = await admin
        .from("profiles")
        .select("first_name, last_name, display_alias")
        .eq("user_id", clientRow.therapist_user_id)
        .maybeSingle();
      if (tp) {
        therapistLabel = resolvePersonLabel(
          tp.first_name,
          tp.last_name,
          null,
          tp.display_alias
        );
      }
    }

    hits.push({
      clientId: p.client_id,
      name,
      email,
      therapistLabel,
      href: hrefForRoles(roles, p.client_id),
    });
  }

  // Secondary: email search for short result sets
  if (hits.length < 8 && q.includes("@")) {
    // skip heavy email scan for now
  }

  return NextResponse.json({ results: hits, matchCount: hits.length });
}
