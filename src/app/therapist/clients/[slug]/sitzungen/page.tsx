import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapySessionsWorkspace } from "@/components/therapy/TherapySessionsWorkspace";
import { SessionPathHero } from "@/components/therapy/SessionPathHero";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import {
  formatGermanDateTime,
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import { LOH_SESSION_PATH_DEFAULT_BG } from "@/lib/branding";
import { loadTherapySessionsWithNotes } from "@/lib/therapySessions";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function TherapistClientSitzungenPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { slug } = await params;
  const { session: sessionRaw } = await searchParams;
  const initialSessionId =
    sessionRaw &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionRaw
    )
      ? sessionRaw
      : null;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  try {
    const { user, supabase } = await checkTherapistAccess();
    const resolved = await resolveClientProfileByClientId(supabase, clientId);
    await assertTherapistOwnsClient(supabase, user.id, resolved.userId);

    const { data: authUserRes } = await supabase.auth.admin.getUserById(resolved.userId);
    const authUser = authUserRes?.user;
    if (!authUser) notFound();

    const sessions = await loadTherapySessionsWithNotes(supabase, resolved.userId);
    const displayName =
      formatFullName(resolved.profile.first_name, resolved.profile.last_name) !== "—"
        ? formatFullName(resolved.profile.first_name, resolved.profile.last_name)
        : (authUser.email ?? "Klient");

    const boundClientId = resolved.clientId;

    const { data: clientRow } = await supabase
      .from("clients")
      .select("session_path_background_url")
      .eq("user_id", resolved.userId)
      .maybeSingle();

    const backgroundUrl =
      clientRow?.session_path_background_url?.trim() || LOH_SESSION_PATH_DEFAULT_BG;

    return (
      <SessionPathHero
        title={`SITZUNGSÜBERSICHT FÜR ${displayName.toUpperCase()}`}
        backgroundUrl={backgroundUrl}
        backLink={
          <Link
            href={`/therapist/clients/${resolved.clientId.toLowerCase()}`}
            className="text-sm text-[#63eca9] hover:underline"
          >
            ← Zurück zur Klienten-Akte
          </Link>
        }
        subtitle={
          <>
            Registriert: {formatGermanDateTime(resolved.profile.created_at)} · Letzter Login:{" "}
            {formatGermanDateTime(authUser.last_sign_in_at)}
          </>
        }
      >
        <TherapySessionsWorkspace
          sessions={sessions}
          mode="therapist"
          clientId={boundClientId}
          currentUserId={user.id}
          initialSessionId={initialSessionId}
        />
      </SessionPathHero>
    );
  } catch {
    notFound();
  }
}
