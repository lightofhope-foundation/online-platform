import { SetterHomeTiles } from "@/components/setter/SetterHomeTiles";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  fetchMetaLeads,
  isUntouchedMetaLead,
} from "@/lib/notion/metaLeads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SetterHomePage() {
  await checkSetterAccess();
  const supabase = getSupabaseAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "client");
  const userIds = (profiles ?? []).map((p) => p.user_id);

  let lohOpen = 0;
  if (userIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("user_id, therapist_user_id")
      .in("user_id", userIds)
      .is("deleted_at", null);

    const assigned = new Set(
      (clients ?? []).filter((c) => c.therapist_user_id).map((c) => c.user_id)
    );
    lohOpen = userIds.filter((id) => !assigned.has(id)).length;
  }

  const { leads: notionLeads } = await fetchMetaLeads("all");
  const notionOpen = notionLeads.filter(isUntouchedMetaLead).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-section font-normal text-white">Setter & Closer</h1>
        <p className="mt-1 text-sm text-white/60">
          Notion-Pipeline komplett laden (Leadboard) sowie offene Leads bearbeiten.
          Mehrfachrollen: als Therapeut wechselt du oben rechts in die Therapeuten-Ansicht.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-4 shadow-[0_0_40px_rgba(99,236,169,0.06)]">
          <div className="text-sm text-white/55">Notion · unberührt</div>
          <div className="mt-1 text-3xl font-semibold text-white">{notionOpen}</div>
          <p className="mt-1 text-[11px] text-white/40">
            von {notionLeads.length} Meta-Kontakten
          </p>
        </div>
        <div className="rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-5 py-4">
          <div className="text-sm text-white/55">LOH · ohne Therapeut</div>
          <div className="mt-1 text-3xl font-semibold text-white">{lohOpen}</div>
        </div>
      </div>

      <SetterHomeTiles />
    </div>
  );
}
