"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { bulkUpdateUserAccessLevel } from "@/app/admin/users/actions";
import type { AccessLevelOption } from "@/lib/accessLevels";
import { formatAccessLevelLabel } from "@/lib/accessLevels";

export type AdminUserRow = {
  user_id: string;
  client_id: string | null;
  email: string;
  name: string;
  role: string;
  access_level: number;
  video_progress: number | null;
  created_at: string;
  last_login: string;
  detail_href: string | null;
};

type AdminUsersTableProps = {
  rows: AdminUserRow[];
  accessLevels: AccessLevelOption[];
};

const thClass =
  "border-b border-r border-white/10 px-3 py-2.5 font-medium text-white/70 last:border-r-0";
const tdClass =
  "border-b border-r border-white/[0.08] px-3 py-2.5 last:border-r-0 align-middle";

export function AdminUsersTable({ rows, accessLevels }: AdminUsersTableProps) {
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLevel, setBulkLevel] = useState(
    String(accessLevels[0]?.access_level ?? 0)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.client_id,
        r.email,
        r.name,
        r.role,
        formatAccessLevelLabel(r.access_level, accessLevels),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, accessLevels]);

  const clientRows = filtered.filter((r) => r.role === "client");
  const allClientsSelected =
    clientRows.length > 0 && clientRows.every((r) => selected.has(r.user_id));

  const toggleBulkMode = () => {
    setBulkMode((v) => !v);
    setSelected(new Set());
    setMessage(null);
  };

  const toggleRow = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllClients = () => {
    if (allClientsSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clientRows.map((r) => r.user_id)));
    }
  };

  const applyBulk = () => {
    const level = Number(bulkLevel);
    if (Number.isNaN(level)) return;
    startTransition(async () => {
      setMessage(null);
      const result = await bulkUpdateUserAccessLevel([...selected], level);
      if (result.ok) {
        setMessage(`${result.updated} Klient(en) auf ${formatAccessLevelLabel(level, accessLevels)} gesetzt.`);
        setSelected(new Set());
        setBulkMode(false);
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen (Nutzer-ID, E-Mail, Name, Stufe …)"
          className="w-full max-w-md rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#63eca9]/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={toggleBulkMode}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
            bulkMode
              ? "border-[#63eca9]/60 bg-[#63eca9]/15 text-[#63eca9]"
              : "border-white/15 bg-white/[0.04] text-white hover:border-white/25"
          }`}
        >
          {bulkMode ? "Mehrfache Bearbeitung beenden" : "Mehrfache Bearbeitung"}
        </button>
      </div>

      {bulkMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <button
            type="button"
            onClick={toggleSelectAllClients}
            className="text-sm text-[#63eca9] hover:underline"
          >
            {allClientsSelected ? "Auswahl aufheben" : "Alle Klienten wählen"}
          </button>
          <span className="text-sm text-white/50">
            {selected.size} ausgewählt
          </span>
          <label className="flex items-center gap-2 text-sm text-white/70">
            Stufe
            <select
              value={bulkLevel}
              onChange={(e) => setBulkLevel(e.target.value)}
              className="rounded-md border border-white/15 bg-black/40 px-2 py-1.5 text-white"
            >
              {accessLevels.map((l) => (
                <option key={l.access_level} value={l.access_level}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={applyBulk}
            className="rounded-full bg-[#63eca9] px-4 py-1.5 text-sm font-medium text-black disabled:opacity-40"
          >
            {pending ? "Speichern …" : "Stufe zuweisen"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${message.includes("fehlgeschlagen") || message.includes("Ungültig") || message.includes("Keine") ? "text-red-400" : "text-[#63eca9]"}`}
        >
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="bg-white/[0.04] text-left">
            <tr>
              {bulkMode && (
                <th className={`${thClass} w-10`} aria-label="Auswahl" />
              )}
              <th className={thClass}>Nutzer-ID</th>
              <th className={thClass}>E-Mail</th>
              <th className={thClass}>Name</th>
              <th className={thClass}>Rolle</th>
              <th className={thClass}>Stufe</th>
              <th className={thClass}>Video-Fortschritt</th>
              <th className={thClass}>Erstellt</th>
              <th className={thClass}>Letzter Login</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.user_id} className="hover:bg-white/[0.03]">
                {bulkMode && (
                  <td className={tdClass}>
                    {r.role === "client" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(r.user_id)}
                        onChange={() => toggleRow(r.user_id)}
                        className="h-4 w-4 rounded border-white/30 accent-[#63eca9]"
                        aria-label={`${r.name} auswählen`}
                      />
                    ) : null}
                  </td>
                )}
                <td className={`${tdClass} font-mono text-xs`}>
                  <CellLink href={r.detail_href}>{r.client_id ?? "—"}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.email}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.name}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.role}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>
                    {r.role === "client"
                      ? formatAccessLevelLabel(r.access_level, accessLevels)
                      : "—"}
                  </CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>
                    {r.video_progress != null ? `${r.video_progress}%` : "—"}
                  </CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.created_at}</CellLink>
                </td>
                <td className={tdClass}>
                  <CellLink href={r.detail_href}>{r.last_login}</CellLink>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={bulkMode ? 9 : 8}
                  className="border-b border-white/10 px-3 py-8 text-center text-white/50"
                >
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellLink({
  href,
  children,
}: {
  href: string | null;
  children: ReactNode;
}) {
  if (!href) {
    return <span className="block text-white/80">{children}</span>;
  }
  return (
    <Link href={href} className="block transition-colors hover:text-[#63eca9]">
      {children}
    </Link>
  );
}
