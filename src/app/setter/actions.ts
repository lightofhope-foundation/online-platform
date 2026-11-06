"use server";

import { revalidatePath } from "next/cache";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { ensureTherapySessionsSeeded } from "@/lib/therapySessions";
import {
  canAssignTherapist,
  canConvertLead,
  canMarkLost,
  normalizePipelineStatus,
} from "@/lib/pipelineStatus";
import {
  userHasPortalRole,
  type PortalRole,
} from "@/lib/userRoles";

/** Setter / Admin / Teamlead: Lead → Klient / verloren */
function canConvertLeadRoles(roles: PortalRole[]): boolean {
  return (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasPortalRole(roles, "setter_closer")
  );
}

/** EG darf zugewiesene Leads als verloren markieren; Setter ebenfalls */
function canMarkLostRoles(roles: PortalRole[]): boolean {
  return (
    canConvertLeadRoles(roles) ||
    userHasPortalRole(roles, "erstgespraechler")
  );
}

function canAssignTherapistRoles(roles: PortalRole[]): boolean {
  return (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasPortalRole(roles, "setter_closer")
  );
}

function canAssignEgRoles(roles: PortalRole[]): boolean {
  return (
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead") ||
    userHasPortalRole(roles, "setter_closer")
  );
}

function revalidateStaffLists(clientId: string | null | undefined) {
  revalidatePath("/setter/leads");
  revalidatePath("/setter/clients");
  revalidatePath("/setter/users");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/my-clients");
  revalidatePath("/therapist/leads");
  revalidatePath("/therapist/all-clients");
  revalidatePath("/therapist/clients");
  revalidatePath("/teamlead/leads");
  revalidatePath("/teamlead/clients");
  revalidatePath("/teamlead/my-clients");
  revalidatePath("/setter/eg");
  if (clientId) {
    revalidatePath(`/setter/users/${clientId.toLowerCase()}`);
  }
}

export type SetterCreateClientInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Soft-release: ignored — leads never get a therapist on create */
  therapistUserId?: string | null;
};

/** Soft-release: always creates a Lead (`pipeline_status=lead`), never a client. */
export async function setterCreateClient(
  input: SetterCreateClientInput
): Promise<{ ok: true; clientId: string | null } | { ok: false; error: string }> {
  try {
    const { user } = await checkSetterAccess();
    const supabase = getSupabaseAdminClient();

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    if (!email || !input.password || input.password.length < 8) {
      return { ok: false, error: "E-Mail und Passwort (min. 8 Zeichen) erforderlich." };
    }
    if (!firstName || !lastName) {
      return { ok: false, error: "Vor- und Nachname sind Pflicht." };
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        return { ok: false, error: "Diese E-Mail ist bereits registriert." };
      }
      return { ok: false, error: authError.message };
    }

    const userId = authData.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      role: "client",
      first_name: firstName,
      last_name: lastName,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      return { ok: false, error: profileError.message };
    }

    const now = new Date().toISOString();
    const { error: clientError } = await supabase.from("clients").insert({
      user_id: userId,
      therapist_user_id: null,
      is_paid: false,
      access_revoked: false,
      pipeline_status: "lead",
      intake_data: { email },
      created_at: now,
      updated_at: now,
    });
    if (clientError) {
      await supabase.auth.admin.deleteUser(userId);
      return { ok: false, error: clientError.message };
    }

    await ensureTherapySessionsSeeded(supabase, userId);

    const { data: refreshed } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("user_id", userId)
      .single();

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "setter_lead_created",
      entity: "profiles",
      entity_id: refreshed?.client_id ?? userId,
      before: null,
      after: { email, pipeline_status: "lead" },
    });

    revalidateStaffLists(refreshed?.client_id);
    return { ok: true, clientId: refreshed?.client_id ?? null };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Anlegen fehlgeschlagen",
    };
  }
}

export async function setterAssignTherapist(
  clientUserId: string,
  therapistUserId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { roles, supabase } = await checkSetterAccess();

    if (!canAssignTherapistRoles(roles)) {
      return { ok: false, error: "Keine Berechtigung." };
    }

    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("user_id, role, client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
    }

    const { data: clientRow } = await supabase
      .from("clients")
      .select("user_id, pipeline_status")
      .eq("user_id", clientUserId)
      .maybeSingle();

    const status = normalizePipelineStatus(clientRow?.pipeline_status);
    if (therapistUserId && !canAssignTherapist(status)) {
      return {
        ok: false,
        error:
          "Therapeut erst zuweisen, nachdem der Lead zum Klienten gemacht wurde.",
      };
    }

    if (therapistUserId) {
      const { data: therapistProfile } = await supabase
        .from("profiles")
        .select("user_id, role")
        .eq("user_id", therapistUserId)
        .maybeSingle();

      if (!therapistProfile || therapistProfile.role !== "therapist") {
        return { ok: false, error: "Ungültiger Therapeut." };
      }
    }

    const now = new Date().toISOString();
    if (clientRow) {
      const { error } = await supabase
        .from("clients")
        .update({ therapist_user_id: therapistUserId, updated_at: now })
        .eq("user_id", clientUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert({
        user_id: clientUserId,
        therapist_user_id: therapistUserId,
        pipeline_status: "client",
        is_paid: false,
        access_revoked: false,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    }

    revalidateStaffLists(clientProfile.client_id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Zuweisung fehlgeschlagen",
    };
  }
}

/** Setter / Admin / Teamlead: Lead → Klient */
export async function convertLeadToClient(
  clientUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, roles, supabase } = await checkSetterAccess();
    if (!canConvertLeadRoles(roles)) {
      return { ok: false, error: "Nur Setter / Admin / Teamlead." };
    }

    const { data: clientRow } = await supabase
      .from("clients")
      .select("user_id, pipeline_status")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientRow) return { ok: false, error: "Lead nicht gefunden." };
    const status = normalizePipelineStatus(clientRow.pipeline_status);
    if (!canConvertLead(status)) {
      return { ok: false, error: "Nur Leads können zum Klienten gemacht werden." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("clients")
      .update({ pipeline_status: "client", updated_at: now })
      .eq("user_id", clientUserId);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "lead_converted_to_client",
      entity: "clients",
      entity_id: clientUserId,
      before: { pipeline_status: "lead" },
      after: { pipeline_status: "client" },
    });

    revalidateStaffLists(profile?.client_id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Umwandlung fehlgeschlagen",
    };
  }
}

