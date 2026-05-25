"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";

export async function getRegistrationInviteCode(): Promise<{
  ok: true;
  code: string;
  updatedAt: string | null;
} | { ok: false; error: string }> {
  try {
    const { supabase } = await checkAdminAccess();
    const { data: ensured, error: ensureError } = await supabase.rpc(
      "ensure_registration_invite_row"
    );
    if (ensureError) {
      return { ok: false, error: ensureError.message };
    }

    const { data: row, error } = await supabase
      .from("platform_registration_invite")
      .select("current_code, updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !row) {
      return { ok: false, error: error?.message ?? "Code nicht gefunden" };
    }

    return {
      ok: true,
      code: row.current_code ?? String(ensured),
      updatedAt: row.updated_at,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fehler beim Laden",
    };
  }
}

export async function regenerateRegistrationInviteCode(): Promise<
  { ok: true; code: string } | { ok: false; error: string }
> {
  try {
    const { user, supabase } = await checkAdminAccess();
    const { data: code, error } = await supabase.rpc(
      "rotate_registration_invite_code",
      { p_actor_id: user.id }
    );
    if (error) {
      return { ok: false, error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "registration_invite_rotated",
      entity: "platform_registration_invite",
      entity_id: "1",
      before: null,
      after: { manual: true },
    });

    revalidatePath("/admin/einstellungen");
    return { ok: true, code: code as string };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Fehler beim Erzeugen",
    };
  }
}
