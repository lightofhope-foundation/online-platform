import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getStandardSessionCount, DEFAULT_THERAPY_SESSION_COUNT } from "@/lib/platformTherapyConfig";

/** @deprecated Use getStandardSessionCount() — kept for static fallbacks */
export const THERAPY_SESSION_COUNT = DEFAULT_THERAPY_SESSION_COUNT;

/** Display label e.g. "Sitzung 1 — Erreiche deine Mitte" (no duplicate prefix) */
export function formatTherapySessionLabel(
  sessionNumber: number,
  topic?: string | null,
  isSpecial?: boolean
): string {
  if (isSpecial) {
    const trimmed = topic?.trim();
    return trimmed || "Sondersitzung";
  }

  const trimmed = topic?.trim();
  if (!trimmed) return `Sitzung ${sessionNumber}`;

  const numberedPrefix = trimmed.match(/^sitzung\s*(\d+)\s*[-–—:]\s*(.+)$/i);
  if (numberedPrefix) {
    const topicNum = Number(numberedPrefix[1]);
    if (topicNum === sessionNumber) {
      return trimmed;
    }
    return `Sitzung ${sessionNumber} — ${numberedPrefix[2].trim()}`;
  }

  if (/^sitzung\s*\d+\s*$/i.test(trimmed)) {
    return trimmed;
  }

  return `Sitzung ${sessionNumber} — ${trimmed}`;
}

type AdminClient = SupabaseClient<Database>;

export type TherapySessionRow = {
  id: string;
  client_user_id: string;
  session_number: number;
  path_order: number;
  is_special: boolean;
  released_to_client: boolean;
  topic: string | null;
  scheduled_at: string | null;
  meeting_url: string | null;
  recording_bunny_video_id: string | null;
  recording_title: string | null;
  created_at: string;
  updated_at: string;
};

export type TherapySessionNoteRow = {
  id: string;
  session_id: string;
  author_id: string;
  therapist_body: string | null;
  client_body: string | null;
  created_at: string;
  updated_at: string;
  author_label?: string;
  revision_count?: number;
};

export type TherapySessionWithNotes = TherapySessionRow & {
  notes: TherapySessionNoteRow[];
};

export async function ensureTherapySessionsSeeded(
  supabase: AdminClient,
  clientUserId: string
) {
  const sessionCount = await getStandardSessionCount(supabase);

  const { count, error: countError } = await supabase
    .from("therapy_sessions")
    .select("id", { count: "exact", head: true })
    .eq("client_user_id", clientUserId)
    .eq("is_special", false);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) >= sessionCount) return;

  const now = new Date().toISOString();
  const rows = Array.from({ length: sessionCount }, (_, i) => ({
    client_user_id: clientUserId,
    session_number: i + 1,
    path_order: i + 1,
    is_special: false,
    released_to_client: false,
    topic: `Sitzung ${i + 1}`,
    created_at: now,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("therapy_sessions")
    .upsert(rows, { onConflict: "client_user_id,session_number", ignoreDuplicates: true });

  if (error) throw new Error(error.message);
}

export async function loadTherapySessionsWithNotes(
  supabase: AdminClient,
  clientUserId: string,
  options?: { clientView?: boolean }
): Promise<TherapySessionWithNotes[]> {
  await ensureTherapySessionsSeeded(supabase, clientUserId);

  const { data: sessions, error: sessionsError } = await supabase
    .from("therapy_sessions")
    .select("*")
    .eq("client_user_id", clientUserId)
    .order("path_order", { ascending: true });

  if (sessionsError) throw new Error(sessionsError.message);

  const sessionList = (sessions ?? []) as TherapySessionRow[];
  if (sessionList.length === 0) return [];

  const sessionIds = sessionList.map((s) => s.id);
  const { data: notes, error: notesError } = await supabase
    .from("therapy_session_notes")
    .select("*")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  if (notesError) throw new Error(notesError.message);

  const noteRows = (notes ?? []) as TherapySessionNoteRow[];
  const authorIds = [...new Set(noteRows.map((n) => n.author_id))];

  const authorLabels = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, display_alias")
      .in("user_id", authorIds);

    (profiles ?? []).forEach((p) => {
      const label =
        p.display_alias?.trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ") ||
        "Nutzer";
      authorLabels.set(p.user_id, label);
    });
  }

  const revisionCounts = new Map<string, number>();
  if (noteRows.length > 0) {
    const { data: revisions } = await supabase
      .from("therapy_session_note_revisions")
      .select("note_id")
      .in(
        "note_id",
        noteRows.map((n) => n.id)
      );

    (revisions ?? []).forEach((r) => {
      revisionCounts.set(r.note_id, (revisionCounts.get(r.note_id) ?? 0) + 1);
    });
  }

  const notesBySession = new Map<string, TherapySessionNoteRow[]>();
  for (const note of noteRows) {
    const session = sessionList.find((s) => s.id === note.session_id);
    if (!session) continue;

    const visible =
      !options?.clientView ||
      (session.released_to_client && (note.client_body?.trim() ?? "").length > 0);

    if (!visible && options?.clientView) continue;

    const enriched: TherapySessionNoteRow = {
      ...note,
      author_label: authorLabels.get(note.author_id) ?? "Nutzer",
      revision_count: revisionCounts.get(note.id) ?? 0,
      therapist_body: options?.clientView ? null : note.therapist_body,
    };

    const list = notesBySession.get(note.session_id) ?? [];
    list.push(enriched);
    notesBySession.set(note.session_id, list);
  }

  return sessionList.map((session) => ({
    ...session,
    notes: notesBySession.get(session.id) ?? [],
  }));
}
