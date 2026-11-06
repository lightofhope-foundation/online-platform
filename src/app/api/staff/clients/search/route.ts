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

  // Soft-release: plattformweit für alle Staff — ohne N+1 Auth-Lookups
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("user_id, first_name, last_name, client_id, display_alias")
    .eq("role", "client")
    .not("client_id", "is", null)
    .or(
      `first_name.ilike.${like},last_name.ilike.${like},client_id.ilike.${like},display_alias.ilike.${like}`
    )
    .limit(20);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = profiles ?? [];
  if (list.length === 0) {
    return NextResponse.json({ results: [] as SearchHit[], matchCount: 0 });
  }

  const userIds = list.map((p) => p.user_id);
  const { data: clientRows } = await admin
    .from("clients")
    .select("user_id, therapist_user_id, intake_data")
    .in("user_id", userIds);

  const clientByUser = new Map((clientRows ?? []).map((c) => [c.user_id, c]));
  const therapistIds = [
    ...new Set(
      (clientRows ?? [])
        .map((c) => c.therapist_user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const therapistLabelById = new Map<string, string>();
  if (therapistIds.length > 0) {
    const { data: therapists } = await admin
      .from("profiles")
      .select("user_id, first_name, last_name, display_alias")
      .in("user_id", therapistIds);
    for (const tp of therapists ?? []) {
      therapistLabelById.set(
        tp.user_id,
        resolvePersonLabel(tp.first_name, tp.last_name, null, tp.display_alias)
      );
    }
  }

  const hits: SearchHit[] = [];
  for (const p of list) {
    if (!p.client_id) continue;
    const clientRow = clientByUser.get(p.user_id);
    const intake =
      clientRow?.intake_data &&
      typeof clientRow.intake_data === "object" &&
      !Array.isArray(clientRow.intake_data)
        ? (clientRow.intake_data as Record<string, unknown>)
        : {};
    const email =
      typeof intake.email === "string" && intake.email.trim()
        ? intake.email.trim()
        : null;
    const name = resolvePersonLabel(
      p.first_name,
      p.last_name,
      email,
      p.display_alias
    );
    const therapistLabel = clientRow?.therapist_user_id
      ? therapistLabelById.get(clientRow.therapist_user_id) ?? null
      : null;

    hits.push({
      clientId: p.client_id,
      name,
      email,
      therapistLabel,
      href: hrefForRoles(roles, p.client_id),
    });
  }

  return NextResponse.json({ results: hits, matchCount: hits.length });
}
