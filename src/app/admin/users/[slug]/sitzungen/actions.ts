"use server";

import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import { resolveClientProfileByClientId } from "@/lib/clientVideoUnlock";
import {
  createTherapySessionNote,
  revalidateTherapySessionPaths,
  setTherapySessionReleased,
  updateTherapySessionMeta,
  updateTherapySessionNote,
} from "@/lib/therapySessionMutations";

async function checkAdminClientAccess(clientId: string) {
  const { user, supabase } = await checkAdminAccess();
  const resolved = await resolveClientProfileByClientId(supabase, clientId);
  return { user, supabase, ...resolved };
}

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
