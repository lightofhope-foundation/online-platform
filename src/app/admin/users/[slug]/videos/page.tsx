import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { UserVideosTable } from "@/components/admin/UserVideosTable";
import { loadUserVideoTableRows, resolveClientProfileByClientId } from "@/lib/clientVideoUnlock";
import {
  formatGermanDateTime,
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  reseedUserVideoUnlocks,
  updateUserVideoUnlock,
} from "./actions";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function AdminUserVideosPage({
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
  let resolved;
  try {
    resolved = await resolveClientProfileByClientId(admin, clientId);
  } catch {
    notFound();
  }

  const { data: authUserRes } = await admin.auth.admin.getUserById(resolved.userId);
  const authUser = authUserRes?.user;
  if (!authUser) {
    notFound();
  }

  const tableRows = await loadUserVideoTableRows(admin, resolved.userId);

  const displayName =
    formatFullName(resolved.profile.first_name, resolved.profile.last_name) !== "—"
      ? formatFullName(resolved.profile.first_name, resolved.profile.last_name)
      : (authUser.email ?? "Nutzer");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/users/${resolved.clientId}`}
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zum Nutzer
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
        updateUnlock={updateUserVideoUnlock}
        reseedUnlocks={reseedUserVideoUnlocks}
      />
    </div>
  );
}
