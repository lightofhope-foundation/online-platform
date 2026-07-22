"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { checkTherapistAccess } from "@/lib/authRoles";
import { createBunnyVideo, extractBunnyVideoId } from "@/lib/bunnyCDN";
import {
  assertTherapistOwnsClient,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  createTherapySessionNote,
  deleteSpecialTherapySession,
  insertSpecialTherapySession,
  revalidateTherapySessionPaths,
  setTherapySessionRecording,
  setTherapySessionReleased,
  updateTherapySessionMeta,
  updateTherapySessionNote,
} from "@/lib/therapySessionMutations";

async function checkTherapistClientAccess(clientId: string) {
  const { user, supabase } = await checkTherapistAccess();
  const resolved = await resolveClientProfileByClientId(supabase, clientId);
  await assertTherapistOwnsClient(supabase, user.id, resolved.userId);
  return { user, supabase, ...resolved };
}

async function checkAdminClientAccess(clientId: string) {
  const { user, supabase } = await checkAdminAccess();
  const resolved = await resolveClientProfileByClientId(supabase, clientId);
  return { user, supabase, ...resolved };
}

async function checkClientSessionAccess(sessionId: string) {
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role, client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.role !== "client" || !profile.client_id) {
    throw new Error("Nicht autorisiert");
  }

  const { data: session } = await supabase
    .from("therapy_sessions")
    .select("id, client_user_id, released_to_client")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.client_user_id !== profile.user_id) {
    throw new Error("Sitzung nicht gefunden");
  }

  if (!session.released_to_client) {
    throw new Error("Sitzung ist noch nicht freigegeben");
  }

  return { user, supabase, clientId: profile.client_id };
}

// ——— Therapeut ———

export async function therapistSetSessionReleased(
  clientId: string,
  sessionId: string,
  released: boolean
) {
  const { supabase, clientId: resolvedClientId } = await checkTherapistClientAccess(clientId);
  await setTherapySessionReleased(supabase, sessionId, released);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistInsertSpecialSession(
  clientId: string,
  afterPathOrder: number
) {
  const { supabase, userId, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);
  const { id } = await insertSpecialTherapySession(supabase, userId, afterPathOrder);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const, sessionId: id };
}

export async function therapistDeleteSpecialSession(
  clientId: string,
  sessionId: string
) {
  const { supabase, userId, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);
  await deleteSpecialTherapySession(supabase, userId, sessionId);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistUpdateSessionMeta(
  clientId: string,
  sessionId: string,
  data: { topic?: string; scheduledAtLocal?: string; meetingUrl?: string }
) {
  const { supabase, clientId: resolvedClientId } = await checkTherapistClientAccess(clientId);
  await updateTherapySessionMeta(supabase, sessionId, data);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistAddSessionNote(
  clientId: string,
  sessionId: string,
  therapistBody: string,
  clientBody: string
) {
  const { user, supabase, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);
  await createTherapySessionNote(
    supabase,
    sessionId,
    user.id,
    therapistBody,
    clientBody
  );
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistUpdateSessionNote(
  clientId: string,
  noteId: string,
  therapistBody: string,
  clientBody: string
) {
  const { user, supabase, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);
  await updateTherapySessionNote(
    supabase,
    noteId,
    user.id,
    therapistBody,
    clientBody
  );
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistPrepareSessionRecordingUpload(
  clientId: string,
  sessionId: string,
  title: string
) {
  await checkTherapistClientAccess(clientId);
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Bitte einen Videotitel angeben");

  const bunnyVideo = await createBunnyVideo(trimmed);
  return { ok: true as const, bunnyVideoId: bunnyVideo.guid };
}

export async function therapistSaveSessionRecording(
  clientId: string,
  sessionId: string,
  bunnyVideoId: string,
  title: string
) {
  const { supabase, clientId: resolvedClientId } = await checkTherapistClientAccess(clientId);
  const guid = extractBunnyVideoId(bunnyVideoId);
  if (!guid) throw new Error("Ungültige Bunny Video-ID");

  await setTherapySessionRecording(supabase, sessionId, guid, title.trim());
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistLinkSessionRecording(
  clientId: string,
  sessionId: string,
  linkOrGuid: string,
  title: string
) {
  const guid = extractBunnyVideoId(linkOrGuid);
  if (!guid) {
    throw new Error("Ungültiger Bunny-Link. Bitte GUID oder Bunny-URL einfügen.");
  }
  return therapistSaveSessionRecording(clientId, sessionId, guid, title);
}

export async function therapistClearSessionRecording(
  clientId: string,
  sessionId: string
) {
  const { supabase, clientId: resolvedClientId } = await checkTherapistClientAccess(clientId);
  await setTherapySessionRecording(supabase, sessionId, null, null);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

// ——— Admin ———

export async function adminSetSessionReleased(
  clientId: string,
  sessionId: string,
  released: boolean
) {
  const { supabase, clientId: resolvedClientId } = await checkAdminClientAccess(clientId);
  await setTherapySessionReleased(supabase, sessionId, released);
  revalidateTherapySessionPaths(resolvedClientId);
  revalidatePath(`/admin/users/${resolvedClientId.toLowerCase()}/sitzungen`);
  return { ok: true as const };
}

export async function adminUpdateSessionMeta(
  clientId: string,
  sessionId: string,
  data: { topic?: string; scheduledAtLocal?: string; meetingUrl?: string }
) {
  const { supabase, clientId: resolvedClientId } = await checkAdminClientAccess(clientId);
  await updateTherapySessionMeta(supabase, sessionId, data);
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function adminAddSessionNote(
  clientId: string,
  sessionId: string,
  therapistBody: string,
  clientBody: string
) {
  const { user, supabase, clientId: resolvedClientId } =
    await checkAdminClientAccess(clientId);
  await createTherapySessionNote(
    supabase,
    sessionId,
    user.id,
    therapistBody,
    clientBody
  );
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function adminUpdateSessionNote(
  clientId: string,
  noteId: string,
  therapistBody: string,
  clientBody: string
) {
  const { user, supabase, clientId: resolvedClientId } =
    await checkAdminClientAccess(clientId);
  await updateTherapySessionNote(
    supabase,
    noteId,
    user.id,
    therapistBody,
    clientBody
  );
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

// ——— Klient ———

export async function clientAddSessionNote(sessionId: string, clientBody: string) {
  const { user, supabase, clientId } = await checkClientSessionAccess(sessionId);
  await createTherapySessionNote(supabase, sessionId, user.id, "", clientBody);
  revalidateTherapySessionPaths(clientId);
  revalidatePath("/sitzungen");
  return { ok: true as const };
}
