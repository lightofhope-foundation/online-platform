import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { formatTherapySessionLabel } from "@/lib/therapySessions";

export type StaffNotificationKind = "session_comment" | "session_reaction";

export type StaffNotificationRow = {
  id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  kind: StaffNotificationKind;
  title: string;
  body: string | null;
  href: string | null;
  client_user_id: string | null;
  session_id: string | null;
  note_id: string | null;
  read_at: string | null;
  created_at: string;
};

type AdminClient = SupabaseClient;

/** Notify assigned therapist when a client comments or reacts in a session. */
export async function notifyTherapistOfClientSessionActivity(
  supabase: AdminClient,
  opts: {
    clientUserId: string;
    actorUserId: string;
    sessionId: string;
    noteId?: string | null;
    kind: StaffNotificationKind;
  }
): Promise<void> {
  const { data: clientRow } = await supabase
    .from("clients")
    .select("therapist_user_id")
    .eq("user_id", opts.clientUserId)
    .maybeSingle();

  const therapistId = clientRow?.therapist_user_id;
  if (!therapistId || therapistId === opts.actorUserId) return;

  const [{ data: actor }, { data: session }, { data: profile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, display_alias, client_id")
      .eq("user_id", opts.clientUserId)
      .maybeSingle(),
    supabase
      .from("therapy_sessions")
      .select("session_number, topic, is_special")
      .eq("id", opts.sessionId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("client_id")
      .eq("user_id", opts.clientUserId)
      .maybeSingle(),
  ]);

  const clientName = resolvePersonLabel(
    actor?.first_name,
    actor?.last_name,
    null,
    actor?.display_alias
  );
  const sessionLabel = session
    ? formatTherapySessionLabel(
        session.session_number,
        session.topic,
        session.is_special
      )
    : "Sitzung";
  const slug = (profile?.client_id ?? actor?.client_id ?? "").toLowerCase();
  const href = slug
    ? `/therapist/clients/${slug}/sitzungen`
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
