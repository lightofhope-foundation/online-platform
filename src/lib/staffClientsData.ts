import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import {
  normalizePipelineStatus,
  type PipelineStatus,
} from "@/lib/pipelineStatus";

export type StaffPersonRow = {
  user_id: string;
  client_id: string | null;
  name: string;
  email: string | null;
  therapist_user_id: string | null;
  therapist_label: string;
  pipeline_status: PipelineStatus;
  created_at: string;
  detail_href: string;
};

export type TherapistGroup = {
  therapistKey: string;
  therapistLabel: string;
  rows: StaffPersonRow[];
};

type ProfileRow = {
  user_id: string;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_alias: string | null;
  created_at: string;
};

function detailHrefForArea(
  area: "admin" | "therapist" | "setter" | "teamlead",
  clientId: string
): string {
  const slug = clientId.toLowerCase();
  if (area === "admin") return `/admin/users/${slug}/info`;
  if (area === "therapist") return `/therapist/clients/${slug}`;
  return `/setter/users/${slug}`;
}

async function loadTherapistLabels(
  supabase: SupabaseClient,
  therapistIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (therapistIds.length === 0) return map;
  const { data } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias")
    .in("user_id", therapistIds);
  for (const p of data ?? []) {
    map.set(
      p.user_id,
      resolvePersonLabel(p.first_name, p.last_name, null, p.display_alias)
    );
  }
  return map;
}

/**
 * Lightweight staff lists — no Notion, no auth.admin.listUsers.
 * Email comes from intake_data when present.
 */
export async function fetchStaffPipelineRows(
  supabase: SupabaseClient,
  opts: {
    pipelineStatuses: PipelineStatus[];
    area: "admin" | "therapist" | "setter" | "teamlead";
    onlyTherapistUserId?: string | null;
    onlyErstgespraechlerUserId?: string | null;
  }
): Promise<StaffPersonRow[]> {
  let clientsQuery = supabase
    .from("clients")
    .select(
      "user_id, therapist_user_id, erstgespraechler_user_id, pipeline_status, intake_data, created_at"
    )
    .is("deleted_at", null)
    .in("pipeline_status", opts.pipelineStatuses);

  if (opts.onlyTherapistUserId) {
    clientsQuery = clientsQuery.eq("therapist_user_id", opts.onlyTherapistUserId);
  }
  if (opts.onlyErstgespraechlerUserId) {
    clientsQuery = clientsQuery.eq(
      "erstgespraechler_user_id",
      opts.onlyErstgespraechlerUserId
    );
  }

  const { data: clientRows } = await clientsQuery;
  const clients = clientRows ?? [];
  if (clients.length === 0) return [];

  const userIds = clients.map((c) => c.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, client_id, first_name, last_name, display_alias, created_at")
    .in("user_id", userIds)
    .eq("role", "client");

  const profileById = new Map<string, ProfileRow>(
    (profiles ?? []).map((p) => [p.user_id, p])
  );

  const therapistIds = [
    ...new Set(
      clients
        .map((c) => c.therapist_user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const therapistLabels = await loadTherapistLabels(supabase, therapistIds);

  const rows: StaffPersonRow[] = [];
  for (const c of clients) {
    const p = profileById.get(c.user_id);
    if (!p?.client_id) continue;
    const intake =
      c.intake_data && typeof c.intake_data === "object" && !Array.isArray(c.intake_data)
        ? (c.intake_data as Record<string, unknown>)
        : {};
    const email =
      typeof intake.email === "string" && intake.email.trim()
        ? intake.email.trim()
        : null;
    const status = normalizePipelineStatus(c.pipeline_status);
    rows.push({
      user_id: c.user_id,
      client_id: p.client_id,
      name: resolvePersonLabel(
        p.first_name,
        p.last_name,
        email,
        p.display_alias
      ),
      email,
      therapist_user_id: c.therapist_user_id,
      therapist_label: c.therapist_user_id
        ? therapistLabels.get(c.therapist_user_id) ?? "Therapeut"
        : "— ohne Therapeut —",
      pipeline_status: status,
      created_at: c.created_at ?? p.created_at,
      detail_href: detailHrefForArea(opts.area, p.client_id),
    });
  }

  rows.sort((a, b) => {
    const t = a.therapist_label.localeCompare(b.therapist_label, "de");
    if (t !== 0) return t;
    return a.name.localeCompare(b.name, "de");
  });

  return rows;
}

export function groupRowsByTherapist(rows: StaffPersonRow[]): TherapistGroup[] {
  const groups = new Map<string, TherapistGroup>();
  for (const row of rows) {
    const key = row.therapist_user_id ?? "__none__";
    if (!groups.has(key)) {
      groups.set(key, {
        therapistKey: key,
        therapistLabel: row.therapist_label,
        rows: [],
      });
    }
    groups.get(key)!.rows.push(row);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.therapistKey === "__none__") return 1;
    if (b.therapistKey === "__none__") return -1;
    return a.therapistLabel.localeCompare(b.therapistLabel, "de");
  });
}
