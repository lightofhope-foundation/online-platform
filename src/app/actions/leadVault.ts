"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles, userHasPortalRole } from "@/lib/userRoles";
import type { LeadVaultArea, LeadVaultBoard, LeadIntakeView } from "@/lib/leadVault";
import { parseIntake } from "@/lib/leadVault";

async function requireLeadVaultAccess(): Promise<{
  userId: string;
  area: LeadVaultArea;
}> {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht angemeldet");

  const roles = await getUserPortalRoles(user.id);
  const isAdmin = userHasPortalRole(roles, "admin");
  // Teamlead: später userHasPortalRole(roles, "teamlead") — gleicher Vault-Zugang
  if (!isAdmin) {
    throw new Error("Klientenakte (Schachteln) nur für Admin / Teamlead");
  }

  return {
    userId: user.id,
    area: "admin",
  };
}

function mapBoard(
  row: {
    id: string;
    parent_id: string | null;
    title: string;
    kind: string;
    accent: string;
    icon_key: string | null;
    pos_x: number;
    pos_y: number;
    sort_order: number;
    client_user_id: string | null;
    meta: unknown;
    created_at: string;
    updated_at: string;
  },
  childCount = 0
): LeadVaultBoard {
  return {
    id: row.id,
    parent_id: row.parent_id,
    title: row.title,
    kind: row.kind as LeadVaultBoard["kind"],
    accent: row.accent,
    icon_key: row.icon_key,
    pos_x: row.pos_x,
    pos_y: row.pos_y,
    sort_order: row.sort_order,
    client_user_id: row.client_user_id,
    meta: row.meta as LeadVaultBoard["meta"],
    created_at: row.created_at,
    updated_at: row.updated_at,
    child_count: childCount,
  };
}

export async function loadLeadVaultChildren(
  parentId: string | null
): Promise<LeadVaultBoard[]> {
  await requireLeadVaultAccess();
  const supabase = getSupabaseAdminClient();

  let query = supabase
    .from("lead_vault_boards")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("pos_y", { ascending: true })
    .order("pos_x", { ascending: true });

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const boards = data ?? [];
  if (boards.length === 0) return [];

  const ids = boards.map((b) => b.id);
  const { data: children } = await supabase
    .from("lead_vault_boards")
    .select("parent_id")
    .in("parent_id", ids);

  const counts = new Map<string, number>();
  for (const c of children ?? []) {
    if (!c.parent_id) continue;
    counts.set(c.parent_id, (counts.get(c.parent_id) ?? 0) + 1);
  }

  return boards.map((b) => mapBoard(b, counts.get(b.id) ?? 0));
}

export async function loadLeadVaultBoard(
  boardId: string
): Promise<LeadVaultBoard | null> {
  await requireLeadVaultAccess();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("lead_vault_boards")
    .select("*")
    .eq("id", boardId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { count } = await supabase
    .from("lead_vault_boards")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", boardId);

  return mapBoard(data, count ?? 0);
}

export async function loadLeadVaultBreadcrumbs(
  boardId: string | null
): Promise<LeadVaultBoard[]> {
  await requireLeadVaultAccess();
  if (!boardId) return [];

  const supabase = getSupabaseAdminClient();
  const chain: LeadVaultBoard[] = [];
  let currentId: string | null = boardId;

  for (let i = 0; i < 32 && currentId; i++) {
    const { data } = await supabase
      .from("lead_vault_boards")
      .select("*")
      .eq("id", currentId)
      .maybeSingle();
    if (!data) break;
    chain.unshift(mapBoard(data));
    currentId = data.parent_id as string | null;
  }

  return chain;
}

export type LeadDetailPayload = {
  board: LeadVaultBoard;
  intake: LeadIntakeView;
  clientName: string;
  clientId: string | null;
  accessRevoked: boolean;
};

export async function loadLeadDetail(
  boardId: string
): Promise<LeadDetailPayload | null> {
  await requireLeadVaultAccess();
  const board = await loadLeadVaultBoard(boardId);
  if (!board || board.kind !== "lead" || !board.client_user_id) return null;

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, client_id")
    .eq("user_id", board.client_user_id)
    .maybeSingle();

  const { data: client } = await supabase
    .from("clients")
    .select("intake_data, access_revoked, therapist_user_id")
    .eq("user_id", board.client_user_id)
    .maybeSingle();

  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    board.title;

  return {
    board,
    intake: parseIntake(client?.intake_data),
    clientName: name,
    clientId: profile?.client_id ?? null,
    accessRevoked: client?.access_revoked ?? false,
  };
}

export async function updateLeadVaultBoardPosition(
  boardId: string,
  posX: number,
  posY: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireLeadVaultAccess();
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("lead_vault_boards")
      .update({
        pos_x: Math.round(posX),
        pos_y: Math.round(posY),
        updated_at: new Date().toISOString(),
      })
      .eq("id", boardId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/lead-vault");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
