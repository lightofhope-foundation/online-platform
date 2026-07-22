import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapySessionsWorkspace } from "@/components/therapy/TherapySessionsWorkspace";
import { SessionPathHero } from "@/components/therapy/SessionPathHero";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import { LOH_SESSION_PATH_DEFAULT_BG } from "@/lib/branding";
import { loadTherapySessionsWithNotes } from "@/lib/therapySessions";

export const dynamic = "force-dynamic";

export default async function AdminUserSitzungenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  const admin = getSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("user_id, role, first_name, last_name, client_id, display_alias")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error || !profile?.client_id || profile.role !== "client") {
    notFound();
  }

  const { data: authUserRes } = await admin.auth.admin.getUserById(profile.user_id);
  const authUser = authUserRes?.user;
  if (!authUser) notFound();

  const sessions = await loadTherapySessionsWithNotes(admin, profile.user_id);
  const boundClientId = profile.client_id;

  const { data: clientRow } = await admin
    .from("clients")
    .select("session_path_background_url")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  const backgroundUrl =
    clientRow?.session_path_background_url?.trim() || LOH_SESSION_PATH_DEFAULT_BG;

  return (
    <SessionPathHero
      title="DEINE SITZUNGSÜBERSICHT"
      backgroundUrl={backgroundUrl}
      canEditBackground
      clientUserId={profile.user_id}
      clientId={boundClientId}
      backLink={
        <Link
          href={`/admin/users/${boundClientId}`}
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zur Nutzer-Akte
        </Link>
      }
      subtitle={
        <>
          {resolvePersonLabel(
            profile.first_name,
            profile.last_name,
            authUser.email,
            profile.display_alias
          )}{" "}
          · Nutzer-ID <span className="font-mono text-white/70">{boundClientId}</span>
        </>
      }
    >
      <TherapySessionsWorkspace
        sessions={sessions}
        mode="admin"
        clientId={boundClientId}
      />
    </SessionPathHero>
  );
}
