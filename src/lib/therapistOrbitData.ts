import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import {
  computeSessionMilestoneProgress,
  type SessionMilestoneProgress,
} from "@/lib/orbitProgress";
import { ensureTherapySessionsSeeded } from "@/lib/therapySessions";

type AdminClient = SupabaseClient<Database>;

export type OrbitSide = "left" | "right";

export type OrbitClientNode = {
  user_id: string;
  client_id: string | null;
  label: string;
  detail_href: string | null;
  progress: SessionMilestoneProgress;
  pos_y: number;
  side: OrbitSide;
};

export type TherapistOrbitData = {
  therapist: {
    user_id: string;
    label: string;
    email: string | null;
  };
  clients: OrbitClientNode[];
};

function clampPosY(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function defaultSide(index: number): OrbitSide {
  return index % 2 === 0 ? "left" : "right";
}

function defaultPosY(index: number, total: number): number {
  if (total <= 1) return 0.5;
  return (index + 0.5) / total;
}

export async function loadTherapistOrbitData(
  supabase: AdminClient,
  therapistUserId: string,
  options: {
    clientDetailHref: (client: {
      user_id: string;
      client_id: string | null;
    }) => string | null;
  }
): Promise<TherapistOrbitData | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, role")
    .eq("user_id", therapistUserId)
    .maybeSingle();

  if (!profile || profile.role !== "therapist") return null;

  const { data: authUserRes } = await supabase.auth.admin.getUserById(
    therapistUserId
  );
  const email = authUserRes?.user?.email ?? null;
  const therapistLabel = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    email,
    profile.display_alias
  );

  const { data: assignments } = await supabase
    .from("clients")
    .select("user_id")
    .eq("therapist_user_id", therapistUserId)
    .is("deleted_at", null);

  const clientIds = (assignments ?? []).map((a) => a.user_id);
  if (clientIds.length === 0) {
    return {
      therapist: {
        user_id: therapistUserId,
        label: therapistLabel,
        email,
      },
      clients: [],
    };
  }

  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, client_id")
    .in("user_id", clientIds)
    .eq("role", "client");

  const sortedClients = [...(clientProfiles ?? [])].sort((a, b) => {
    const la = resolvePersonLabel(
      a.first_name,
      a.last_name,
      null,
      a.display_alias
    );
    const lb = resolvePersonLabel(
      b.first_name,
      b.last_name,
      null,
      b.display_alias
    );
    return la.localeCompare(lb, "de");
  });

  await Promise.all(
    sortedClients.map((c) => ensureTherapySessionsSeeded(supabase, c.user_id))
  );

  const { data: sessions } = await supabase
    .from("therapy_sessions")
    .select("client_user_id, is_special, released_to_client")
    .in("client_user_id", clientIds);

  const sessionsByClient = new Map<
    string,
    Array<{ is_special: boolean; released_to_client: boolean }>
  >();
  for (const row of sessions ?? []) {
    const list = sessionsByClient.get(row.client_user_id) ?? [];
    list.push({
      is_special: row.is_special,
      released_to_client: row.released_to_client,
    });
    sessionsByClient.set(row.client_user_id, list);
  }

  const { data: layouts } = await supabase
    .from("therapist_orbit_layout")
    .select("client_user_id, pos_y, side")
    .eq("therapist_user_id", therapistUserId);

  const layoutByClient = new Map(
    (layouts ?? []).map((row) => [
      row.client_user_id,
      {
        pos_y: Number(row.pos_y),
        side: row.side === "right" ? ("right" as const) : ("left" as const),
      },
    ])
  );

  const missingLayouts: Array<{
    therapist_user_id: string;
    client_user_id: string;
    pos_y: number;
    side: OrbitSide;
  }> = [];

  const clients: OrbitClientNode[] = sortedClients.map((c, index) => {
    const existing = layoutByClient.get(c.user_id);
    const side = existing?.side ?? defaultSide(index);
    const pos_y = existing
      ? clampPosY(existing.pos_y)
      : defaultPosY(index, sortedClients.length);

    if (!existing) {
      missingLayouts.push({
        therapist_user_id: therapistUserId,
        client_user_id: c.user_id,
        pos_y,
        side,
      });
    }

    return {
      user_id: c.user_id,
      client_id: c.client_id,
      label: resolvePersonLabel(
        c.first_name,
        c.last_name,
        null,
        c.display_alias
      ),
      detail_href: options.clientDetailHref({
        user_id: c.user_id,
        client_id: c.client_id,
      }),
      progress: computeSessionMilestoneProgress(
        sessionsByClient.get(c.user_id) ?? []
      ),
      pos_y,
      side,
    };
  });

  if (missingLayouts.length > 0) {
    const now = new Date().toISOString();
    await supabase.from("therapist_orbit_layout").upsert(
      missingLayouts.map((row) => ({
        ...row,
        created_at: now,
        updated_at: now,
      })),
      { onConflict: "therapist_user_id,client_user_id" }
    );
  }

  return {
    therapist: {
      user_id: therapistUserId,
      label: therapistLabel,
      email,
    },
    clients,
  };
}
