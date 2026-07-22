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

export async function setTherapySessionRecording(
  supabase: AdminClient,
  sessionId: string,
  bunnyVideoId: string | null,
  title: string | null
) {
  const { error } = await supabase
    .from("therapy_sessions")
    .update({
      recording_bunny_video_id: bunnyVideoId,
      recording_title: title?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function insertSpecialTherapySession(
  supabase: AdminClient,
  clientUserId: string,
  afterPathOrder: number
): Promise<{ id: string }> {
  const { data: existing, error: loadError } = await supabase
    .from("therapy_sessions")
    .select("id, path_order, session_number, is_special")
    .eq("client_user_id", clientUserId)
    .order("path_order", { ascending: true });

  if (loadError) throw new Error(loadError.message);
  if (!existing?.length) throw new Error("Keine Sitzungen gefunden");

  const toShift = existing
    .filter((s) => s.path_order > afterPathOrder)
    .sort((a, b) => b.path_order - a.path_order);

  for (const row of toShift) {
    const { error } = await supabase
      .from("therapy_sessions")
      .update({ path_order: row.path_order + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }

  const specialNumbers = existing
    .filter((s) => s.is_special)
    .map((s) => s.session_number);
  const nextSpecialNumber = Math.max(1000, ...specialNumbers, 1000) + 1;
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabase
    .from("therapy_sessions")
    .insert({
      client_user_id: clientUserId,
      session_number: nextSpecialNumber,
      path_order: afterPathOrder + 1,
      is_special: true,
      topic: "Notsitzung",
      released_to_client: false,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Notsitzung konnte nicht erstellt werden");
  }

  return { id: inserted.id };
}

export async function deleteSpecialTherapySession(
  supabase: AdminClient,
  clientUserId: string,
  sessionId: string
): Promise<void> {
  const { data: session, error: loadError } = await supabase
    .from("therapy_sessions")
    .select("id, path_order, is_special")
    .eq("id", sessionId)
    .eq("client_user_id", clientUserId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!session?.is_special) {
    throw new Error("Nur Notsitzungen können entfernt werden");
  }

  const removedOrder = session.path_order;

  const { error: deleteError } = await supabase
    .from("therapy_sessions")
    .delete()
    .eq("id", sessionId);

  if (deleteError) throw new Error(deleteError.message);

  const { data: toShift, error: shiftLoadError } = await supabase
    .from("therapy_sessions")
    .select("id, path_order")
    .eq("client_user_id", clientUserId)
    .gt("path_order", removedOrder)
    .order("path_order", { ascending: true });

  if (shiftLoadError) throw new Error(shiftLoadError.message);

  for (const row of toShift ?? []) {
    const { error } = await supabase
      .from("therapy_sessions")
      .update({
        path_order: row.path_order - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }
}

export function revalidateTherapySessionPaths(clientId: string) {
  const slug = clientId.toLowerCase();
  revalidatePath(`/therapist/clients/${slug}/sitzungen`);
  revalidatePath(`/admin/users/${slug}/sitzungen`);
  revalidatePath("/sitzungen");
  revalidatePath("/sitzungsaufnahmen");
}
