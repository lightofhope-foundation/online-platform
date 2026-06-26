import { revalidatePath } from "next/cache";
import { berlinDatetimeLocalToIso } from "@/lib/berlinDatetime";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AdminClient = SupabaseClient<Database>;

export async function setTherapySessionReleased(
  supabase: AdminClient,
  sessionId: string,
  released: boolean
) {
  const { error } = await supabase
    .from("therapy_sessions")
    .update({ released_to_client: released, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function updateTherapySessionMeta(
  supabase: AdminClient,
  sessionId: string,
  data: {
    topic?: string;
    scheduledAtLocal?: string;
    meetingUrl?: string;
  }
) {
  const patch: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (data.topic !== undefined) {
    patch.topic = data.topic.trim() || null;
  }

  if (data.scheduledAtLocal !== undefined) {
    const trimmed = data.scheduledAtLocal.trim();
    patch.scheduled_at = trimmed ? berlinDatetimeLocalToIso(trimmed) : null;
  }

  if (data.meetingUrl !== undefined) {
    patch.meeting_url = data.meetingUrl.trim() || null;
  }

  const { error } = await supabase.from("therapy_sessions").update(patch).eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function createTherapySessionNote(
  supabase: AdminClient,
  sessionId: string,
  authorId: string,
  therapistBody: string,
  clientBody: string
) {
  const therapist = therapistBody.trim() || null;
  const client = clientBody.trim() || null;

  if (!therapist && !client) {
    throw new Error("Mindestens ein Notizfeld muss ausgefüllt sein");
  }

  const { error } = await supabase.from("therapy_session_notes").insert({
    session_id: sessionId,
    author_id: authorId,
    therapist_body: therapist,
    client_body: client,
  });

  if (error) throw new Error(error.message);
}

export async function updateTherapySessionNote(
  supabase: AdminClient,
  noteId: string,
  changedBy: string,
  therapistBody: string,
  clientBody: string,
  options?: { therapistOnly?: boolean; clientOnly?: boolean }
) {
  const { data: existing, error: loadError } = await supabase
    .from("therapy_session_notes")
    .select("therapist_body, client_body")
    .eq("id", noteId)
    .maybeSingle();

  if (loadError || !existing) {
    throw new Error("Notiz nicht gefunden");
  }

  const nextTherapist = options?.clientOnly
    ? existing.therapist_body
    : therapistBody.trim() || null;
  const nextClient = options?.therapistOnly
    ? existing.client_body
    : clientBody.trim() || null;

  if (!nextTherapist && !nextClient) {
    throw new Error("Mindestens ein Notizfeld muss ausgefüllt sein");
  }

  const changed =
    nextTherapist !== existing.therapist_body || nextClient !== existing.client_body;

  if (!changed) return;

  const { error: revisionError } = await supabase
    .from("therapy_session_note_revisions")
    .insert({
      note_id: noteId,
      therapist_body_before: existing.therapist_body,
      therapist_body_after: nextTherapist,
      client_body_before: existing.client_body,
      client_body_after: nextClient,
      changed_by: changedBy,
    });

  if (revisionError) throw new Error(revisionError.message);

  const { error } = await supabase
    .from("therapy_session_notes")
    .update({
      therapist_body: nextTherapist,
      client_body: nextClient,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId);

  if (error) throw new Error(error.message);
}

export function revalidateTherapySessionPaths(clientId: string) {
  const slug = clientId.toLowerCase();
  revalidatePath(`/therapist/clients/${slug}/sitzungen`);
  revalidatePath(`/admin/users/${slug}/sitzungen`);
  revalidatePath("/sitzungen");
}
