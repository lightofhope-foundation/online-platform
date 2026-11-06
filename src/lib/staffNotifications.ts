import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { formatTherapySessionLabel } from "@/lib/therapySessions";

export type StaffNotificationKind =
  | "session_comment"
  | "session_reaction"
  | "therapist_session_comment"
  | "therapist_session_reaction";

type AdminClient = SupabaseClient;

function previewNoteText(raw: string | null | undefined, max = 120): string {
  const plain = (raw ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

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

async function loadNotePreview(
  supabase: AdminClient,
  noteId?: string | null
): Promise<string> {
  if (!noteId) return "";
  const { data } = await supabase
    .from("therapy_session_notes")
    .select("client_body, therapist_body")
    .eq("id", noteId)
    .maybeSingle();
  return (
    previewNoteText(data?.client_body) ||
    previewNoteText(data?.therapist_body) ||
    ""
  );
}

async function insertNotification(
  supabase: AdminClient,
  row: {
    recipient_user_id: string;
    actor_user_id: string;
    kind: StaffNotificationKind;
    title: string;
    body: string;
    href: string;
    client_user_id: string;
    session_id: string;
    note_id?: string | null;
  }
) {
  const { error } = await supabase.from("staff_notifications").insert(row);
  if (error) {
    console.error("[staff_notifications] insert failed:", error.message);
    throw new Error(`Benachrichtigung fehlgeschlagen: ${error.message}`);
  }
}

function buildBody(
  sessionLabel: string,
  kindLabel: string,
  notePreview: string
): string {
  const base = `${sessionLabel}: ${kindLabel}`;
  return notePreview ? `${base}\n„${notePreview}“` : base;
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

  const [{ clientProfile, sessionLabel }, notePreview] = await Promise.all([
    loadSessionContext(supabase, opts.sessionId, opts.clientUserId),
    loadNotePreview(supabase, opts.noteId),
  ]);

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

  const kindLabel =
    opts.kind === "session_comment" ? "neuer Kommentar" : "neue Reaktion";

  await insertNotification(supabase, {
    recipient_user_id: therapistId,
    actor_user_id: opts.actorUserId,
    kind: opts.kind,
    title: `${clientName} · ${kindLabel}`,
    body: buildBody(sessionLabel, kindLabel, notePreview),
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

  const [[{ data: therapistProfile }, { sessionLabel }], notePreview] =
    await Promise.all([
      Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, display_alias")
          .eq("user_id", opts.actorUserId)
          .maybeSingle(),
        loadSessionContext(supabase, opts.sessionId, opts.clientUserId),
      ]),
      loadNotePreview(supabase, opts.noteId),
    ]);

  const therapistName = resolvePersonLabel(
    therapistProfile?.first_name,
    therapistProfile?.last_name,
    null,
    therapistProfile?.display_alias
  );

  const kindLabel =
    opts.kind === "therapist_session_comment"
      ? "neuer Kommentar"
      : "neue Reaktion";

  await insertNotification(supabase, {
    recipient_user_id: opts.clientUserId,
    actor_user_id: opts.actorUserId,
    kind: opts.kind,
    title: `${therapistName} · ${kindLabel}`,
    body: buildBody(sessionLabel, kindLabel, notePreview),
    href: `/sitzungen?session=${opts.sessionId}`,
    client_user_id: opts.clientUserId,
    session_id: opts.sessionId,
    note_id: opts.noteId ?? null,
  });
}
