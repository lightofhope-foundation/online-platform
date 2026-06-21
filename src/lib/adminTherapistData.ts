import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type TherapistOption = {
  user_id: string;
  label: string;
};

export type ClientOption = {
  user_id: string;
  client_id: string | null;
  label: string;
};

export type TherapistWithClients = {
  user_id: string;
  label: string;
  email: string;
  clients: {
    user_id: string;
    client_id: string | null;
    label: string;
    detail_href: string | null;
  }[];
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  display_alias: string | null;
  client_id: string | null;
};

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

function profileLabel(p: ProfileRow, email?: string | null) {
  return resolvePersonLabel(p.first_name, p.last_name, email ?? null, p.display_alias);
}

export async function fetchTherapistOptions(
  supabase: AdminClient
): Promise<TherapistOption[]> {
  const { data: therapists } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias")
    .eq("role", "therapist")
    .order("created_at", { ascending: true });

  const therapistIds = (therapists ?? []).map((t) => t.user_id);
  const emailById = new Map<string, string>();
  if (therapistIds.length > 0) {
    const { data: authUsersRes } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of authUsersRes?.users ?? []) {
      if (therapistIds.includes(u.id) && u.email) emailById.set(u.id, u.email);
    }
  }

  return (therapists ?? []).map((t) => ({
    user_id: t.user_id,
    label: profileLabel(t as ProfileRow, emailById.get(t.user_id)),
  }));
}

export async function fetchUnassignedClientOptions(
  supabase: AdminClient
): Promise<ClientOption[]> {
  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, client_id")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const userIds = (clientProfiles ?? []).map((p) => p.user_id);
  const assignmentByUser = new Map<string, string | null>();

  if (userIds.length > 0) {
    const { data: assignments } = await supabase
      .from("clients")
      .select("user_id, therapist_user_id")
      .in("user_id", userIds)
      .is("deleted_at", null);

    (assignments ?? []).forEach((row) => {
      assignmentByUser.set(row.user_id, row.therapist_user_id);
    });
  }

  return (clientProfiles ?? [])
    .filter((p) => !assignmentByUser.get(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      client_id: p.client_id,
      label: `${profileLabel(p as ProfileRow)}${p.client_id ? ` (${p.client_id})` : ""}`,
    }));
}

export async function fetchTherapistsWithClients(supabase: AdminClient): Promise<{
  therapists: TherapistWithClients[];
  unassigned: ClientOption[];
}> {
  const { data: therapists } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias")
    .eq("role", "therapist")
    .order("created_at", { ascending: true });

  const therapistIds = (therapists ?? []).map((t) => t.user_id);
  const emailById = new Map<string, string>();

  if (therapistIds.length > 0) {
    const { data: authUsersRes } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    for (const u of authUsersRes?.users ?? []) {
      if (therapistIds.includes(u.id) && u.email) emailById.set(u.id, u.email);
    }
  }

  const assignmentsByTherapist = new Map<string, string[]>();
  const therapistByClient = new Map<string, string | null>();

  const { data: allAssignments } = await supabase
    .from("clients")
    .select("user_id, therapist_user_id")
    .is("deleted_at", null);

  (allAssignments ?? []).forEach((row) => {
    therapistByClient.set(row.user_id, row.therapist_user_id);
    if (row.therapist_user_id) {
      const list = assignmentsByTherapist.get(row.therapist_user_id) ?? [];
      list.push(row.user_id);
      assignmentsByTherapist.set(row.therapist_user_id, list);
    }
  });

  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, client_id")
    .eq("role", "client");

  const clientByUserId = new Map(
    (clientProfiles ?? []).map((p) => [p.user_id, p as ProfileRow])
  );

  const therapistsWithClients: TherapistWithClients[] = (therapists ?? []).map((t) => {
    const clientUserIds = assignmentsByTherapist.get(t.user_id) ?? [];
    const clients = clientUserIds
      .map((uid) => clientByUserId.get(uid))
      .filter(Boolean)
      .map((p) => ({
        user_id: p!.user_id,
        client_id: p!.client_id,
        label: profileLabel(p!),
        detail_href: p!.client_id
          ? `/admin/users/${p!.client_id.toLowerCase()}`
          : null,
      }))
      .sort((a, b) => (a.client_id ?? "").localeCompare(b.client_id ?? ""));

    return {
      user_id: t.user_id,
      label: profileLabel(t as ProfileRow, emailById.get(t.user_id)),
      email: emailById.get(t.user_id) ?? "—",
      clients,
    };
  });

  const unassigned = (clientProfiles ?? [])
    .filter((p) => !therapistByClient.get(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      client_id: p.client_id,
      label: `${profileLabel(p as ProfileRow)}${p.client_id ? ` (${p.client_id})` : ""}`,
    }))
    .sort((a, b) => (a.client_id ?? "").localeCompare(b.client_id ?? ""));

  return { therapists: therapistsWithClients, unassigned };
}

export async function fetchClientTherapistMap(
  supabase: AdminClient
): Promise<Map<string, { therapist_user_id: string; label: string }>> {
  const { data: assignments } = await supabase
    .from("clients")
    .select("user_id, therapist_user_id")
    .not("therapist_user_id", "is", null)
    .is("deleted_at", null);

  const therapistIds = [
    ...new Set((assignments ?? []).map((a) => a.therapist_user_id).filter(Boolean)),
  ] as string[];

  const labelByTherapist = new Map<string, string>();
  if (therapistIds.length > 0) {
    const { data: therapistProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, display_alias")
      .in("user_id", therapistIds);

    (therapistProfiles ?? []).forEach((t) => {
      labelByTherapist.set(t.user_id, profileLabel(t as ProfileRow));
    });
  }

  const result = new Map<string, { therapist_user_id: string; label: string }>();
  (assignments ?? []).forEach((row) => {
    if (!row.therapist_user_id) return;
    result.set(row.user_id, {
      therapist_user_id: row.therapist_user_id,
      label: labelByTherapist.get(row.therapist_user_id) ?? "Therapeut",
    });
  });

  return result;
}
