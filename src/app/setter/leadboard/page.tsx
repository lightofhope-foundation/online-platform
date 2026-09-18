import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchMetaLeads } from "@/lib/notion/metaLeads";
import { NotionLeadboardBoard } from "@/components/setter/NotionLeadboardBoard";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function SetterLeadboardPage() {
  const { user, supabase } = await checkSetterAccess();
  const { leads, error, fetchedAt, truncated } = await fetchMetaLeads("all");

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
        <h1 className="typo-section font-normal text-white">Notion Leadboard</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/60">
          Komplette Live-Pipeline aus Notion{" "}
          <span className="text-white/80">Pipeline Pro / Meta</span>
          {leads.length ? ` — ${leads.length} Kontakte geladen` : ""}.
          {truncated ? " (Abruf-Limit erreicht, ggf. unvollständig.)" : ""} Klick öffnet
          die Kundenkarte als Popup (nur Lesen).
        </p>
      </div>

      <NotionLeadboardBoard
        leads={leads}
        error={error}
        fetchedAt={fetchedAt}
        viewerAliases={viewerAliases}
        defaultGroupBy="statusSet"
      />
    </div>
  );
}
