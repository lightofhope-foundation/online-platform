import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapySessionsWorkspace } from "@/components/therapy/TherapySessionsWorkspace";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
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

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/users/${boundClientId}`}
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zur Nutzer-Akte
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Sitzungsakte (Admin)</h1>
        <p className="mt-1 text-sm text-white/60">
          {resolvePersonLabel(
            profile.first_name,
            profile.last_name,
            authUser.email,
            profile.display_alias
          )}{" "}
          · Nutzer-ID <span className="font-mono text-white/80">{boundClientId}</span>
        </p>
        <p className="mt-1 text-xs text-white/40">
          Änderungszähler in Rot — vollständiger Diff-Verlauf folgt in Phase S3.
        </p>
      </div>

      <TherapySessionsWorkspace
        sessions={sessions}
        mode="admin"
        clientId={boundClientId}
      />
    </div>
  );
}