/** Setter / EG / Admin / Teamlead: Lead als verloren markieren */
export async function markLeadLost(
  clientUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, roles, supabase } = await checkSetterAccess();
    if (!canMarkLostRoles(roles)) {
      return { ok: false, error: "Keine Berechtigung." };
    }

    const { data: clientRow } = await supabase
      .from("clients")
      .select("user_id, pipeline_status")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientRow) return { ok: false, error: "Lead nicht gefunden." };
    const status = normalizePipelineStatus(clientRow.pipeline_status);
    if (!canMarkLost(status)) {
      return { ok: false, error: "Nur offene Leads können als verloren markiert werden." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("clients")
      .update({
        pipeline_status: "lost",
        therapist_user_id: null,
        updated_at: now,
      })
      .eq("user_id", clientUserId);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "lead_marked_lost",
      entity: "clients",
      entity_id: clientUserId,
      before: { pipeline_status: "lead" },
      after: { pipeline_status: "lost" },
    });

    revalidateStaffLists(profile?.client_id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Markierung fehlgeschlagen",
    };
  }
}

/** Setter / Admin / Teamlead: Lead einem Erstgesprächler zuweisen */
export async function assignLeadToErstgespraechler(
  clientUserId: string,
  erstgespraechlerUserId: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, roles, supabase } = await checkSetterAccess();
    if (!canAssignEgRoles(roles)) {
      return { ok: false, error: "Nur Setter / Admin / Teamlead." };
    }

    if (erstgespraechlerUserId) {
      const egRoles = await import("@/lib/userRoles").then((m) =>
        m.getUserPortalRoles(erstgespraechlerUserId)
      );
      if (
        !egRoles.includes("erstgespraechler") &&
        !egRoles.includes("setter_closer")
      ) {
        return { ok: false, error: "Ungültiger Erstgesprächler." };
      }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("client_id, role")
      .eq("user_id", clientUserId)
      .maybeSingle();
    if (!profile || profile.role !== "client") {
      return { ok: false, error: "Ungültiger Lead." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("clients")
      .update({
        erstgespraechler_user_id: erstgespraechlerUserId,
        updated_at: now,
      })
      .eq("user_id", clientUserId);
    if (error) throw error;

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "lead_assigned_to_eg",
      entity: "clients",
      entity_id: clientUserId,
      before: null,
      after: { erstgespraechler_user_id: erstgespraechlerUserId },
    });

    revalidateStaffLists(profile.client_id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Zuweisung fehlgeschlagen",
    };
  }
}

export type CustomIntakeCard = {
  id: string;
  column: 0 | 1 | 2;
  title: string;
  body?: string;
};

export type ClientIntakeData = {
  setter_name?: string;
  closer_name?: string;
  payment_plan?: string;
  price_per_session?: string;
  phone?: string;
  email?: string;
  address?: string;
  therapist_name?: string;
  session_start?: string;
  agreement_signed?: boolean;
  platform_added?: boolean;
  problems?: string;
  goals?: string;
  expectations?: string;
  side_note?: string;
  consequences?: string;
  value_tags?: string[];
  free_notes?: string;
  value_set?: string;
  custom_cards?: CustomIntakeCard[];
};

export async function setterSaveIntake(
  clientUserId: string,
  intake: ClientIntakeData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, supabase } = await checkSetterAccess();

    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("user_id, role, client_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    if (!clientProfile || clientProfile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
    }

    const { data: existingClient } = await supabase
      .from("clients")
      .select("user_id")
      .eq("user_id", clientUserId)
      .maybeSingle();

    const now = new Date().toISOString();
    if (existingClient) {
      const { error } = await supabase
        .from("clients")
        .update({
          intake_data: intake,
          updated_at: now,
        })
        .eq("user_id", clientUserId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("clients").insert({
        user_id: clientUserId,
        intake_data: intake,
        pipeline_status: "lead",
        is_paid: false,
        access_revoked: false,
        created_at: now,
        updated_at: now,
      });
      if (error) throw error;
    }

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "setter_intake_updated",
      entity: "clients",
      entity_id: clientUserId,
      before: null,
      after: { fields: Object.keys(intake) },
    });

    revalidateStaffLists(clientProfile.client_id);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}

/** Save intake by public client_id (for LeadDetailCards). */
export async function setterSaveClientIntake(
  clientId: string,
  intake: ClientIntakeData
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { supabase } = await checkSetterAccess();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("client_id", clientId)
      .maybeSingle();

    if (!profile?.user_id || profile.role !== "client") {
      return { ok: false, error: "Ungültiger Klient." };
    }

    return setterSaveIntake(profile.user_id, intake);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Speichern fehlgeschlagen",
    };
  }
}
