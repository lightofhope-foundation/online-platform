"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { checkTherapistAccess } from "@/lib/authRoles";
import { extractBunnyVideoId } from "@/lib/bunnyCDN";
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
  const created = await createTherapySessionNote(
    supabase,
    sessionId,
    user.id,
    therapistBody,
    clientBody
  );
  // Feedback-Chat (client_body) → Klient benachrichtigen; private Notiz nicht
  if (clientBody.trim()) {
    try {
      const { data: session } = await supabase
        .from("therapy_sessions")
        .select("client_user_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (session?.client_user_id) {
        const { notifyClientOfTherapistSessionActivity } = await import(
          "@/lib/staffNotifications"
        );
        await notifyClientOfTherapistSessionActivity(supabase, {
          clientUserId: session.client_user_id,
          actorUserId: user.id,
          sessionId,
          noteId: created.id,
          kind: "therapist_session_comment",
        });
      }
    } catch (err) {
      console.error("Client-Notify nach Therapeuten-Nachricht fehlgeschlagen:", err);
    }
  }
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

export async function therapistToggleNoteReaction(
  clientId: string,
  noteId: string,
  emoji: string
) {
  const { user, supabase, clientId: resolvedClientId } =
    await checkTherapistClientAccess(clientId);
  const { toggleTherapySessionNoteReaction } = await import(
    "@/lib/therapySessionMutations"
  );
  await toggleTherapySessionNoteReaction(supabase, noteId, user.id, emoji);

  const { data: note } = await supabase
    .from("therapy_session_notes")
    .select("session_id, author_id")
    .eq("id", noteId)
    .maybeSingle();
  if (note?.session_id && note.author_id && note.author_id !== user.id) {
    try {
      const { data: session } = await supabase
        .from("therapy_sessions")
        .select("client_user_id")
        .eq("id", note.session_id)
        .maybeSingle();
      if (session?.client_user_id) {
        const { notifyClientOfTherapistSessionActivity } = await import(
          "@/lib/staffNotifications"
        );
        await notifyClientOfTherapistSessionActivity(supabase, {
          clientUserId: session.client_user_id,
          actorUserId: user.id,
          sessionId: note.session_id,
          noteId,
          kind: "therapist_session_reaction",
        });
      }
    } catch (err) {
      console.error("Client-Notify nach Therapeuten-Reaktion fehlgeschlagen:", err);
    }
  }
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function clientToggleNoteReaction(noteId: string, emoji: string) {
  const { getAuthUserFromCookie } = await import("@/lib/supabaseServer");
  const { getSupabaseAdminClient } = await import("@/lib/supabaseAdmin");
  const user = await getAuthUserFromCookie();
  if (!user) throw new Error("Nicht autorisiert");
  const supabase = getSupabaseAdminClient();
  const { toggleTherapySessionNoteReaction } = await import(
    "@/lib/therapySessionMutations"
  );
  await toggleTherapySessionNoteReaction(supabase, noteId, user.id, emoji);

  const { data: note } = await supabase
    .from("therapy_session_notes")
    .select("session_id")
    .eq("id", noteId)
    .maybeSingle();
  if (note?.session_id) {
    const { notifyTherapistOfClientSessionActivity } = await import(
      "@/lib/staffNotifications"
    );
    await notifyTherapistOfClientSessionActivity(supabase, {
      clientUserId: user.id,
      actorUserId: user.id,
      sessionId: note.session_id,
      noteId,
      kind: "session_reaction",
    });
  }
  return { ok: true as const };
}

/** Direct Bunny Storage upload credentials (large files, no Vercel body limit). */
export async function therapistPrepareSessionRecordingUpload(
  clientId: string,
  sessionId: string,
  title: string,
  fileNameHint?: string
) {
  const { supabase, clientId: resolvedClientId, userId } =
    await checkTherapistClientAccess(clientId);
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Bitte einen Videotitel angeben");

  const { data: session } = await supabase
    .from("therapy_sessions")
    .select("id, session_number, is_special, path_order, client_user_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.client_user_id !== userId) {
    throw new Error("Sitzung nicht gefunden");
  }

  const { data: allSessions } = await supabase
    .from("therapy_sessions")
    .select("id, session_number, is_special, path_order")
    .eq("client_user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, client_id")
    .eq("user_id", userId)
    .maybeSingle();

  const extFromHint = fileNameHint?.includes(".")
    ? fileNameHint.split(".").pop()?.toLowerCase()
    : null;
  const extension =
    extFromHint && /^[a-z0-9]{2,5}$/.test(extFromHint) ? extFromHint : "mp4";

  const { buildSessionRecordingStoragePath } = await import(
    "@/lib/sessionRecordingStorage"
  );
  const { getBunnyStorageDirectUploadTarget, isBunnyStorageConfigured } =
    await import("@/lib/bunnyStorage");

  if (!isBunnyStorageConfigured()) {
    throw new Error(
      "Bunny Storage ist nicht konfiguriert (BUNNY_STORAGE_ZONE_NAME / BUNNY_STORAGE_ACCESS_KEY)."
    );
  }

  const { storagePath } = buildSessionRecordingStoragePath({
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    clientId: profile?.client_id ?? resolvedClientId,
    session,
    allSessions: allSessions ?? [session],
    extension,
  });

  const target = getBunnyStorageDirectUploadTarget(storagePath);
  return {
    ok: true as const,
    putUrl: target.putUrl,
    accessKey: target.accessKey,
    publicUrl: target.publicUrl,
    storagePath: target.storagePath,
    /** @deprecated Stream GUID — kept empty; Storage uses publicUrl */
    bunnyVideoId: target.publicUrl,
  };
}

export async function therapistSaveSessionRecording(
  clientId: string,
  sessionId: string,
  bunnyVideoId: string,
  title: string
) {
  const { supabase, clientId: resolvedClientId } = await checkTherapistClientAccess(clientId);
  const raw = bunnyVideoId.trim();
  if (!raw) throw new Error("Ungültige Video-Referenz");

  // Storage CDN URL or legacy Stream GUID
  const { isStorageRecordingRef } = await import("@/lib/sessionRecordingStorage");
  const stored = isStorageRecordingRef(raw)
    ? raw
    : extractBunnyVideoId(raw);
  if (!stored) throw new Error("Ungültige Bunny Video-ID / Storage-URL");

  await setTherapySessionRecording(supabase, sessionId, stored, title.trim());
  revalidateTherapySessionPaths(resolvedClientId);
  return { ok: true as const };
}

export async function therapistLinkSessionRecording(
  clientId: string,
  sessionId: string,
  linkOrGuid: string,
  title: string
) {
  const raw = linkOrGuid.trim();
  const { isStorageRecordingRef } = await import("@/lib/sessionRecordingStorage");
  if (isStorageRecordingRef(raw) || raw.startsWith("http")) {
    return therapistSaveSessionRecording(clientId, sessionId, raw, title);
  }
  const guid = extractBunnyVideoId(raw);
  if (!guid) {
    throw new Error(
      "Ungültiger Link. Bitte Storage-CDN-URL, Bunny-Stream-GUID oder Bunny-URL einfügen."
    );
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
  const created = await createTherapySessionNote(
    supabase,
    sessionId,
    user.id,
    therapistBody,
    clientBody
  );
  if (clientBody.trim()) {
    const { data: session } = await supabase
      .from("therapy_sessions")
      .select("client_user_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (session?.client_user_id) {
      const { notifyClientOfTherapistSessionActivity } = await import(
        "@/lib/staffNotifications"
      );
      await notifyClientOfTherapistSessionActivity(supabase, {
        clientUserId: session.client_user_id,
        actorUserId: user.id,
        sessionId,
        noteId: created.id,
        kind: "therapist_session_comment",
      });
    }
  }
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

export async function adminInsertSpecialSession(
  clientId: string,
  afterPathOrder: number
) {
  const { supabase, userId, clientId: resolvedClientId } =
    await checkAdminClientAccess(clientId);
  const { id } = await insertSpecialTherapySession(supabase, userId, afterPathOrder);
  revalidateTherapySessionPaths(resolvedClientId);
  revalidatePath(`/admin/users/${resolvedClientId.toLowerCase()}/sitzungen`);
  return { ok: true as const, sessionId: id };
}

export async function adminDeleteSpecialSession(
  clientId: string,
  sessionId: string
) {
  const { supabase, userId, clientId: resolvedClientId } =
    await checkAdminClientAccess(clientId);
  await deleteSpecialTherapySession(supabase, userId, sessionId);
  revalidateTherapySessionPaths(resolvedClientId);
  revalidatePath(`/admin/users/${resolvedClientId.toLowerCase()}/sitzungen`);
  return { ok: true as const };
}

// ——— Klient ———

export async function clientAddSessionNote(sessionId: string, clientBody: string) {
  const { user, supabase, clientId } = await checkClientSessionAccess(sessionId);
  const created = await createTherapySessionNote(
    supabase,
    sessionId,
    user.id,
    "",
    clientBody
  );
  const { notifyTherapistOfClientSessionActivity } = await import(
    "@/lib/staffNotifications"
  );
  await notifyTherapistOfClientSessionActivity(supabase, {
    clientUserId: user.id,
    actorUserId: user.id,
    sessionId,
    noteId: created.id,
    kind: "session_comment",
  });
  revalidateTherapySessionPaths(clientId);
  revalidatePath("/sitzungen");
  return { ok: true as const };
}
