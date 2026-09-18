import Link from "next/link";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchMetaLeads } from "@/lib/notion/metaLeads";
import { NotionLeadboardBoard } from "@/components/setter/NotionLeadboardBoard";

export const dynamic = "force-dynamic";

export default async function ErstgespraechlerHomePage() {
  await checkSetterAccess();
  const { leads, error, fetchedAt } = await fetchMetaLeads(80);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#63eca9]/80">
          Ansicht Erstgesprächler
        </p>
        <h1 className="typo-section mt-1 font-normal text-white">Erstgespräche</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Fokus auf zugewiesene EG-Termine und Status aus Notion Meta (nur Lesen). Setter-Pipeline
          erreichst du über den Rollen-Switcher oben.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/setter/leadboard"
          className="rounded-full border border-[#63eca9]/35 bg-[#63eca9]/12 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/20"
        >
          Vollständiges Leadboard
        </Link>
        <Link
          href="/setter/users"
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/70 hover:border-white/25 hover:text-white"
        >
          Offene LOH-Leads
        </Link>
      </div>

      <NotionLeadboardBoard
        leads={leads}
        error={error}
        fetchedAt={fetchedAt}
        groupBy="statusEg"
        emptyHint="Keine EG-Status-Einträge geladen."
      />
    </div>
  );
}
