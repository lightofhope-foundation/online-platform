import type { NotionMetaLead } from "@/lib/notion/metaLeads";

function fmtWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const COLUMN_ORDER_SET = [
  "Neuer Kontakt",
  "1st Reminder",
  "2nd Reminder",
  "Setting terminiert",
  "Terminiert EG",
  "Warteliste Set",
  "Lost",
];

const COLUMN_ORDER_EG = [
  "Terminiert",
  "RP ?",
  "Commited!",
  "Lost",
  "Nicht erschienen",
];

function columnKey(lead: NotionMetaLead, groupBy: "statusSet" | "statusEg"): string {
  const raw = groupBy === "statusEg" ? lead.statusEg : lead.statusSet;
  const v = (raw ?? "").trim();
  return v || "Ohne Status";
}

function orderedColumns(
  keys: string[],
  preferred: string[]
): string[] {
  const set = new Set(keys);
  const out: string[] = [];
  for (const p of preferred) {
    if (set.has(p)) {
      out.push(p);
      set.delete(p);
    }
  }
  const rest = [...set].sort((a, b) => a.localeCompare(b, "de"));
  // Keep "Ohne Status" at end
  const without = rest.filter((k) => k !== "Ohne Status");
  if (rest.includes("Ohne Status")) without.push("Ohne Status");
  return [...out, ...without];
}

type Props = {
  leads: NotionMetaLead[];
  error: string | null;
  fetchedAt: string;
  groupBy?: "statusSet" | "statusEg";
  emptyHint?: string;
};

export function NotionLeadboardBoard({
  leads,
  error,
  fetchedAt,
  groupBy = "statusSet",
  emptyHint = "Keine Einträge geladen.",
}: Props) {
  const preferred = groupBy === "statusEg" ? COLUMN_ORDER_EG : COLUMN_ORDER_SET;
  const buckets = new Map<string, NotionMetaLead[]>();
  for (const lead of leads) {
    const key = columnKey(lead, groupBy);
    const list = buckets.get(key) ?? [];
    list.push(lead);
    buckets.set(key, list);
  }
  const columns = orderedColumns([...buckets.keys()], preferred);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-xs text-white/40">
          Stand Abruf: {fmtWhen(fetchedAt)} · {leads.length} Leads · gruppiert nach{" "}
          {groupBy === "statusEg" ? "Status EG" : "Status SET"}
        </p>
        <p className="text-[11px] text-white/35">Nur Lesen · Notion Meta</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {!error && leads.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-10 text-center text-sm text-white/50">
          {emptyHint}
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const items = buckets.get(col) ?? [];
          return (
            <section
              key={col}
              className="w-[260px] shrink-0 rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] shadow-[0_0_40px_rgba(99,236,169,0.04)]"
            >
              <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5">
                <h2 className="truncate text-sm font-medium text-white">{col}</h2>
                <span className="rounded-full bg-[#63eca9]/15 px-2 py-0.5 text-[11px] text-[#63eca9]">
                  {items.length}
                </span>
              </header>
              <ul className="max-h-[62vh] space-y-2 overflow-y-auto p-2">
                {items.map((lead) => (
                  <li key={lead.id}>
                    <article className="rounded-xl border border-white/10 bg-black/35 p-3 transition hover:border-[#63eca9]/35 hover:bg-black/45">
                      {lead.url ? (
                        <a
                          href={lead.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm font-medium text-[#63eca9] hover:underline"
                        >
                          {lead.name}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-white">{lead.name}</p>
                      )}
                      <dl className="mt-2 space-y-1 text-[11px] text-white/50">
                        {lead.status ? (
                          <div className="flex justify-between gap-2">
                            <dt>Status</dt>
                            <dd className="text-right text-white/75">{lead.status}</dd>
                          </div>
                        ) : null}
                        {groupBy === "statusSet" && lead.statusEg ? (
                          <div className="flex justify-between gap-2">
                            <dt>EG</dt>
                            <dd className="text-right text-white/75">{lead.statusEg}</dd>
                          </div>
                        ) : null}
                        {groupBy === "statusEg" && lead.statusSet ? (
                          <div className="flex justify-between gap-2">
                            <dt>SET</dt>
                            <dd className="text-right text-white/75">{lead.statusSet}</dd>
                          </div>
                        ) : null}
                        {lead.setter ? (
                          <div className="flex justify-between gap-2">
                            <dt>Setter</dt>
                            <dd className="text-right text-white/75">{lead.setter}</dd>
                          </div>
                        ) : null}
                        {lead.eg ? (
                          <div className="flex justify-between gap-2">
                            <dt>EG-Person</dt>
                            <dd className="text-right text-white/75">{lead.eg}</dd>
                          </div>
                        ) : null}
                        {lead.rp != null || lead.rpSelect ? (
                          <div className="flex justify-between gap-2">
                            <dt>RP</dt>
                            <dd className="text-right text-white/75">
                              {lead.rpSelect ?? (lead.rp ? "ja" : "nein")}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
