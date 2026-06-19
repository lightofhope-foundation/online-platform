"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

export type TherapistClientRow = {
  user_id: string;
  client_id: string | null;
  email: string;
  name: string;
  access_level: number;
  video_progress: number;
  created_at: string;
  last_login: string;
  detail_href: string | null;
};

type TherapistClientsTableProps = {
  rows: TherapistClientRow[];
  compact?: boolean;
};

const thClass =
  "whitespace-nowrap border-b border-r border-white/10 px-3 py-2.5 font-medium text-white/70 last:border-r-0";
const tdClass =
  "whitespace-nowrap border-b border-r border-white/[0.08] px-3 py-2.5 last:border-r-0 align-middle";

function CellLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) return <span className="text-white/70">{children}</span>;
  return (
    <Link href={href} className="text-[#63eca9] hover:underline">
      {children}
    </Link>
  );
}

export function TherapistClientsTable({ rows, compact = false }: TherapistClientsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [r.client_id, r.email, r.name, String(r.access_level)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const displayRows = compact ? filtered.slice(0, 5) : filtered;

  return (
    <div className="space-y-4">
      {!compact ? (
        <input
          type="search"
          placeholder="Suche nach Nutzer-ID, Name oder E-Mail …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#63eca9]/50 focus:outline-none"
        />
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              <th className={thClass}>Nutzer-ID</th>
              <th className={thClass}>Name</th>
              <th className={thClass}>E-Mail</th>
              <th className={thClass}>Fortschritt</th>
              <th className={thClass}>Letzter Login</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r) => (
              <tr key={r.user_id} className="hover:bg-white/[0.02]">
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.client_id ?? "—"}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.name}</CellLink>
                </td>
                <td className={tdClass}>{r.email}</td>
                <td className={tdClass}>{r.video_progress} %</td>
                <td className={tdClass}>{r.last_login}</td>
              </tr>
            ))}
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                  {rows.length === 0
                    ? "Noch keine Klient:innen zugewiesen. Der Admin kann Zuweisungen in Phase T1 vornehmen."
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
