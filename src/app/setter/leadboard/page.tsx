import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchMetaLeads } from "@/lib/notion/metaLeads";
import { NotionLeadboardBoard } from "@/components/setter/NotionLeadboardBoard";

export const dynamic = "force-dynamic";

export default async function SetterLeadboardPage() {
  await checkSetterAccess();
  const { leads, error, fetchedAt } = await fetchMetaLeads(80);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-section font-normal text-white">Notion Leadboard</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Live-Lesezugriff auf die Notion-DB <span className="text-white/80">Meta</span> —
          Kartenansicht nach Status SET (nur Anzeige). Funnel-KPIs folgen, sobald die Regeln mit
          Dincer festliegen.
        </p>
      </div>

      <NotionLeadboardBoard leads={leads} error={error} fetchedAt={fetchedAt} groupBy="statusSet" />
    </div>
  );
}
