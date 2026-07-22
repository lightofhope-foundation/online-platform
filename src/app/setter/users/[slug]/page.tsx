import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientIntakeForm } from "@/components/setter/ClientIntakeForm";
import { SetterClientTherapistAssignment } from "@/components/setter/SetterClientTherapistAssignment";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchClientTherapistMap,
  fetchTherapistOptions,
} from "@/lib/adminTherapistData";
import { isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import type { ClientIntakeData } from "@/app/setter/actions";

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
    .select("intake_data")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  const intake = (clientRow?.intake_data ?? {}) as ClientIntakeData;
  const label = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    authUser.user?.email,
    profile.display_alias
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/setter/users" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zur Liste
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{label}</h1>
        <p className="mt-1 text-sm text-white/55">
          {profile.client_id} · {authUser.user?.email ?? "—"}
        </p>
      </div>

      <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-lg font-medium">Therapeut zuweisen</h2>
        <SetterClientTherapistAssignment
          clientUserId={profile.user_id}
          currentTherapistUserId={assigned?.therapist_user_id ?? null}
          currentTherapistLabel={assigned?.label ?? null}
          therapists={therapists}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Klienten-Akte (Erstgespräch)</h2>
        <p className="mb-6 text-sm text-white/50">
          Ersatz für Milanote — strukturierte Aufnahme nach dem Closer-Gespräch.
        </p>
        <ClientIntakeForm clientUserId={profile.user_id} initial={intake} />
      </section>
    </div>
  );
}
