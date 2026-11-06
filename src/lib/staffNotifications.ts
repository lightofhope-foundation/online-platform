import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { formatTherapySessionLabel } from "@/lib/therapySessions";

export type StaffNotificationKind =
  | "session_comment"
  | "session_reaction"
  | "therapist_session_comment"
  | "therapist_session_reaction";

type AdminClient = SupabaseClient;

async function loadSessionContext(
  supabase: AdminClient,
  sessionId: string,
  clientUserId: string
) {
  const [{ data: clientProfile }, { data: session }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, display_alias, client_id")
      .eq("user_id", clientUserId)
      .maybeSingle(),
    supabase
      .from("therapy_sessions")
      .select("session_number, topic, is_special, client_user_id")
      .eq("id", sessionId)
      .maybeSingle(),
  ]);

  const sessionLabel = session
    ? formatTherapySessionLabel(
        session.session_number,
        session.topic,
        session.is_special
      )
    : "Sitzung";

  return { clientProfile, session, sessionLabel };
}

/** Notify assigned therapist when a client comments or reacts in a session. */
export async function notifyTherapistOfClientSessionActivity(
  supabase: AdminClient,
  opts: {
    clientUserId: string;
    actorUserId: string;
    sessionId: string;
    noteId?: string | null;
    kind: "session_comment" | "session_reaction";
  }
): Promise<void> {
  const { data: clientRow } = await supabase
    .from("clients")
    .select("therapist_user_id")
    .eq("user_id", opts.clientUserId)
    .maybeSingle();

  const therapistId = clientRow?.therapist_user_id;
  if (!therapistId || therapistId === opts.actorUserId) return;

  const { clientProfile, sessionLabel } = await loadSessionContext(
    supabase,
    opts.sessionId,
    opts.clientUserId
  );

  const clientName = resolvePersonLabel(
    clientProfile?.first_name,
    clientProfile?.last_name,
    null,
    clientProfile?.display_alias
  );
  const slug = (clientProfile?.client_id ?? "").toLowerCase();
  const href = slug
    ? `/therapist/clients/${slug}/sitzungen?session=${opts.sessionId}`
    : "/therapist/clients";

  const title =
    opts.kind === "session_comment"
      ? `${clientName} · neuer Kommentar`
      : `${clientName} · neue Reaktion`;
  const body =
    opts.kind === "session_comment"
      ? `${sessionLabel}: neuer Kommentar`
      : `${sessionLabel}: neue Reaktion`;

  await supabase.from("staff_notifications").insert({
    recipient_user_id: therapistId,
    actor_user_id: opts.actorUserId,
    kind: opts.kind,
    title,
    body,
    href,
    client_user_id: opts.clientUserId,
    session_id: opts.sessionId,
    note_id: opts.noteId ?? null,
  });
}

/** Notify client when therapist/admin posts feedback chat or reacts. */
export async function notifyClientOfTherapistSessionActivity(
  supabase: AdminClient,
  opts: {
    clientUserId: string;
    actorUserId: string;
    sessionId: string;
    noteId?: string | null;
    kind: "therapist_session_comment" | "therapist_session_reaction";
  }
): Promise<void> {
  if (!opts.clientUserId || opts.clientUserId === opts.actorUserId) return;

  const [{ data: therapistProfile }, { sessionLabel }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, display_alias")
      .eq("user_id", opts.actorUserId)
      .maybeSingle(),
    loadSessionContext(supabase, opts.sessionId, opts.clientUserId),
  ]);

  const therapistName = resolvePersonLabel(
    therapistProfile?.first_name,
    therapistProfile?.last_name,
    null,
    therapistProfile?.display_alias
  );

  const title =
    opts.kind === "therapist_session_comment"
      ? `${therapistName} · neuer Kommentar`
      : `${therapistName} · neue Reaktion`;
  const body =
    opts.kind === "therapist_session_comment"
      ? `${sessionLabel}: neuer Kommentar`
      : `${sessionLabel}: neue Reaktion`;

  await supabase.from("staff_notifications").insert({
    recipient_user_id: opts.clientUserId,
    actor_user_id: opts.actorUserId,
    kind: opts.kind,
    title,
    body,
    href: `/sitzungen?session=${opts.sessionId}`,
    client_user_id: opts.clientUserId,
    session_id: opts.sessionId,
    note_id: opts.noteId ?? null,
  });
}
