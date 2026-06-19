"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type AdminTherapistRow = {
  user_id: string;
  email: string;
  display_label: string;
  display_alias: string | null;
  client_count: number;
  last_login: string;
  detail_href: string;
};

type AdminTherapistsTableProps = {
  rows: AdminTherapistRow[];
};

const thClass =
  "whitespace-nowrap border-b border-r border-white/10 px-3 py-2.5 font-medium text-white/70 last:border-r-0";
const tdClass =
  "whitespace-nowrap border-b border-r border-white/[0.08] px-3 py-2.5 last:border-r-0 align-middle";

export function AdminTherapistsTable({ rows }: AdminTherapistsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.display_label, r.display_alias, r.email, String(r.client_count)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Suche nach Alias, Name oder E-Mail …"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#63eca9]/50 focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              <th className={thClass}>Alias / Name</th>
              <th className={thClass}>E-Mail</th>
              <th className={thClass}>Klient:innen</th>
              <th className={thClass}>Letzter Login</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id} className="hover:bg-white/[0.02]">
                <td className={tdClass}>
                  <Link href={r.detail_href} className="text-[#63eca9] hover:underline">
                    {r.display_label}
                  </Link>
                </td>
                <td className={tdClass}>{r.email}</td>
                <td className={tdClass}>{r.client_count}</td>
                <td className={tdClass}>{r.last_login}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/50">
                  {rows.length === 0
                    ? "Noch keine Therapeuten angelegt."
                    : "Keine Treffer für die Suche."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
