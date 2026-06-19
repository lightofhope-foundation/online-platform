import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapistClientTiles } from "@/components/therapist/TherapistClientTiles";
import { checkTherapistAccess } from "@/lib/authRoles";
import { formatGermanDateTime, isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { formatAccessLevelLabel } from "@/lib/accessLevels";

export const dynamic = "force-dynamic";

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

export default async function TherapistClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  const { user, supabase } = await checkTherapistAccess();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, role, created_at, first_name, last_name, client_id, access_level")
    .eq("client_id", clientId)
    .maybeSingle();

  if (profileError || !profile?.client_id || profile.role !== "client") {
    notFound();
  }

  const { data: assignment } = await supabase
    .from("clients")
    .select("user_id, therapist_user_id")
    .eq("user_id", profile.user_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assignment || assignment.therapist_user_id !== user.id) {
    notFound();
  }

  const { data: authUserRes } = await supabase.auth.admin.getUserById(profile.user_id);
  const authUser = authUserRes?.user ?? null;
  if (!authUser) {
    notFound();
  }

  const accessLevels = await fetchAccessLevelOptions();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/therapist/clients" className="text-sm text-[#63eca9] hover:underline">
            ← Zurück zu Klient:innen
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {formatFullName(profile.first_name, profile.last_name)}
          </h1>
          <p className="text-sm text-white/60">
            Nutzer-ID <span className="font-mono text-white/80">{profile.client_id}</span>
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <h2 className="mb-4 text-lg font-medium">Stammdaten</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="E-Mail" value={authUser.email ?? "—"} />
          <InfoRow label="Zugangsstufe" value={formatAccessLevelLabel(profile.access_level ?? 0, accessLevels)} />
          <InfoRow label="Registriert" value={formatGermanDateTime(profile.created_at)} />
          <InfoRow label="Letzter Login" value={formatGermanDateTime(authUser.last_sign_in_at)} />
        </dl>
      </div>

      <TherapistClientTiles clientId={profile.client_id} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="mt-1 text-sm text-white/90">{value}</dd>
    </div>
  );
}
