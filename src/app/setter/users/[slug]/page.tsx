import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadDetailCards } from "@/components/lead-vault/LeadDetailCards";
import { SetterClientTherapistAssignment } from "@/components/setter/SetterClientTherapistAssignment";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchClientTherapistMap,
  fetchTherapistOptions,
} from "@/lib/adminTherapistData";
import { isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { parseIntake } from "@/lib/leadVault";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function SetterClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);
  if (!isValidClientIdFormat(clientId)) notFound();

  const { supabase } = await checkSetterAccess();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, role, first_name, last_name, client_id, display_alias")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!profile?.client_id || profile.role !== "client") notFound();

  const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
  const therapists = await fetchTherapistOptions(supabase);
  const therapistMap = await fetchClientTherapistMap(supabase);
  const assigned = therapistMap.get(profile.user_id);

  const { data: clientRow } = await supabase
    .from("clients")
    .select("intake_data, access_revoked, therapist_user_id")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  const intake = parseIntake(clientRow?.intake_data);
  if (!intake.email && authUser.user?.email) {
    intake.email = authUser.user.email;
  }

  const label = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    authUser.user?.email,
    profile.display_alias
  );

  const alreadyAssigned = Boolean(clientRow?.therapist_user_id ?? assigned?.therapist_user_id);

  return (
    <div className="space-y-8">
      <Link href="/setter/users" className="text-sm text-[#63eca9] hover:underline">
        ← Offene Leads
      </Link>

      {alreadyAssigned ? (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100/90">
          Dieser Klient hat bereits einen Therapeuten und gehört nicht mehr zur offenen
          Setter-Pipeline. Du kannst die Akte noch einsehen.
        </p>
      ) : null}

      <LeadDetailCards
        name={label}
        clientId={profile.client_id}
        accessRevoked={clientRow?.access_revoked ?? false}
        intake={intake}
        eyebrow="Lead"
        statusHint={alreadyAssigned ? "bereits zugewiesen" : "offener Lead"}
        editable
        saveVia="setter"
      />

      <div className="mx-1 border-t border-white/10" role="separator" aria-hidden />

      <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
        <h2 className="mb-1 text-lg font-medium text-white">Therapeut zuweisen</h2>
        <p className="mb-4 text-sm text-white/50">
          Nach der Zuweisung verschwindet der Lead aus „Offene Leads“ und erscheint in der
          Klientenakte des Therapeuten.
        </p>
        <SetterClientTherapistAssignment
          clientUserId={profile.user_id}
          currentTherapistUserId={assigned?.therapist_user_id ?? null}
          currentTherapistLabel={assigned?.label ?? null}
          therapists={therapists}
        />
      </section>
    </div>
  );
}
