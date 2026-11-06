import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadDetailCards } from "@/components/lead-vault/LeadDetailCards";
import { LeadLifecycleActions } from "@/components/setter/LeadLifecycleActions";
import { LeadEgAssignment } from "@/components/setter/LeadEgAssignment";
import { SetterClientTherapistAssignment } from "@/components/setter/SetterClientTherapistAssignment";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import {
  fetchClientTherapistMap,
  fetchTherapistOptions,
} from "@/lib/adminTherapistData";
import { isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { parseIntake } from "@/lib/leadVault";
import { resolvePersonLabel } from "@/lib/formatDisplayName";
import {
  canAssignTherapist,
  normalizePipelineStatus,
  PIPELINE_STATUS_LABEL,
} from "@/lib/pipelineStatus";
import { userHasPortalRole } from "@/lib/userRoles";

export const dynamic = "force-dynamic";

export default async function SetterClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const egView = sp.view === "eg";
  const clientId = normalizeClientIdForUrl(slug);
  if (!isValidClientIdFormat(clientId)) notFound();

  const { supabase, roles } = await checkSetterAccess();

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
    .select(
      "intake_data, access_revoked, therapist_user_id, pipeline_status, erstgespraechler_user_id"
    )
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

  const pipelineStatus = normalizePipelineStatus(clientRow?.pipeline_status);
  const alreadyAssigned = Boolean(
    clientRow?.therapist_user_id ?? assigned?.therapist_user_id
  );

  const isSetter =
    userHasPortalRole(roles, "setter") ||
    userHasPortalRole(roles, "setter_closer") ||
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead");
  const isEg =
    userHasPortalRole(roles, "erstgespraechler") ||
    userHasPortalRole(roles, "setter_closer") ||
    userHasPortalRole(roles, "admin") ||
    userHasPortalRole(roles, "teamlead");

  const showConvert = isSetter && pipelineStatus === "lead";
  const showTherapistAssign =
    isEg && canAssignTherapist(pipelineStatus);
  // Setter can also assign therapist once client
  const showTherapistAssignSetter =
    isSetter && canAssignTherapist(pipelineStatus);
  const showTherapistSection = showTherapistAssign || showTherapistAssignSetter;

  // EG options
  const { data: egProfiles } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name, display_alias, role")
    .in("role", ["erstgespraechler", "setter_closer"]);
  const { data: egExtras } = await supabase
    .from("profile_extra_roles")
    .select("user_id, role")
    .in("role", ["erstgespraechler", "setter_closer"]);

  const egIds = new Set<string>();
  (egProfiles ?? []).forEach((p) => egIds.add(p.user_id));
  (egExtras ?? []).forEach((p) => egIds.add(p.user_id));

  const egOptions = [...egIds].map((id) => {
    const p = (egProfiles ?? []).find((x) => x.user_id === id);
    return {
      user_id: id,
      label: p
        ? resolvePersonLabel(p.first_name, p.last_name, null, p.display_alias)
        : id.slice(0, 8),
    };
  });

  // Load missing EG labels
  const missing = egOptions.filter((o) => o.label === o.user_id.slice(0, 8));
  if (missing.length > 0) {
    const { data: more } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, display_alias")
      .in(
        "user_id",
        missing.map((m) => m.user_id)
      );
    for (const p of more ?? []) {
      const opt = egOptions.find((o) => o.user_id === p.user_id);
      if (opt) {
        opt.label = resolvePersonLabel(
          p.first_name,
          p.last_name,
          null,
          p.display_alias
        );
      }
    }
  }

  let currentEgLabel: string | null = null;
  if (clientRow?.erstgespraechler_user_id) {
    const { data: egP } = await supabase
      .from("profiles")
      .select("first_name, last_name, display_alias")
      .eq("user_id", clientRow.erstgespraechler_user_id)
      .maybeSingle();
    if (egP) {
      currentEgLabel = resolvePersonLabel(
        egP.first_name,
        egP.last_name,
        null,
        egP.display_alias
      );
    }
  }

  const backHref = egView ? "/setter/eg" : "/setter/leads";
  const backLabel = egView ? "← Zugewiesene Leads" : "← Leads";
  const detailQuery = egView ? "?view=eg" : "";

  return (
    <div className="space-y-8">
      <Link href={backHref} className="text-sm text-[#63eca9] hover:underline">
        {backLabel}
      </Link>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
        <span className="rounded-full border border-white/15 px-2.5 py-1">
          {PIPELINE_STATUS_LABEL[pipelineStatus]}
        </span>
        {alreadyAssigned ? (
          <span className="rounded-full border border-amber-400/30 px-2.5 py-1 text-amber-100/80">
            Therapeut zugewiesen
          </span>
        ) : null}
        {currentEgLabel ? (
          <span className="rounded-full border border-white/15 px-2.5 py-1">
            EG: {currentEgLabel}
          </span>
        ) : null}
      </div>

      <LeadDetailCards
        name={label}
        clientId={profile.client_id}
        accessRevoked={clientRow?.access_revoked ?? false}
        intake={intake}
        eyebrow={pipelineStatus === "client" ? "Klient" : "Lead"}
        statusHint={PIPELINE_STATUS_LABEL[pipelineStatus]}
        editable
        saveVia="setter"
      />

      {showConvert ? (
        <LeadLifecycleActions clientUserId={profile.user_id} />
      ) : null}

      {isSetter && pipelineStatus === "lead" ? (
        <LeadEgAssignment
          clientUserId={profile.user_id}
          currentEgUserId={clientRow?.erstgespraechler_user_id ?? null}
          currentEgLabel={currentEgLabel}
          options={egOptions}
        />
      ) : null}

      {showTherapistSection ? (
        <>
          <div className="mx-1 border-t border-white/10" role="separator" aria-hidden />
          <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
            <h2 className="mb-1 text-lg font-medium text-white">Therapeut zuweisen</h2>
            <p className="mb-4 text-sm text-white/50">
              Nur für Klienten (nicht für Leads). Danach unter „Meine Klienten“ des
              Therapeuten.
            </p>
            <SetterClientTherapistAssignment
              clientUserId={profile.user_id}
              currentTherapistUserId={assigned?.therapist_user_id ?? null}
              currentTherapistLabel={assigned?.label ?? null}
              therapists={therapists}
              redirectOnAssign={egView ? `/setter/eg${detailQuery}` : "/setter/clients"}
            />
          </section>
        </>
      ) : pipelineStatus === "lead" ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/55">
          Therapeut-Zuweisung erst nach Lead→Klient (durch Setter).
        </p>
      ) : null}
    </div>
  );
}
