"use server";

import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import {
  createTherapySessionNote,
  revalidateTherapySessionPaths,
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
