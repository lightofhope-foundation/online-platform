"use server";

import { revalidatePath } from "next/cache";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  createTherapySessionNote,
  revalidateTherapySessionPaths,
} from "@/lib/therapySessionMutations";

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

export async function clientAddSessionNote(sessionId: string, clientBody: string) {
  const { user, supabase, clientId } = await checkClientSessionAccess(sessionId);
  await createTherapySessionNote(supabase, sessionId, user.id, "", clientBody);
  revalidateTherapySessionPaths(clientId);
  revalidatePath("/sitzungen");
  return { ok: true as const };
}
