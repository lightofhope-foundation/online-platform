import Link from "next/link";
import { notFound } from "next/navigation";
import { UserVideosTable } from "@/components/admin/UserVideosTable";
import { checkTherapistAccess } from "@/lib/authRoles";
import {
  assertTherapistOwnsClient,
  loadUserVideoTableRows,
  resolveClientProfileByClientId,
} from "@/lib/clientVideoUnlock";
import {
  formatGermanDateTime,
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import {
  reseedTherapistClientVideoUnlocks,
  updateTherapistClientVideoUnlock,
} from "./actions";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function TherapistClientVideosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
    if (!authUser) {
      notFound();
    }

    const tableRows = await loadUserVideoTableRows(supabase, resolved.userId);
    const displayName =
      formatFullName(resolved.profile.first_name, resolved.profile.last_name) !== "—"
        ? formatFullName(resolved.profile.first_name, resolved.profile.last_name)
        : (authUser.email ?? "Klient");

    return (
      <div className="space-y-8">
        <div>
          <Link
            href={`/therapist/clients/${resolved.clientId.toLowerCase()}`}
            className="text-sm text-[#63eca9] hover:underline"
          >
            ← Zurück zur Klienten-Akte
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Video-Fortschritt & Freischaltung</h1>
          <p className="mt-1 text-sm text-white/60">
            {displayName} · Nutzer-ID{" "}
            <span className="font-mono text-white/80">{resolved.clientId}</span>
          </p>
          <p className="mt-1 text-xs text-white/40">
            Registriert: {formatGermanDateTime(resolved.profile.created_at)} · Letzter Login:{" "}
            {formatGermanDateTime(authUser.last_sign_in_at)}
          </p>
        </div>

        <UserVideosTable
          clientId={resolved.clientId}
          rows={tableRows}
          updateUnlock={updateTherapistClientVideoUnlock}
          reseedUnlocks={reseedTherapistClientVideoUnlocks}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
