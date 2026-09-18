import Link from "next/link";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchMetaLeads } from "@/lib/notion/metaLeads";
import { NotionLeadboardBoard } from "@/components/setter/NotionLeadboardBoard";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function ErstgespraechlerHomePage() {
  const { user, supabase } = await checkSetterAccess();
  const { leads, error, fetchedAt } = await fetchMetaLeads(150);

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, display_alias")
    .eq("user_id", user.id)
    .maybeSingle();

  const label = resolvePersonLabel(
    profile?.first_name,
    profile?.last_name,
    user.email,
    profile?.display_alias
  );

  const viewerAliases = [
    profile?.display_alias,
    profile?.first_name,
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    label,
    user.email?.split("@")[0],
  ].filter((v): v is string => Boolean(v && v.trim()));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#63eca9]/80">
          Ansicht Erstgesprächler
        </p>
        <h1 className="typo-section mt-1 font-normal text-white">Erstgespräche</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Pipeline nach Status EG — Filter „Meine EG“ zeigt deine zugewiesenen Gespräche.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/setter/leadboard"
          className="rounded-full border border-[#63eca9]/35 bg-[#63eca9]/12 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/20"
        >
          Setter-Leadboard
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
        viewerAliases={viewerAliases}
        defaultGroupBy="statusEg"
        defaultScope="mineEg"
        emptyHint="Keine EG-Status-Einträge geladen."
      />
    </div>
  );
}
