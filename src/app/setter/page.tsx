import { SetterHomeTiles } from "@/components/setter/SetterHomeTiles";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function SetterHomePage() {
  await checkSetterAccess();
  const supabase = getSupabaseAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "client");
  const userIds = (profiles ?? []).map((p) => p.user_id);

  let openLeads = 0;
  if (userIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("user_id, therapist_user_id")
      .in("user_id", userIds)
      .is("deleted_at", null);

    const assigned = new Set(
      (clients ?? []).filter((c) => c.therapist_user_id).map((c) => c.user_id)
    );
    // Clients without a clients-row or without therapist count as open
    const withRow = new Set((clients ?? []).map((c) => c.user_id));
    openLeads = userIds.filter((id) => !assigned.has(id)).length;
    // Also count profiles that have no clients row yet
    void withRow;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-section font-normal text-white">Setter & Closer</h1>
        <p className="mt-1 text-sm text-white/60">
          Offene Leads anlegen und Erstkontakt (grüne Daten) pflegen — ohne Schachtel-Vault.
          Mehrfachrollen möglich: als Therapeut wechselt du oben rechts in die Therapeuten-Ansicht.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div className="text-sm text-white/50">Offene Leads (ohne Therapeut)</div>
        <div className="mt-1 text-3xl font-semibold text-white">{openLeads}</div>
      </div>

      <SetterHomeTiles />
    </div>
  );
}
