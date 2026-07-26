import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { parseIntake, type LeadIntakeView } from "@/lib/leadVault";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

type AdminClient = SupabaseClient<Database>;

export type TherapistClientBoardItem = {
  userId: string;
  clientId: string;
  name: string;
  accessRevoked: boolean;
  archived: boolean;
  accent: string;
  href: string;
};

export type TherapistClientDetail = {
  userId: string;
  clientId: string;
  name: string;
  email: string | null;
  accessRevoked: boolean;
  archived: boolean;
  intake: LeadIntakeView;
  createdAt: string;
  lastLogin: string | null;
};

/** Load assigned clients for therapist Milanote board (active + archived). */
export async function loadTherapistClientBoard(
  supabase: AdminClient,
  therapistUserId: string
): Promise<{ active: TherapistClientBoardItem[]; archived: TherapistClientBoardItem[] }> {
  const { data: assignments, error } = await supabase
    .from("clients")
    .select("user_id, access_revoked, archived_at")
    .eq("therapist_user_id", therapistUserId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const rows = assignments ?? [];
  if (rows.length === 0) return { active: [], archived: [] };

  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, client_id, first_name, last_name, display_alias")
    .in("user_id", userIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  const active: TherapistClientBoardItem[] = [];
  const archived: TherapistClientBoardItem[] = [];

  for (const row of rows) {
    const profile = profileById.get(row.user_id);
    if (!profile?.client_id) continue;

    const name = resolvePersonLabel(
      profile.first_name,
      profile.last_name,
      null,
      profile.display_alias
    );
    const item: TherapistClientBoardItem = {
      userId: row.user_id,
      clientId: profile.client_id,
      name,
      accessRevoked: row.access_revoked,
      archived: Boolean(row.archived_at),
      accent: row.archived_at ? "yellow" : row.access_revoked ? "orange" : "green",
      href: `/therapist/clients/${profile.client_id.toLowerCase()}`,
    };

    if (row.archived_at) archived.push(item);
    else active.push(item);
  }

  active.sort((a, b) => a.name.localeCompare(b.name, "de"));
  archived.sort((a, b) => a.name.localeCompare(b.name, "de"));

  return { active, archived };
}

export async function loadTherapistClientDetail(
  supabase: AdminClient,
  therapistUserId: string,
  clientIdNormalized: string
): Promise<TherapistClientDetail | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role, created_at, first_name, last_name, client_id, display_alias")
    .eq("client_id", clientIdNormalized)
    .maybeSingle();

  if (!profile?.client_id || profile.role !== "client") return null;

  const { data: client } = await supabase
    .from("clients")
    .select("user_id, therapist_user_id, access_revoked, archived_at, intake_data")
    .eq("user_id", profile.user_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client || client.therapist_user_id !== therapistUserId) return null;

  const { data: authUserRes } = await supabase.auth.admin.getUserById(profile.user_id);
  const authUser = authUserRes?.user ?? null;

  const name = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    authUser?.email,
    profile.display_alias
  );

  return {
    userId: profile.user_id,
    clientId: profile.client_id,
    name,
    email: authUser?.email ?? null,
    accessRevoked: client.access_revoked,
    archived: Boolean(client.archived_at),
    intake: parseIntake(client.intake_data as Json),
    createdAt: profile.created_at,
    lastLogin: authUser?.last_sign_in_at ?? null,
  };
}
