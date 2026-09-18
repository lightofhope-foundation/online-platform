"use client";

import { useMemo, useState } from "react";

import { NotionLeadDetailModal } from "@/components/setter/NotionLeadDetailModal";
import type { NotionMetaLead } from "@/lib/notion/metaLeads";

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
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

type Props = {
  leads: NotionMetaLead[];
};

export function NotionOpenLeadsList({ leads }: Props) {
  const [q, setQ] = useState("");
  const [openLead, setOpenLead] = useState<{ id: string; name: string } | null>(
    null
  );

  const filtered = useMemo(() => {
    const query = q
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
    if (!query) return leads;
    return leads.filter((l) => {
      const blob = [l.name, l.status, l.statusSet, l.statusEg]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return blob.includes(query);
    });
  }, [leads, q]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/50">
          {filtered.length === leads.length
            ? `${leads.length} unberührte Notion-Leads`
            : `${filtered.length} von ${leads.length}`}
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche Name …"
          className="w-full max-w-xs rounded-full border border-white/12 bg-black/35 px-4 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#63eca9]/4 sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/50">
          Keine Treffer.
        </p>
      ) : (
        <div className="loh-scroll max-h-[70vh] overflow-auto rounded-2xl border border-white/12">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-white/10 bg-black/70 text-[11px] uppercase tracking-wide text-white/45 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Status SET</th>
                <th className="px-4 py-3 font-medium">Zuletzt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer transition hover:bg-[#63eca9]/08"
                  onClick={() =>
                    setOpenLead({ id: lead.id, name: lead.name })
                  }
                >
                  <td className="px-4 py-3 font-medium text-[#63eca9]">
                    {lead.name}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {lead.status?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {lead.statusSet?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-white/45">
                    {fmtWhen(lead.lastEdited)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NotionLeadDetailModal
        leadId={openLead?.id ?? null}
        leadName={openLead?.name ?? null}
        onClose={() => setOpenLead(null)}
      />
    </div>
  );
}
