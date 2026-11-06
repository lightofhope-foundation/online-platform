import Link from "next/link";
import { TherapistClientsTable, type TherapistClientRow } from "@/components/therapist/TherapistClientsTable";
import { checkTherapistAccess } from "@/lib/authRoles";
import { formatGermanDateTime } from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function TherapistHomePage() {
  const { user, supabase, profile } = await checkTherapistAccess();

  const { data: assignments } = await supabase
    .from("clients")
    .select("user_id, created_at")
    .eq("therapist_user_id", user.id)
    .eq("pipeline_status", "client")
    .is("deleted_at", null);

  const clientUserIds = (assignments ?? []).map((a) => a.user_id);

  let profiles: {
    user_id: string;
    client_id: string | null;
    first_name: string | null;
    last_name: string | null;
    access_level: number;
    created_at: string;
    display_alias: string | null;
  }[] = [];

  if (clientUserIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, client_id, first_name, last_name, access_level, created_at, display_alias")
      .in("user_id", clientUserIds);
    profiles = data ?? [];
  }

  const rows: TherapistClientRow[] = profiles.map((p) => {
    const detailHref = p.client_id ? `/therapist/clients/${p.client_id.toLowerCase()}` : null;
    return {
      user_id: p.user_id,
      client_id: p.client_id,
      email: "—",
      name: resolvePersonLabel(p.first_name, p.last_name, null, p.display_alias),
      access_level: p.access_level ?? 0,
      video_progress: 0,
      created_at: formatGermanDateTime(p.created_at),
      last_login: "—",
      detail_href: detailHref,
    };
  });

  const therapistName = formatFullName(profile?.first_name ?? null, profile?.last_name ?? null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="typo-section font-normal">Therapeut-Bereich</h1>
          <p className="text-sm text-white/60">
            Willkommen{therapistName !== "—" ? `, ${therapistName}` : ""}. Soft-Release:
            Fokus auf deine zugewiesenen Klienten — globale Suche findet alle Akten.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Meine Klient:innen" value={rows.length} />
        <Link
          href="/therapist/all-clients"
          className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 transition hover:border-[#63eca9]/35"
        >
          <div className="text-sm text-white/55">Alle Klienten</div>
          <div className="mt-1 text-sm text-[#63eca9]">Nach Therapeut öffnen →</div>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="typo-clients-heading font-normal">Meine Klient:innen</h2>
          <Link href="/therapist/clients" className="text-sm text-[#63eca9] hover:underline">
            Vollständige Liste
          </Link>
        </div>
        <TherapistClientsTable rows={rows} compact />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
      {hint ? <p className="mt-1 text-[11px] text-white/40">{hint}</p> : null}
    </div>
  );
}
