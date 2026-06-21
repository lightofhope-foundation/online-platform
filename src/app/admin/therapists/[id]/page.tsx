import Link from "next/link";
import { notFound } from "next/navigation";
import { DisplayAliasEditor } from "@/components/admin/DisplayAliasEditor";
import { TherapistClientAssignmentPanel } from "@/components/admin/TherapistClientAssignmentPanel";
import { TherapistViewTabs } from "@/components/admin/TherapistViewTabs";
import { checkAdminAccess } from "@/lib/checkAdminAccess";
import {
  fetchUnassignedClientOptions,
  fetchTherapistsWithClients,
} from "@/lib/adminTherapistData";
import { formatGermanDateTime } from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function AdminTherapistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await checkAdminAccess();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, role, first_name, last_name, display_alias, created_at, client_id")
    .eq("user_id", id)
    .maybeSingle();

  if (error || !profile || profile.role !== "therapist") {
    notFound();
  }

  const { data: authUserRes } = await supabase.auth.admin.getUserById(profile.user_id);
  const authUser = authUserRes?.user;
  if (!authUser) notFound();

  const [{ therapists }, unassignedClients] = await Promise.all([
    fetchTherapistsWithClients(supabase),
    fetchUnassignedClientOptions(supabase),
  ]);

  const therapistData = therapists.find((t) => t.user_id === profile.user_id);
  const assignedClients = therapistData?.clients ?? [];

  const label = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    authUser.email,
    profile.display_alias
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/therapists" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zu Therapeuten
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{label}</h1>
        <p className="text-sm text-white/60">{authUser.email}</p>
      </div>

      <TherapistViewTabs active="list" />

      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">Anzeige-Alias</h2>
        <DisplayAliasEditor
          userId={profile.user_id}
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={authUser.email ?? null}
          currentAlias={profile.display_alias}
          revalidatePaths={[`/admin/therapists/${profile.user_id}`]}
        />
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">
          Klient:innen zuweisen ({assignedClients.length})
        </h2>
        <TherapistClientAssignmentPanel
          therapistUserId={profile.user_id}
          assignedClients={assignedClients}
          unassignedClients={unassignedClients}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoRow label="Registriert" value={formatGermanDateTime(profile.created_at)} />
        <InfoRow label="Letzter Login" value={formatGermanDateTime(authUser.last_sign_in_at)} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
